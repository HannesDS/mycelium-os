from __future__ import annotations

import uuid

from sqlalchemy import JSON, DateTime, ForeignKey, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from core.database import Base


class ShroomBead(Base):
    __tablename__ = "shroom_beads"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    shroom_id: Mapped[str] = mapped_column(Text, nullable=False)
    created_at = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    event_type: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    payload = mapped_column(JSON, nullable=True)
    prev_bead_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("shroom_beads.id"), nullable=True
    )


class Approval(Base):
    __tablename__ = "approvals"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    shroom_id: Mapped[str] = mapped_column(Text, nullable=False)
    event_type: Mapped[str] = mapped_column(Text, nullable=False, default="escalation_raised")
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    payload = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="pending")
    created_at = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    resolved_at = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_by: Mapped[str | None] = mapped_column(Text, nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    entity_type: Mapped[str] = mapped_column(Text, nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    action: Mapped[str] = mapped_column(Text, nullable=False)
    actor: Mapped[str] = mapped_column(Text, nullable=False, default="human")
    created_at = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    details = mapped_column(JSON, nullable=True)
