from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.auth import get_principal
from core.models import ShroomEventRecord
from core.session_bindings import get_session_bindings_for_principal

router = APIRouter(prefix="/events", tags=["events"])


def get_db(request: Request) -> Session:
    factory = getattr(request.app.state, "db_session_factory", None)
    if factory is None:
        raise HTTPException(status_code=503, detail="Database not initialized")
    session = factory()
    try:
        yield session
    finally:
        session.close()


class EventResponse(BaseModel):
    shroom_id: str
    event: str
    to: str | None
    topic: str | None
    timestamp: str
    payload_summary: str
    metadata: dict | None
    token_count: int | None = None
    cost_usd: float | None = None
    model: str | None = None

    @classmethod
    def from_record(cls, r: ShroomEventRecord) -> "EventResponse":
        ts = r.timestamp.isoformat().replace("+00:00", "Z") if r.timestamp.tzinfo else r.timestamp.isoformat() + "Z"
        cost = float(r.cost_usd) if r.cost_usd is not None else None
        return cls(
            shroom_id=r.shroom_id,
            event=r.event,
            to=r.to,
            topic=r.topic,
            timestamp=ts,
            payload_summary=r.payload_summary,
            metadata=r.metadata_,
            token_count=r.token_count,
            cost_usd=cost,
            model=r.model,
        )


@router.get("", response_model=list[EventResponse])
def list_events(
    principal_id: str = Depends(get_principal),
    db: Session = Depends(get_db),
    shroom_id: str | None = Query(None),
    session_id: str | None = Query(None),
    topic: str | None = Query(None),
    since: str | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
):
    bound_ids = get_session_bindings_for_principal(db, principal_id)
    q = db.query(ShroomEventRecord)
    q = q.filter(
        (ShroomEventRecord.session_id.is_(None)) | (ShroomEventRecord.session_id.in_(bound_ids))
    )
    if shroom_id:
        q = q.filter(ShroomEventRecord.shroom_id == shroom_id)
    if session_id:
        if session_id not in bound_ids:
            return []
        q = q.filter(ShroomEventRecord.session_id == session_id)
    if topic:
        q = q.filter(ShroomEventRecord.topic == topic)
    if since:
        try:
            dt = datetime.fromisoformat(since.replace("Z", "+00:00"))
            q = q.filter(ShroomEventRecord.timestamp >= dt)
        except ValueError:
            pass
    q = q.order_by(ShroomEventRecord.timestamp.asc()).limit(limit)
    return [EventResponse.from_record(r) for r in q.all()]
