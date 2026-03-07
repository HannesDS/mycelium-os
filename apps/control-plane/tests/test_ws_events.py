from __future__ import annotations

import json
import time

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from core.controller import ShroomController
from core.database import Base
from core.events import ShroomEvent, ShroomEventType
from core.manifest import ShroomManifest, ShroomMetadata, ShroomSpec
from core.nats_client import NatsEventBus
from routers.events import TicketStore
import core.models  # noqa: F401


def _make_manifest(shroom_id: str, name: str) -> ShroomManifest:
    return ShroomManifest(
        apiVersion="mycelium.io/v1",
        kind="Shroom",
        metadata=ShroomMetadata(id=shroom_id, name=name),
        spec=ShroomSpec(model="mistral-7b", skills=[], escalates_to="ceo-shroom"),
    )


@pytest.fixture()
def _db_session_factory():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_conn, _):
        dbapi_conn.execute("PRAGMA foreign_keys=OFF")

    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)


@pytest.fixture()
def client(_db_session_factory):
    controller = ShroomController()
    controller.register(_make_manifest("test-shroom", "Test"))

    from main import app
    app.state.controller = controller
    app.state.db_session_factory = _db_session_factory
    app.state.nats_bus = NatsEventBus()
    return TestClient(app, raise_server_exceptions=False)


def test_ws_rejects_without_ticket_when_secure(client, monkeypatch):
    monkeypatch.setattr("routers.events.ALLOW_INSECURE_WS", False)
    with pytest.raises(Exception):
        with client.websocket_connect("/ws/events"):
            pass


def test_ws_rejects_invalid_ticket(client, monkeypatch):
    monkeypatch.setattr("routers.events.ALLOW_INSECURE_WS", False)
    with pytest.raises(Exception):
        with client.websocket_connect("/ws/events?ticket=bogus"):
            pass


def test_ws_accepts_valid_ticket(client, monkeypatch):
    monkeypatch.setattr("routers.events.ALLOW_INSECURE_WS", False)
    resp = client.post("/ws/ticket")
    assert resp.status_code == 200
    ticket = resp.json()["ticket"]
    with client.websocket_connect(f"/ws/events?ticket={ticket}") as ws:
        assert ws is not None


def test_ticket_single_use(client, monkeypatch):
    monkeypatch.setattr("routers.events.ALLOW_INSECURE_WS", False)
    resp = client.post("/ws/ticket")
    ticket = resp.json()["ticket"]
    with client.websocket_connect(f"/ws/events?ticket={ticket}"):
        pass
    with pytest.raises(Exception):
        with client.websocket_connect(f"/ws/events?ticket={ticket}"):
            pass


def test_ws_open_when_insecure_mode(client, monkeypatch):
    monkeypatch.setattr("routers.events.ALLOW_INSECURE_WS", True)
    with client.websocket_connect("/ws/events") as ws:
        assert ws is not None


def test_ticket_store_expiry():
    store = TicketStore(ttl=0)
    ticket, _ = store.issue()
    time.sleep(0.01)
    assert store.consume(ticket) is False


def test_ticket_store_valid():
    store = TicketStore(ttl=30)
    ticket, _ = store.issue()
    assert store.consume(ticket) is True
    assert store.consume(ticket) is False


def test_issue_ticket_endpoint(client):
    resp = client.post("/ws/ticket")
    assert resp.status_code == 200
    data = resp.json()
    assert "ticket" in data
    assert "expires_at" in data
    assert len(data["ticket"]) == 32


def test_shroom_event_model_roundtrip():
    event = ShroomEvent(
        shroom_id="sales-shroom",
        event=ShroomEventType.MESSAGE_RECEIVED,
        topic="message",
        payload_summary="Received: hello",
    )
    payload = json.dumps(event.model_dump(), default=str)
    parsed = json.loads(payload)
    assert parsed["shroom_id"] == "sales-shroom"
    assert parsed["event"] == "message_received"
    assert "timestamp" in parsed
