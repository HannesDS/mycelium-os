from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from core.controller import ShroomController
from core.database import Base
from core.manifest import ShroomManifest, ShroomMetadata, ShroomSpec
from core.models import Approval, ShroomEventRecord
import core.models  # noqa: F401


def _make_manifest(shroom_id: str, name: str) -> ShroomManifest:
    return ShroomManifest(
        apiVersion="mycelium.io/v1",
        kind="Shroom",
        metadata=ShroomMetadata(id=shroom_id, name=name),
        spec=ShroomSpec(model="mistral-7b", skills=[], escalates_to="ceo-shroom"),
    )


@pytest.fixture()
def controller():
    c = ShroomController()
    c.register(_make_manifest("sales-shroom", "Sales"))
    return c


@pytest.fixture()
def _db_session_factory():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    event.listen(engine, "connect", lambda c, _: c.execute("PRAGMA foreign_keys=OFF"))
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)


@pytest.fixture()
def client(controller, _db_session_factory):
    from main import app
    app.state.controller = controller
    app.state.db_session_factory = _db_session_factory
    nats_bus = MagicMock()
    nats_bus.publish_event = AsyncMock()
    app.state.nats_bus = nats_bus
    return TestClient(app, raise_server_exceptions=False, headers={"X-API-Key": "test-key"})


def test_trigger_escalation_creates_approval(client, _db_session_factory):
    resp = client.post("/demo/trigger-escalation")
    assert resp.status_code == 200
    data = resp.json()
    assert "approval_id" in data
    assert "summary" in data
    assert "Triodos Bank" in data["summary"]

    session = _db_session_factory()
    approvals = session.query(Approval).filter(Approval.shroom_id == "sales-shroom").all()
    session.close()
    assert len(approvals) >= 1
    assert approvals[0].status == "pending"


def test_trigger_escalation_emits_events(client, _db_session_factory):
    resp = client.post("/demo/trigger-escalation")
    assert resp.status_code == 200

    session = _db_session_factory()
    events = session.query(ShroomEventRecord).filter(
        ShroomEventRecord.shroom_id == "sales-shroom"
    ).order_by(ShroomEventRecord.timestamp.asc()).all()
    session.close()

    event_types = [e.event for e in events]
    assert "escalation_raised" in event_types
    assert "message_sent" in event_types


def test_trigger_escalation_nats_publish_called(client):
    resp = client.post("/demo/trigger-escalation")
    assert resp.status_code == 200

    nats_bus = client.app.state.nats_bus
    assert nats_bus.publish_event.call_count == 2
