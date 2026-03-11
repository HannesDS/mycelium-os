from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from core.controller import ShroomController
from core.database import Base
from core.manifest import ShroomManifest, ShroomMetadata, ShroomSpec
from core.models import ShroomEventRecord
from core.nats_client import NatsEventBus
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
    app.state.nats_bus = NatsEventBus()
    return TestClient(app, raise_server_exceptions=False, headers={"X-API-Key": "test-key"})


def _seed_events(session_factory):
    session = session_factory()
    base = datetime(2026, 3, 11, 10, 0, 0, tzinfo=timezone.utc)
    for i, (shroom_id, evt) in enumerate([
        ("sales-shroom", "message_sent"),
        ("ceo-shroom", "task_started"),
        ("sales-shroom", "escalation_raised"),
    ]):
        session.add(ShroomEventRecord(
            shroom_id=shroom_id,
            event=evt,
            to="ceo-shroom" if shroom_id == "sales-shroom" else None,
            topic="lead",
            timestamp=base,
            payload_summary=f"Event {i}",
            metadata_={"i": i},
            session_id=None,
        ))
    session.commit()
    session.close()


def test_list_events_empty(client):
    resp = client.get("/events")
    assert resp.status_code == 200
    assert resp.json() == []


def test_list_events_with_data(client, _db_session_factory):
    _seed_events(_db_session_factory)
    resp = client.get("/events?include_global=true")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 3
    assert data[0]["shroom_id"] == "sales-shroom"
    assert data[0]["event"] == "message_sent"
    assert "timestamp" in data[0]
    assert data[0]["metadata"] == {"i": 0}


def test_list_events_filter_by_shroom(client, _db_session_factory):
    _seed_events(_db_session_factory)
    resp = client.get("/events?shroom_id=sales-shroom&include_global=true")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    assert all(e["shroom_id"] == "sales-shroom" for e in data)


def test_list_events_limit(client, _db_session_factory):
    _seed_events(_db_session_factory)
    resp = client.get("/events?limit=2&include_global=true")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_list_events_ordering(client, _db_session_factory):
    _seed_events(_db_session_factory)
    resp = client.get("/events?include_global=true")
    assert resp.status_code == 200
    data = resp.json()
    assert data[0]["metadata"]["i"] == 0
    assert data[1]["metadata"]["i"] == 1
    assert data[2]["metadata"]["i"] == 2
