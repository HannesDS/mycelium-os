from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from core.models import Approval, AuditLog

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


@router.get("", response_model=list[ApprovalResponse], summary="List proposals")
def list_approvals(
    status: ApprovalStatus | None = Query(None, description="Filter by status: pending, approved, rejected"),
    db: Session = Depends(get_db),
):
    query = db.query(Approval)
    if status is not None:
        query = query.filter(Approval.status == status.value)
    query = query.order_by(Approval.created_at.desc())
    return query.all()


@router.post("/{approval_id}/approve", response_model=ApprovalResponse, summary="Approve a proposal")
def approve_proposal(
    approval_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    if approval.status != "pending":
        raise HTTPException(status_code=409, detail=f"Approval already {approval.status}")

    audit_entry = AuditLog(
        entity_type="approval",
        entity_id=approval.id,
        action="approved",
        actor="human",
        details={"shroom_id": approval.shroom_id, "summary": approval.summary},
    )
    db.add(audit_entry)
    db.flush()

    approval.status = "approved"
    approval.resolved_at = datetime.now(timezone.utc)
    approval.resolved_by = "human"
    db.commit()
    db.refresh(approval)

    logger.info("Approval %s approved by human", approval_id)
    return approval


@router.post("/{approval_id}/reject", response_model=ApprovalResponse, summary="Reject a proposal")
def reject_proposal(
    approval_id: uuid.UUID,
    db: Session = Depends(get_db),
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
        actor="human",
        details={"shroom_id": approval.shroom_id, "summary": approval.summary},
    )
    db.add(audit_entry)
    db.flush()

    approval.status = "rejected"
    approval.resolved_at = datetime.now(timezone.utc)
    approval.resolved_by = "human"
    db.commit()
    db.refresh(approval)

    logger.info("Approval %s rejected by human", approval_id)
    return approval
