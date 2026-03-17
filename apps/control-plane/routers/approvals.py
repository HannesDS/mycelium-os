from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from core.auth import get_principal
from core.constitution_writer import ConstitutionWriteError, ConstitutionWriterService, InvalidChangePayload
from core.events import ShroomEvent, ShroomEventType
from core.event_service import emit_event
from core.models import Approval, AuditLog
from core.nats_client import NatsEventBus

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/approvals", tags=["approvals"])


class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ApprovalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    shroom_id: str
    event_type: str
    summary: str
    payload: dict | None
    status: ApprovalStatus
    created_at: datetime
    resolved_at: datetime | None
    resolved_by: str | None


def get_db(request: Request):
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


class PendingCountResponse(BaseModel):
    count: int


@router.get("/pending-count", response_model=PendingCountResponse, summary="Get pending approval count")
def get_pending_count(
    _principal: str = Depends(get_principal),
    db: Session = Depends(get_db),
):
    count = db.query(Approval).filter(Approval.status == "pending").count()
    return PendingCountResponse(count=count)


@router.get("", response_model=list[ApprovalResponse], summary="List proposals")
def list_approvals(
    status: ApprovalStatus | None = Query(None, description="Filter by status: pending, approved, rejected"),
    _principal: str = Depends(get_principal),
    db: Session = Depends(get_db),
):
    query = db.query(Approval)
    if status is not None:
        query = query.filter(Approval.status == status.value)
    query = query.order_by(Approval.created_at.desc())
    return query.all()


def _get_writer(request: Request) -> ConstitutionWriterService | None:
    return getattr(request.app.state, "constitution_writer", None)


@router.post("/{approval_id}/approve", response_model=ApprovalResponse, summary="Approve a proposal")
async def approve_proposal(
    approval_id: uuid.UUID,
    request: Request,
    principal_id: str = Depends(get_principal),
    db: Session = Depends(get_db),
    nats_bus: NatsEventBus = Depends(get_nats_bus),
):
    approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    if approval.status != "pending":
        raise HTTPException(status_code=409, detail=f"Approval already {approval.status}")

    # For constitution changes: apply atomically before marking approved
    if approval.event_type == "constitution_change":
        writer = _get_writer(request)
        if writer is None:
            raise HTTPException(status_code=503, detail="Constitution writer not initialized")
        try:
            writer.apply_change(
                approval,
                applied_by=principal_id,
                controller=getattr(request.app.state, "controller", None),
                app_state=request.app.state,
            )
        except InvalidChangePayload as exc:
            raise HTTPException(status_code=422, detail=str(exc))
        except ConstitutionWriteError as exc:
            approval.status = "failed"
            approval.resolved_at = datetime.now(timezone.utc)
            approval.resolved_by = principal_id
            db.commit()
            raise HTTPException(status_code=502, detail=f"Constitution write failed: {exc}")
        except Exception as exc:
            # DB write inside apply_change failed after YAML was already written.
            # Mark approval failed so the audit trail reflects the incomplete state.
            logger.error("Unexpected error applying constitution change %s: %s", approval_id, exc)
            approval.status = "failed"
            approval.resolved_at = datetime.now(timezone.utc)
            approval.resolved_by = principal_id
            db.commit()
            raise HTTPException(status_code=502, detail="Constitution change failed: audit record could not be persisted. YAML may have been partially applied — check git history.")

    audit_entry = AuditLog(
        entity_type="approval",
        entity_id=approval.id,
        action="approved",
        actor=principal_id,
        details={"shroom_id": approval.shroom_id, "summary": approval.summary},
    )
    db.add(audit_entry)
    db.flush()

    approval.status = "approved"
    approval.resolved_at = datetime.now(timezone.utc)
    approval.resolved_by = principal_id
    db.commit()
    db.refresh(approval)

    await emit_event(db, nats_bus, ShroomEvent(
        shroom_id=approval.shroom_id,
        event=ShroomEventType.DECISION_RECEIVED,
        topic="proposal_approved",
        payload_summary=f"Proposal approved: {approval.summary}",
        metadata={"approved": True, "approval_id": str(approval.id)},
    ))

    logger.info("Approval %s approved by human", approval_id)
    return approval


@router.post("/{approval_id}/reject", response_model=ApprovalResponse, summary="Reject a proposal")
async def reject_proposal(
    approval_id: uuid.UUID,
    principal_id: str = Depends(get_principal),
    db: Session = Depends(get_db),
    nats_bus: NatsEventBus = Depends(get_nats_bus),
):
    approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    if approval.status != "pending":
        raise HTTPException(status_code=409, detail=f"Approval already {approval.status}")

    audit_entry = AuditLog(
        entity_type="approval",
        entity_id=approval.id,
        action="rejected",
        actor=principal_id,
        details={"shroom_id": approval.shroom_id, "summary": approval.summary},
    )
    db.add(audit_entry)
    db.flush()

    approval.status = "rejected"
    approval.resolved_at = datetime.now(timezone.utc)
    approval.resolved_by = principal_id
    db.commit()
    db.refresh(approval)

    await emit_event(db, nats_bus, ShroomEvent(
        shroom_id=approval.shroom_id,
        event=ShroomEventType.DECISION_RECEIVED,
        topic="proposal_rejected",
        payload_summary=f"Proposal rejected: {approval.summary}",
        metadata={"approved": False, "approval_id": str(approval.id)},
    ))

    logger.info("Approval %s rejected by human", approval_id)
    return approval
