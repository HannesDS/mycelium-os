from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from core.controller import ShroomController
from core.database import Base
from core.manifest import ShroomManifest, ShroomMetadata, ShroomSpec
from core.models import SessionBinding
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
    event.listen(engine, "connect", lambda c, _: c.execute("PRAGMA foreign_keys=OFF"))
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)


@pytest.fixture()
def client(_db_session_factory):
    from main import app
    c = ShroomController()
    c.register(_make_manifest("sales-shroom", "Sales"))
    c.register(_make_manifest("billing-shroom", "Billing"))
    fake_agent = MagicMock()
    fake_agent.run.return_value = SimpleNamespace(content="hello")
    c.agents["sales-shroom"] = fake_agent
    c.agents["billing-shroom"] = fake_agent
    app.state.controller = c
    app.state.db_session_factory = _db_session_factory
    app.state.nats_bus = NatsEventBus()
    return TestClient(app, raise_server_exceptions=False)


def test_message_creates_binding_and_returns_session_id(client, _db_session_factory):
    resp = client.post("/shrooms/sales-shroom/message", json={"message": "hi"}, headers={"X-API-Key": "test-key"})
    assert resp.status_code == 200
    data = resp.json()
    assert "session_id" in data
    session_id = data["session_id"]
    sess = _db_session_factory()
    row = sess.query(SessionBinding).filter(
        SessionBinding.principal_id == "dev-user",
        SessionBinding.shroom_id == "sales-shroom",
    ).first()
    assert row is not None
    assert row.session_id == session_id
    sess.close()


def test_message_with_session_id_reuses_session(client, _db_session_factory):
    sess = _db_session_factory()
    sess.add(SessionBinding(principal_id="dev-user", shroom_id="sales-shroom", session_id="sess-abc"))
    sess.commit()
    sess.close()

    resp = client.post("/shrooms/sales-shroom/message", json={"message": "hi", "session_id": "sess-abc"}, headers={"X-API-Key": "test-key"})
    assert resp.status_code == 200
    assert resp.json()["session_id"] == "sess-abc"


def test_message_with_foreign_session_id_returns_403(client, _db_session_factory):
    sess = _db_session_factory()
    sess.add(SessionBinding(principal_id="dev-user", shroom_id="sales-shroom", session_id="sess-xyz"))
    sess.commit()
    sess.close()

    resp = client.post("/shrooms/sales-shroom/message", json={"message": "hi", "session_id": "sess-other"}, headers={"X-API-Key": "test-key"})
    assert resp.status_code == 403


def test_message_with_session_id_for_wrong_shroom_returns_403(client, _db_session_factory):
    sess = _db_session_factory()
    sess.add(SessionBinding(principal_id="dev-user", shroom_id="sales-shroom", session_id="sess-abc"))
    sess.commit()
    sess.close()

    resp = client.post("/shrooms/billing-shroom/message", json={"message": "hi", "session_id": "sess-abc"}, headers={"X-API-Key": "test-key"})
    assert resp.status_code == 403


@patch("core.auth.DEV_API_KEY", "test-key-123")
def test_message_requires_api_key_when_dev_api_key_set(client):
    resp = client.post("/shrooms/sales-shroom/message", json={"message": "hi"})
    assert resp.status_code == 401

    resp = client.post(
        "/shrooms/sales-shroom/message",
        json={"message": "hi"},
        headers={"X-API-Key": "test-key-123"},
    )
    assert resp.status_code == 200
