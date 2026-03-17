from __future__ import annotations

import json

import pytest

from core.events import ShroomEvent, ShroomEventType
from core.nats_client import _redact_url


def test_shroom_event_creation():
    event = ShroomEvent(
        shroom_id="sales-shroom",
        event=ShroomEventType.MESSAGE_SENT,
        to="root-shroom",
        topic="lead_qualified",
        payload_summary="Lead qualified — ready for demo booking",
    )
    assert event.shroom_id == "sales-shroom"
    assert event.event == ShroomEventType.MESSAGE_SENT
    assert event.to == "root-shroom"
    assert event.timestamp


def test_shroom_event_serialization():
    event = ShroomEvent(
        shroom_id="billing-shroom",
        event=ShroomEventType.TASK_COMPLETED,
        payload_summary="Invoice generated",
        metadata={"invoice_id": "INV-001"},
    )
    data = json.loads(event.model_dump_json())
    assert data["shroom_id"] == "billing-shroom"
    assert data["event"] == "task_completed"
    assert data["metadata"]["invoice_id"] == "INV-001"
    assert data["to"] is None


def test_shroom_event_type_values():
    expected = {
        "message_received",
        "message_sent",
        "task_started",
        "task_completed",
        "escalation_raised",
        "decision_received",
        "idle",
        "error",
    }
    actual = {e.value for e in ShroomEventType}
    assert actual == expected


def test_shroom_event_optional_fields():
    event = ShroomEvent(
        shroom_id="root-shroom",
        event=ShroomEventType.IDLE,
        payload_summary="At desk",
    )
    assert event.to is None
    assert event.topic is None
    assert event.metadata is None


def test_redact_url_strips_credentials():
    assert "password" not in _redact_url("nats://user:password@nats.example.com:4222")
    assert "user" not in _redact_url("nats://user:password@nats.example.com:4222")
    assert "nats.example.com" in _redact_url("nats://user:password@nats.example.com:4222")


def test_redact_url_noop_without_credentials():
    url = "nats://localhost:4222"
    assert _redact_url(url) == url
