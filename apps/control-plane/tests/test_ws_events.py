from __future__ import annotations

import asyncio
import json
from unittest.mock import AsyncMock, patch, MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from core.controller import ShroomController
from core.database import Base
from core.events import ShroomEvent, ShroomEventType
from core.manifest import ShroomManifest, ShroomMetadata, ShroomSpec
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
    return TestClient(app, raise_server_exceptions=False)


def test_ws_events_endpoint_accepts_connection(client):
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
