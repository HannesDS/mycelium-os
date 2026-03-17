from __future__ import annotations

import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.auth import get_principal
from core.events import ShroomEvent, ShroomEventType
from core.event_service import emit_event
from core.models import Approval
from core.nats_client import NatsEventBus
from core.prompt_safety import validate_proposal_payload

router = APIRouter(prefix="/demo", tags=["demo"])

DEMO_ENABLED = os.getenv("DEMO_ENABLED", "false").lower() in ("true", "1")
DEFAULT_SUMMARY = "New enterprise lead — Triodos Bank. Proposal ready for approval."


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


class TriggerEscalationResponse(BaseModel):
    approval_id: str
    summary: str


@router.post("/trigger-escalation", response_model=TriggerEscalationResponse)
async def trigger_escalation(
    principal_id: str = Depends(get_principal),
    db: Session = Depends(get_db),
    nats_bus: NatsEventBus = Depends(get_nats_bus),
):
    if not DEMO_ENABLED:
        raise HTTPException(status_code=403, detail="Demo endpoints disabled")
    summary = DEFAULT_SUMMARY
    payload = {"lead": "Triodos Bank", "action": "send_proposal"}
    if not validate_proposal_payload(payload):
        raise HTTPException(status_code=400, detail="Invalid proposal payload")
    approval = Approval(
        shroom_id="sales-shroom",
        event_type="escalation_raised",
        summary=summary,
        payload=payload,
    )
    db.add(approval)
    db.commit()
    db.refresh(approval)

    ts = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    await emit_event(db, nats_bus, ShroomEvent(
        shroom_id="sales-shroom",
        event=ShroomEventType.ESCALATION_RAISED,
        to="root-shroom",
        topic="lead_qualified",
        timestamp=ts,
        payload_summary=summary,
        metadata={"approval_id": str(approval.id)},
    ))
    await emit_event(db, nats_bus, ShroomEvent(
        shroom_id="sales-shroom",
        event=ShroomEventType.MESSAGE_SENT,
        to="root-shroom",
        topic="lead_qualified",
        timestamp=ts,
        payload_summary=summary,
    ))

    return TriggerEscalationResponse(approval_id=str(approval.id), summary=summary)
