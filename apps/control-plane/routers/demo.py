from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.events import ShroomEvent, ShroomEventType
from core.event_service import emit_event
from core.models import Approval
from core.nats_client import NatsEventBus

router = APIRouter(prefix="/demo", tags=["demo"])

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
    db: Session = Depends(get_db),
    nats_bus: NatsEventBus = Depends(get_nats_bus),
):
    summary = DEFAULT_SUMMARY
    approval = Approval(
        shroom_id="sales-shroom",
        event_type="escalation_raised",
        summary=summary,
        payload={"lead": "Triodos Bank", "action": "send_proposal"},
    )
    db.add(approval)
    db.commit()
    db.refresh(approval)

    ts = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    await emit_event(db, nats_bus, ShroomEvent(
        shroom_id="sales-shroom",
        event=ShroomEventType.ESCALATION_RAISED,
        to="ceo-shroom",
        topic="lead_qualified",
        timestamp=ts,
        payload_summary=summary,
        metadata={"approval_id": str(approval.id)},
    ))
    await emit_event(db, nats_bus, ShroomEvent(
        shroom_id="sales-shroom",
        event=ShroomEventType.MESSAGE_SENT,
        to="ceo-shroom",
        topic="lead_qualified",
        timestamp=ts,
        payload_summary=summary,
    ))

    return TriggerEscalationResponse(approval_id=str(approval.id), summary=summary)
