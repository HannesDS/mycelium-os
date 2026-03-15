from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class ShroomEventType(str, Enum):
    MESSAGE_RECEIVED = "message_received"
    MESSAGE_SENT = "message_sent"
    TASK_STARTED = "task_started"
    TASK_COMPLETED = "task_completed"
    ESCALATION_RAISED = "escalation_raised"
    DECISION_RECEIVED = "decision_received"
    IDLE = "idle"
    ERROR = "error"


class ShroomEvent(BaseModel):
    shroom_id: str
    event: ShroomEventType
    to: str | None = None
    topic: str | None = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    payload_summary: str
    metadata: dict[str, Any] | None = None
    token_count: int | None = None
    cost_usd: float | None = None
    model: str | None = None
    trace_id: str | None = None
