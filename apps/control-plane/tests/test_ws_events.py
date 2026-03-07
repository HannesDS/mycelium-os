from __future__ import annotations

import json

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


def test_ws_rejects_by_default(client, monkeypatch):
    monkeypatch.setattr("routers.events.ALLOW_INSECURE_WS", False)
    with pytest.raises(Exception):
        with client.websocket_connect("/ws/events"):
            pass


def test_ws_accepts_when_insecure_mode(client, monkeypatch):
    monkeypatch.setattr("routers.events.ALLOW_INSECURE_WS", True)
    with client.websocket_connect("/ws/events") as ws:
        assert ws is not None


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
