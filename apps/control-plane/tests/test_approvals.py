from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from core.database import Base
from core.models import Approval, AuditLog
import core.models  # noqa: F401


@pytest.fixture()
def db_session_factory():
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
def seeded_factory(db_session_factory):
    session = db_session_factory()
    session.add(Approval(
        shroom_id="sales-shroom",
        event_type="escalation_raised",
        summary="Send proposal email to Acme Corp lead",
        payload={"lead": "Acme Corp"},
    ))
    session.add(Approval(
        shroom_id="billing-shroom",
        event_type="escalation_raised",
        summary="Send overdue invoice reminder to client X",
        payload={"client": "Client X"},
    ))
    session.commit()
    session.close()
    return db_session_factory


@pytest.fixture()
def client(seeded_factory):
    from main import app
    from unittest.mock import AsyncMock, MagicMock
    from core.controller import ShroomController

    app.state.controller = ShroomController()
    app.state.db_session_factory = seeded_factory
    nats_bus = MagicMock()
    nats_bus.publish_event = AsyncMock()
    app.state.nats_bus = nats_bus
    return TestClient(app, raise_server_exceptions=False, headers={"X-API-Key": "test-key"})


def test_pending_count(client):
    resp = client.get("/approvals/pending-count")
    assert resp.status_code == 200
    assert resp.json() == {"count": 2}


def test_pending_count_after_approve(client):
    approvals = client.get("/approvals").json()
    client.post(f"/approvals/{approvals[0]['id']}/approve")
    resp = client.get("/approvals/pending-count")
    assert resp.status_code == 200
    assert resp.json() == {"count": 1}


def test_list_approvals_returns_all(client):
    resp = client.get("/approvals")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2


def test_list_approvals_filter_pending(client):
    resp = client.get("/approvals?status=pending")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    for item in data:
        assert item["status"] == "pending"


def test_list_approvals_filter_approved_empty(client):
    resp = client.get("/approvals?status=approved")
    assert resp.status_code == 200
    assert resp.json() == []


def test_approve_proposal(client):
    approvals = client.get("/approvals").json()
    approval_id = approvals[0]["id"]

    resp = client.post(f"/approvals/{approval_id}/approve")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "approved"
    assert data["resolved_by"] == "dev-user"
    assert data["resolved_at"] is not None


def test_reject_proposal(client):
    approvals = client.get("/approvals").json()
    approval_id = approvals[0]["id"]

    resp = client.post(f"/approvals/{approval_id}/reject")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "rejected"
    assert data["resolved_by"] == "dev-user"
    assert data["resolved_at"] is not None


def test_duplicate_approve_returns_409(client):
    approvals = client.get("/approvals").json()
    approval_id = approvals[0]["id"]

    resp1 = client.post(f"/approvals/{approval_id}/approve")
    assert resp1.status_code == 200

    resp2 = client.post(f"/approvals/{approval_id}/approve")
    assert resp2.status_code == 409
    assert "already approved" in resp2.json()["detail"]


def test_reject_after_approve_returns_409(client):
    approvals = client.get("/approvals").json()
    approval_id = approvals[0]["id"]

    client.post(f"/approvals/{approval_id}/approve")
    resp = client.post(f"/approvals/{approval_id}/reject")
    assert resp.status_code == 409


def test_approve_after_reject_returns_409(client):
    approvals = client.get("/approvals").json()
    approval_id = approvals[0]["id"]

    client.post(f"/approvals/{approval_id}/reject")
    resp = client.post(f"/approvals/{approval_id}/approve")
    assert resp.status_code == 409


def test_approve_nonexistent_returns_404(client):
    fake_id = str(uuid.uuid4())
    resp = client.post(f"/approvals/{fake_id}/approve")
    assert resp.status_code == 404


def test_reject_nonexistent_returns_404(client):
    fake_id = str(uuid.uuid4())
    resp = client.post(f"/approvals/{fake_id}/reject")
    assert resp.status_code == 404


def test_approve_creates_audit_log(client, seeded_factory):
    approvals = client.get("/approvals").json()
    approval_id = approvals[0]["id"]

    client.post(f"/approvals/{approval_id}/approve")

    session = seeded_factory()
    logs = session.query(AuditLog).filter(
        AuditLog.entity_id == uuid.UUID(approval_id)
    ).all()
    session.close()

    assert len(logs) == 1
    assert logs[0].action == "approved"
    assert logs[0].entity_type == "approval"
    assert logs[0].actor == "dev-user"


def test_reject_creates_audit_log(client, seeded_factory):
    approvals = client.get("/approvals").json()
    approval_id = approvals[1]["id"]

    client.post(f"/approvals/{approval_id}/reject")

    session = seeded_factory()
    logs = session.query(AuditLog).filter(
        AuditLog.entity_id == uuid.UUID(approval_id)
    ).all()
    session.close()

    assert len(logs) == 1
    assert logs[0].action == "rejected"


def test_approval_response_shape(client):
    approvals = client.get("/approvals").json()
    item = approvals[0]
    assert "id" in item
    assert "shroom_id" in item
    assert "event_type" in item
    assert "summary" in item
    assert "payload" in item
    assert "status" in item
    assert "created_at" in item
    assert "resolved_at" in item
    assert "resolved_by" in item


def test_filter_shows_resolved_after_action(client):
    approvals = client.get("/approvals").json()
    approval_id = approvals[0]["id"]

    client.post(f"/approvals/{approval_id}/approve")

    pending = client.get("/approvals?status=pending").json()
    approved = client.get("/approvals?status=approved").json()

    assert len(pending) == 1
    assert len(approved) == 1
    assert approved[0]["id"] == approval_id


def test_approve_emits_decision_received_to_nats(client):
    approvals = client.get("/approvals").json()
    approval_id = approvals[0]["id"]

    client.post(f"/approvals/{approval_id}/approve")

    nats_bus = client.app.state.nats_bus
    nats_bus.publish_event.assert_called_once()
    call_args = nats_bus.publish_event.call_args[0][0]
    assert call_args.event.value == "decision_received"
    assert call_args.shroom_id == "sales-shroom"
    assert call_args.metadata["approved"] is True
    assert call_args.metadata["approval_id"] == approval_id


def test_approve_nats_failure_returns_500(client):
    """NATS publish failure causes 500 — the caller knows the event was not emitted."""
    from unittest.mock import AsyncMock

    approvals = client.get("/approvals").json()
    approval_id = approvals[0]["id"]

    nats_bus = client.app.state.nats_bus
    nats_bus.publish_event = AsyncMock(side_effect=RuntimeError("NATS unavailable"))

    resp = client.post(f"/approvals/{approval_id}/approve")
    assert resp.status_code == 500

    # Approval is persisted as approved even though the NATS event failed
    approval = client.get(f"/approvals?status=approved").json()
    approved_ids = [a["id"] for a in approval]
    assert approval_id in approved_ids


def test_reject_emits_decision_received_to_nats(client):
    approvals = client.get("/approvals").json()
    approval_id = approvals[0]["id"]

    client.post(f"/approvals/{approval_id}/reject")

    nats_bus = client.app.state.nats_bus
    nats_bus.publish_event.assert_called_once()
    call_args = nats_bus.publish_event.call_args[0][0]
    assert call_args.event.value == "decision_received"
    assert call_args.shroom_id == "sales-shroom"
    assert call_args.metadata["approved"] is False
