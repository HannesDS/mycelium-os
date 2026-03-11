from __future__ import annotations

import logging
from datetime import datetime, timezone

from core.events import ShroomEvent, ShroomEventType
from core.models import ShroomEventRecord
from core.nats_client import NatsEventBus
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def _parse_timestamp(ts: str) -> datetime:
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


def _event_value(event: ShroomEventType | str) -> str:
    return event.value if isinstance(event, ShroomEventType) else str(event)


async def emit_event(
    session: Session,
    nats_bus: NatsEventBus,
    event: ShroomEvent,
    session_id: str | None = None,
) -> None:
    record = ShroomEventRecord(
        shroom_id=event.shroom_id,
        event=_event_value(event.event),
        to=event.to,
        topic=event.topic,
        timestamp=_parse_timestamp(event.timestamp),
        payload_summary=event.payload_summary,
        metadata_=event.metadata,
        session_id=session_id,
    )
    session.add(record)
    session.commit()
    await nats_bus.publish_event(event)
