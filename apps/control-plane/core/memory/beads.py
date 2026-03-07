from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session

from core.models import ShroomBead

BEADS_MAX_PER_SHROOM = int(os.getenv("BEADS_MAX_PER_SHROOM", "50"))


def append_bead(
    session: Session,
    shroom_id: str,
    event_type: str,
    summary: str,
    payload: dict[str, Any] | None = None,
    max_beads: int | None = None,
) -> ShroomBead:
    if max_beads is None:
        max_beads = BEADS_MAX_PER_SHROOM

    prev = session.execute(
        select(ShroomBead)
        .where(ShroomBead.shroom_id == shroom_id)
        .order_by(ShroomBead.created_at.desc())
        .limit(1)
    ).scalar_one_or_none()

    bead = ShroomBead(
        id=uuid.uuid4(),
        shroom_id=shroom_id,
        created_at=datetime.now(timezone.utc),
        event_type=event_type,
        summary=summary,
        payload=payload,
        prev_bead_id=prev.id if prev else None,
    )
    session.add(bead)
    session.flush()

    _enforce_retention(session, shroom_id, max_beads)

    return bead


def _enforce_retention(session: Session, shroom_id: str, max_beads: int) -> None:
    count = session.execute(
        select(func.count()).where(ShroomBead.shroom_id == shroom_id)
    ).scalar_one()

    if count <= max_beads:
        return

    to_delete = count - max_beads
    oldest_ids = session.execute(
        select(ShroomBead.id)
        .where(ShroomBead.shroom_id == shroom_id)
        .order_by(ShroomBead.created_at.asc())
        .limit(to_delete)
    ).scalars().all()

    if oldest_ids:
        session.execute(
            update(ShroomBead)
            .where(ShroomBead.prev_bead_id.in_(oldest_ids))
            .values(prev_bead_id=None)
        )
        session.execute(
            delete(ShroomBead).where(ShroomBead.id.in_(oldest_ids))
        )


def get_recent_beads(session: Session, shroom_id: str, n: int = 10) -> list[ShroomBead]:
    return list(
        session.execute(
            select(ShroomBead)
            .where(ShroomBead.shroom_id == shroom_id)
            .order_by(ShroomBead.created_at.desc())
            .limit(n)
        ).scalars().all()
    )


def format_beads_for_context(beads: list[ShroomBead]) -> str:
    if not beads:
        return ""
    lines = ["Recent memory (newest first):"]
    for b in beads:
        lines.append(f"- [{b.event_type}] {b.summary}")
    return "\n".join(lines)
