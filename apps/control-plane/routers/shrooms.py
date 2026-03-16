from __future__ import annotations

import logging
import os
import uuid

from a2a.types import AgentCapabilities, AgentCard, AgentSkill
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.auth import get_principal
from core.controller import FALLBACK_MODELS, OLLAMA_HOST, ShroomController
from core.session_bindings import get_binding, upsert_binding
from core.events import ShroomEvent, ShroomEventType
from core.event_service import emit_event
from core.memory.beads import append_bead, format_beads_for_context, get_recent_beads
from core.nats_client import NatsEventBus
from core.ollama import (
    find_first_available,
    is_model_not_found_error,
    list_available_models,
    looks_like_ollama_error,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/shrooms", tags=["shrooms"])


def get_controller(request: Request) -> ShroomController:
    controller = getattr(request.app.state, "controller", None)
    if controller is None:
        raise HTTPException(status_code=503, detail="Control plane not initialized")
    return controller


def get_db(request: Request) -> Session:
    factory = getattr(request.app.state, "db_session_factory", None)
    if factory is None:
        raise HTTPException(status_code=503, detail="Database not initialized")
    session = factory()
    try:
        yield session
    finally:
        session.close()


def get_nats_bus(request: Request) -> NatsEventBus:
    bus = getattr(request.app.state, "nats_bus", None)
    if bus is None:
        raise HTTPException(status_code=503, detail="NATS bus not initialized")
    return bus


class MessageRequest(BaseModel):
    message: str
    session_id: str | None = None


class MessageResponse(BaseModel):
    shroom_id: str
    response: str
    session_id: str | None = None


@router.get("")
def list_shrooms(controller: ShroomController = Depends(get_controller)):
    return controller.list_shrooms()


@router.get("/{shroom_id}")
def get_shroom(shroom_id: str, controller: ShroomController = Depends(get_controller)):
    shroom = controller.get_shroom(shroom_id)
    if not shroom:
        raise HTTPException(status_code=404, detail=f"Shroom '{shroom_id}' not found")
    return shroom


def _manifest_to_agent_card(shroom_id: str, shroom: dict, base_url: str) -> AgentCard:
    from core.skills import SKILLS_CATALOG
    skills = shroom.get("skills") or []
    agent_skills = [
        AgentSkill(
            id=s,
            name=SKILLS_CATALOG.get(s, {}).get("name", s),
            description=SKILLS_CATALOG.get(s, {}).get("description", ""),
            tags=[s],
        )
        for s in skills
    ]
    if not agent_skills:
        agent_skills = [
            AgentSkill(id="general", name="General", description="General assistance", tags=[]),
        ]
    return AgentCard(
        name=shroom.get("name", shroom_id),
        description=f"Shroom {shroom.get('name', shroom_id)} in Mycelium OS",
        url=f"{base_url.rstrip('/')}/shrooms/{shroom_id}/message",
        version="0.1.0",
        defaultInputModes=["text/plain"],
        defaultOutputModes=["text/plain"],
        capabilities=AgentCapabilities(),
        skills=agent_skills,
    )


@router.get("/{shroom_id}/.well-known/agent-card.json")
def get_agent_card(
    shroom_id: str,
    controller: ShroomController = Depends(get_controller),
):
    shroom = controller.get_shroom(shroom_id)
    if not shroom:
        raise HTTPException(status_code=404, detail=f"Shroom '{shroom_id}' not found")
    base_url = os.getenv("CONTROL_PLANE_BASE_URL", "http://localhost:8000")
    card = _manifest_to_agent_card(shroom_id, shroom, base_url)
    return card.model_dump(exclude_none=True)


def _build_model_error_detail(controller: ShroomController, shroom_id: str) -> str:
    configured = controller.get_resolved_model(shroom_id) or "unknown"
    model_base = configured.split(":")[0]
    available = list_available_models(OLLAMA_HOST)
    if available:
        logger.info("Available Ollama models: %s", ", ".join(available))
    return (
        f"Model '{configured}' is not available in Ollama. "
        f"Run `ollama pull {model_base}` to enable this shroom."
    )


def _try_fallback(
    controller: ShroomController, shroom_id: str, message: str, session_id: str,
) -> str | None:
    fallback = find_first_available(OLLAMA_HOST, FALLBACK_MODELS)
    if not fallback:
        return None
    configured = controller.get_resolved_model(shroom_id)
    if fallback == configured:
        return None
    agent = controller.create_temp_agent(shroom_id, fallback)
    if not agent:
        return None
    try:
        run_response = agent.run(message, session_id=session_id)
        logger.info("Fallback model '%s' succeeded for shroom '%s'", fallback, shroom_id)
        return run_response.content or "No response generated."
    except Exception:
        logger.warning(
            "Fallback model '%s' also failed for shroom '%s'", fallback, shroom_id, exc_info=True,
        )
        return None


@router.post("/{shroom_id}/message", response_model=MessageResponse)
async def send_message(
    shroom_id: str,
    req: MessageRequest,
    principal_id: str = Depends(get_principal),
    controller: ShroomController = Depends(get_controller),
    db: Session = Depends(get_db),
    nats_bus: NatsEventBus = Depends(get_nats_bus),
):
    agent = controller.get_agent(shroom_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Shroom '{shroom_id}' not found")

    session_id: str
    if req.session_id:
        bound = get_binding(db, principal_id, shroom_id)
        if not bound or bound != req.session_id:
            raise HTTPException(status_code=403, detail="Session not found or not owned")
        session_id = req.session_id
    else:
        session_id = str(uuid.uuid4())
        upsert_binding(db, principal_id, shroom_id, session_id)

    append_bead(db, shroom_id, "message_received", f"Received: {req.message[:120]}")

    await emit_event(db, nats_bus, ShroomEvent(
        shroom_id=shroom_id,
        event=ShroomEventType.MESSAGE_RECEIVED,
        topic="message",
        payload_summary=f"Received: {req.message[:120]}",
    ), session_id=session_id)

    recent = get_recent_beads(db, shroom_id, n=10)
    context = format_beads_for_context(recent)
    augmented = f"{context}\n\n---\n{req.message}" if context else req.message

    content: str | None = None
    model_not_found = False
    token_count: int | None = None
    cost_usd: float | None = None
    model_id: str | None = None

    try:
        run_response = agent.run(augmented, session_id=session_id)
        content = run_response.content if run_response.content else "No response generated."
        if run_response.metrics:
            token_count = run_response.metrics.total_tokens or None
            cost_usd = run_response.metrics.cost
            if run_response.metrics.details and "model" in run_response.metrics.details:
                model_list = run_response.metrics.details["model"]
                if model_list:
                    model_id = model_list[0].id
        if not model_id:
            model_id = controller.get_resolved_model(shroom_id)
    except Exception as exc:
        logger.exception("Agent error for shroom '%s'", shroom_id)
        if is_model_not_found_error(exc):
            model_not_found = True
            content = _try_fallback(controller, shroom_id, augmented, session_id)

    if content and looks_like_ollama_error(content):
        logger.warning("Ollama error in response content for '%s': %s", shroom_id, content[:200])
        model_not_found = True
        content = _try_fallback(controller, shroom_id, augmented, session_id)

    if content is None:
        db.commit()
        await emit_event(db, nats_bus, ShroomEvent(
            shroom_id=shroom_id,
            event=ShroomEventType.ERROR,
            topic="shroom_error",
            payload_summary=f"Shroom processing failed for {shroom_id}",
        ))
        if model_not_found:
            raise HTTPException(
                status_code=502,
                detail=_build_model_error_detail(controller, shroom_id),
            )
        raise HTTPException(status_code=502, detail="Shroom processing failed")

    append_bead(db, shroom_id, "task_completed", f"Responded: {content[:120]}")
    db.commit()

    await emit_event(db, nats_bus, ShroomEvent(
        shroom_id=shroom_id,
        event=ShroomEventType.MESSAGE_SENT,
        topic="response",
        payload_summary=f"Responded: {content[:120]}",
        token_count=token_count,
        cost_usd=cost_usd,
        model=model_id,
        trace_id=session_id,
    ), session_id=session_id)

    return MessageResponse(shroom_id=shroom_id, response=content, session_id=session_id)
