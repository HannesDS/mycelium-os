from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.controller import ShroomController
from core.events import ShroomEvent, ShroomEventType
from core.memory.beads import append_bead, format_beads_for_context, get_recent_beads
from core.nats_client import NatsEventBus

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


class MessageResponse(BaseModel):
    shroom_id: str
    response: str


@router.get("")
def list_shrooms(controller: ShroomController = Depends(get_controller)):
    return controller.list_shrooms()


@router.get("/{shroom_id}")
def get_shroom(shroom_id: str, controller: ShroomController = Depends(get_controller)):
    shroom = controller.get_shroom(shroom_id)
    if not shroom:
        raise HTTPException(status_code=404, detail=f"Shroom '{shroom_id}' not found")
    return shroom


@router.post("/{shroom_id}/message", response_model=MessageResponse)
async def send_message(
    shroom_id: str,
    req: MessageRequest,
    controller: ShroomController = Depends(get_controller),
    db: Session = Depends(get_db),
    nats_bus: NatsEventBus = Depends(get_nats_bus),
):
    agent = controller.get_agent(shroom_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Shroom '{shroom_id}' not found")

    append_bead(db, shroom_id, "message_received", f"Received: {req.message[:120]}")

    await nats_bus.publish_event(ShroomEvent(
        shroom_id=shroom_id,
        event=ShroomEventType.MESSAGE_RECEIVED,
        topic="message",
        payload_summary=f"Received: {req.message[:120]}",
    ))

    recent = get_recent_beads(db, shroom_id, n=10)
    context = format_beads_for_context(recent)
    augmented = f"{context}\n\n---\n{req.message}" if context else req.message

    try:
        run_response = agent.run(augmented)
        content = run_response.content if run_response.content else "No response generated."
    except Exception:
        logger.exception("Agent error for shroom '%s'", shroom_id)
        db.commit()
        await nats_bus.publish_event(ShroomEvent(
            shroom_id=shroom_id,
            event=ShroomEventType.ERROR,
            topic="agent_error",
            payload_summary=f"Agent processing failed for {shroom_id}",
        ))
        raise HTTPException(status_code=502, detail="Agent processing failed")

    append_bead(db, shroom_id, "task_completed", f"Responded: {content[:120]}")
    db.commit()

    await nats_bus.publish_event(ShroomEvent(
        shroom_id=shroom_id,
        event=ShroomEventType.MESSAGE_SENT,
        topic="response",
        payload_summary=f"Responded: {content[:120]}",
    ))

    return MessageResponse(shroom_id=shroom_id, response=content)
