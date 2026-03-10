from __future__ import annotations

import logging
from contextlib import suppress
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.controller import ShroomController
from core.models import AuditLog

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sessions", tags=["sessions"])

ACTIVE_THRESHOLD_MINUTES = 5

# SECURITY: No auth for MVP (OPEN-QUESTIONS.md, MYC-26). Control plane MUST NOT be exposed
# to untrusted networks. Add authn/authz before multi-user or public deployment. See SB-003.


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


class SessionListItem(BaseModel):
    session_id: str
    shroom_id: str
    status: str
    started: str
    duration: str
    message_count: int


class SessionListResponse(BaseModel):
    sessions: list[SessionListItem]


class MessageTurn(BaseModel):
    role: str
    content: str


class RelatedEvent(BaseModel):
    id: str
    entity_type: str
    action: str
    actor: str
    created_at: str


class SessionDetailResponse(BaseModel):
    session_id: str
    shroom_id: str
    message_history: list[MessageTurn]
    started: str
    ended: str | None
    model: str | None
    token_count: int | None
    related_events: list[RelatedEvent]


def _is_active(updated_at: int | None) -> bool:
    if not updated_at:
        return False
    now_ts = int(datetime.now(timezone.utc).timestamp())
    return (now_ts - updated_at) < ACTIVE_THRESHOLD_MINUTES * 60


def _format_duration(created_at: int | None, updated_at: int | None) -> str:
    if not created_at or not updated_at:
        return "-"
    diff = updated_at - created_at
    return f"{diff}s" if diff < 60 else f"{diff // 60}m" if diff < 3600 else f"{diff // 3600}h"


def _runs_to_message_count(runs: list[Any]) -> int:
    if not runs:
        return 0
    count = 0
    for run in runs:
        if hasattr(run, "messages") and run.messages:
            count += len(run.messages)
        elif not (hasattr(run, "messages") and run.messages is None):
            count += 1
    return count


def _runs_to_message_history(runs: list[Any]) -> list[MessageTurn]:
    turns: list[MessageTurn] = []
    for run in runs or []:
        if hasattr(run, "messages") and run.messages:
            for msg in run.messages:
                role = getattr(msg, "role", "user")
                content = getattr(msg, "content", str(msg))
                turns.append(MessageTurn(role=role, content=content))
        elif hasattr(run, "input"):
            turns.append(MessageTurn(role="user", content=str(run.input)))
        if hasattr(run, "content") and run.content:
            turns.append(MessageTurn(role="assistant", content=str(run.content)))
    return turns


@router.get("", response_model=SessionListResponse, summary="List shroom sessions")
def list_sessions(
    controller: ShroomController = Depends(get_controller),
    status: str | None = Query(  # noqa: B008
        default="active",
        description="active or completed",
    ),
):
    if status not in ("active", "completed"):
        status = "active"
    shroom_ids = set(controller.manifests)
    db = controller.db
    all_sessions: list[Any] = []
    for shroom_id in shroom_ids:
        try:
            sessions = db.get_sessions(
                session_type="agent",
                component_id=shroom_id,
                limit=100,
                sort_by="updated_at",
                sort_order="desc",
            )
            all_sessions.extend(sessions or [])
        except Exception as e:
            logger.warning("Failed to get sessions for %s: %s", shroom_id, e)
    now_ts = int(datetime.now(timezone.utc).timestamp())
    active_cutoff = now_ts - ACTIVE_THRESHOLD_MINUTES * 60
    if status == "active":
        filtered = [s for s in all_sessions if (s.updated_at or 0) >= active_cutoff]
    else:
        filtered = [s for s in all_sessions if (s.updated_at or 0) < active_cutoff][:50]
    filtered.sort(key=lambda s: s.updated_at or 0, reverse=True)
    items: list[SessionListItem] = []
    for s in filtered:
        agent_id = getattr(s, "agent_id", None) or getattr(s, "component_id", None)
        if agent_id and agent_id not in shroom_ids:
            continue
        shroom_id = agent_id or "unknown"
        created = getattr(s, "created_at", None)
        updated = getattr(s, "updated_at", None)
        runs = getattr(s, "runs", None) or []
        items.append(
            SessionListItem(
                session_id=getattr(s, "session_id", str(s)),
                shroom_id=shroom_id,
                status="active" if _is_active(updated) else "completed",
                started=datetime.fromtimestamp(created or 0, tz=timezone.utc).isoformat()
                if created
                else "-",
                duration=_format_duration(created, updated),
                message_count=_runs_to_message_count(runs),
            )
        )
    return SessionListResponse(sessions=items)


@router.get("/{session_id}", response_model=SessionDetailResponse, summary="Get session detail")
def get_session(
    session_id: str,
    controller: ShroomController = Depends(get_controller),
    db_session: Session = Depends(get_db),
):
    db = controller.db
    session_obj = None
    with suppress(Exception):
        session_obj = db.get_session(session_id=session_id, session_type="agent")
    if not session_obj:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")
    owning_shroom = getattr(session_obj, "agent_id", None) or "unknown"
    runs = getattr(session_obj, "runs", None) or []
    created = getattr(session_obj, "created_at", None)
    updated = getattr(session_obj, "updated_at", None)
    agent_data = getattr(session_obj, "agent_data", None) or {}
    model = agent_data.get("model") if isinstance(agent_data, dict) else None
    metadata = getattr(session_obj, "metadata", None) or {}
    token_count = metadata.get("token_count") if isinstance(metadata, dict) else None
    related: list[RelatedEvent] = []
    try:
        rows = (
            db_session.query(AuditLog)
            .filter(AuditLog.details["session_id"].astext == session_id)
            .order_by(AuditLog.created_at)
            .all()
        )
        related.extend(
            RelatedEvent(
                id=str(row.id),
                entity_type=row.entity_type or "",
                action=row.action,
                actor=row.actor,
                created_at=row.created_at.isoformat(),
            )
            for row in rows
        )
    except Exception as e:
        logger.warning("Failed to get related events: %s", e)
    return SessionDetailResponse(
        session_id=session_id,
        shroom_id=owning_shroom or "unknown",
        message_history=_runs_to_message_history(runs),
        started=datetime.fromtimestamp(created or 0, tz=timezone.utc).isoformat()
        if created
        else "-",
        ended=datetime.fromtimestamp(updated or 0, tz=timezone.utc).isoformat()
        if updated
        else None,
        model=model,
        token_count=token_count,
        related_events=related,
    )
