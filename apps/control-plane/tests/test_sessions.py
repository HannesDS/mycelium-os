from __future__ import annotations

import time
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from core.controller import ShroomController
from core.database import Base
from core.manifest import ShroomManifest, ShroomMetadata, ShroomSpec
from core.models import SessionBinding
from core.nats_client import NatsEventBus


def _make_manifest(shroom_id: str, name: str) -> ShroomManifest:
    return ShroomManifest(
        apiVersion="mycelium.io/v1",
        kind="Shroom",
        metadata=ShroomMetadata(id=shroom_id, name=name),
        spec=ShroomSpec(
            model="mistral-7b",
            skills=[],
            escalates_to="ceo-shroom",
        ),
    )


@pytest.fixture()
def mock_agno_db():
    db = MagicMock()
    db.get_sessions.return_value = [
        SimpleNamespace(
            session_id="sess-123",
            agent_id="sales-shroom",
            created_at=int(time.time()) - 3600,
            updated_at=int(time.time()) - 300,
            runs=[SimpleNamespace(messages=[], content="Hi")],
        ),
    ]
    db.get_session.return_value = SimpleNamespace(
        session_id="sess-123",
        agent_id="sales-shroom",
        created_at=int(time.time()) - 3600,
        updated_at=int(time.time()) - 300,
        runs=[
            SimpleNamespace(
                input="Hello",
                content="Hi there",
                messages=[],
            ),
        ],
        agent_data={"model": "mistral:latest"},
        metadata={},
    )
    return db


@pytest.fixture()
def controller(mock_agno_db):
    c = ShroomController(db=mock_agno_db)
    c.register(_make_manifest("sales-shroom", "Sales"))
    c.register(_make_manifest("ceo-shroom", "CEO"))
    return c


@pytest.fixture()
def db_session_factory():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    sm = sessionmaker(bind=engine)
    session = sm()
    session.add(SessionBinding(principal_id="dev-user", shroom_id="sales-shroom", session_id="sess-123"))
    session.commit()
    session.close()
    return sm


@pytest.fixture()
def client(controller, db_session_factory):
    from main import app

    app.state.controller = controller
    app.state.db_session_factory = db_session_factory
    app.state.nats_bus = NatsEventBus()
    return TestClient(app, raise_server_exceptions=False)


def test_list_sessions_active(client):
    resp = client.get("/sessions?status=active")
    assert resp.status_code == 200
    data = resp.json()
    assert "sessions" in data
    assert len(data["sessions"]) >= 0


def test_list_sessions_completed(client):
    resp = client.get("/sessions?status=completed")
    assert resp.status_code == 200
    data = resp.json()
    assert "sessions" in data


def test_list_sessions_default(client):
    resp = client.get("/sessions")
    assert resp.status_code == 200


def test_get_session_detail(client):
    resp = client.get("/sessions/sess-123")
    assert resp.status_code == 200
    data = resp.json()
    assert data["session_id"] == "sess-123"
    assert data["shroom_id"] == "sales-shroom"
    assert "message_history" in data
    assert "related_events" in data


def test_get_session_not_found(client, controller, mock_agno_db):
    mock_agno_db.get_session.return_value = None
    resp = client.get("/sessions/nonexistent-id")
    assert resp.status_code == 404
