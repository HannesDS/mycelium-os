from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
import yaml
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from core.controller import ShroomController
from core.database import Base
from core.manifest import ShroomManifest, ShroomMetadata, ShroomSpec
from core.nats_client import NatsEventBus
import core.models  # noqa: F401


def _make_manifest(shroom_id: str, name: str, skills: list[str] | None = None) -> ShroomManifest:
    return ShroomManifest(
        apiVersion="mycelium.io/v1",
        kind="Shroom",
        metadata=ShroomMetadata(id=shroom_id, name=name),
        spec=ShroomSpec(
            model="mistral-7b",
            skills=skills or [],
            escalates_to="ceo-shroom",
        ),
    )


@pytest.fixture()
def controller():
    c = ShroomController()
    c.register(_make_manifest("alpha-shroom", "Alpha", ["skill_a"]))
    c.register(_make_manifest("beta-shroom", "Beta", ["skill_b", "skill_c"]))
    return c


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
def client(controller, _db_session_factory):
    from main import app
    app.state.controller = controller
    app.state.db_session_factory = _db_session_factory
    app.state.nats_bus = NatsEventBus()
    return TestClient(app, raise_server_exceptions=False)


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_list_shrooms(client):
    resp = client.get("/shrooms")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    ids = {s["id"] for s in data}
    assert ids == {"alpha-shroom", "beta-shroom"}


def test_get_shroom(client):
    resp = client.get("/shrooms/alpha-shroom")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == "alpha-shroom"
    assert data["name"] == "Alpha"
    assert data["status"] == "running"
    assert isinstance(data["skills"], list)
    assert "skill_a" in data["skills"]
    assert isinstance(data["model"], str)
    assert data["model"] == "mistral-7b"


def test_get_shroom_not_found(client):
    resp = client.get("/shrooms/nonexistent")
    assert resp.status_code == 404


def test_all_shrooms_have_required_fields(client):
    resp = client.get("/shrooms")
    assert resp.status_code == 200
    for shroom in resp.json():
        assert isinstance(shroom["id"], str) and shroom["id"]
        assert isinstance(shroom["name"], str) and shroom["name"]
        assert isinstance(shroom["model"], str) and shroom["model"]
        assert isinstance(shroom["skills"], list)
        assert shroom["status"] in ("running", "stopped", "error")


def test_message_success(client, controller):
    fake_agent = MagicMock()
    fake_agent.run.return_value = SimpleNamespace(content="hello from agent")
    controller.agents["alpha-shroom"] = fake_agent

    resp = client.post("/shrooms/alpha-shroom/message", json={"message": "hi"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["shroom_id"] == "alpha-shroom"
    assert data["response"] == "hello from agent"
    fake_agent.run.assert_called_once()
    call_arg = fake_agent.run.call_args[0][0]
    assert "hi" in call_arg


def test_message_agent_error_returns_502(client, controller):
    fake_agent = MagicMock()
    fake_agent.run.side_effect = RuntimeError("boom")
    controller.agents["alpha-shroom"] = fake_agent

    resp = client.post("/shrooms/alpha-shroom/message", json={"message": "hi"})
    assert resp.status_code == 502
    assert resp.json()["detail"] == "Agent processing failed"


def test_message_unknown_shroom_returns_404(client):
    resp = client.post("/shrooms/nonexistent/message", json={"message": "hi"})
    assert resp.status_code == 404


def test_message_model_not_found_returns_actionable_error(client, controller):
    fake_agent = MagicMock()
    fake_agent.run.side_effect = RuntimeError("model 'mistral:latest' not found")
    controller.agents["alpha-shroom"] = fake_agent

    with patch("routers.shrooms.find_first_available", return_value=None), \
         patch("routers.shrooms.list_available_models", return_value=[]):
        resp = client.post("/shrooms/alpha-shroom/message", json={"message": "hi"})

    assert resp.status_code == 502
    detail = resp.json()["detail"]
    assert "mistral:latest" in detail
    assert "ollama pull" in detail
    assert "Agent processing failed" not in detail


def test_message_model_not_found_shows_available_models(client, controller):
    fake_agent = MagicMock()
    fake_agent.run.side_effect = RuntimeError("model 'mistral:latest' not found")
    controller.agents["alpha-shroom"] = fake_agent

    with patch("routers.shrooms.find_first_available", return_value=None), \
         patch("routers.shrooms.list_available_models", return_value=["llama3.2:latest", "phi3:latest"]):
        resp = client.post("/shrooms/alpha-shroom/message", json={"message": "hi"})

    assert resp.status_code == 502
    detail = resp.json()["detail"]
    assert "llama3.2:latest" in detail
    assert "phi3:latest" in detail


def test_message_model_not_found_fallback_succeeds(client, controller):
    fake_agent = MagicMock()
    fake_agent.run.side_effect = RuntimeError("model 'mistral:latest' not found")
    controller.agents["alpha-shroom"] = fake_agent

    fallback_agent = MagicMock()
    fallback_agent.run.return_value = SimpleNamespace(content="hello from fallback")

    mock_rebuild = MagicMock(return_value=fallback_agent)
    with patch("routers.shrooms.find_first_available", return_value="llama3.2:latest"), \
         patch.object(controller, "rebuild_agent", mock_rebuild):
        resp = client.post("/shrooms/alpha-shroom/message", json={"message": "hi"})

    assert resp.status_code == 200
    data = resp.json()
    assert data["response"] == "hello from fallback"
    mock_rebuild.assert_called_once_with("alpha-shroom", "llama3.2:latest")


def test_message_model_not_found_fallback_also_fails(client, controller):
    fake_agent = MagicMock()
    fake_agent.run.side_effect = RuntimeError("model 'mistral:latest' not found")
    controller.agents["alpha-shroom"] = fake_agent

    fallback_agent = MagicMock()
    fallback_agent.run.side_effect = RuntimeError("fallback also broken")

    with patch("routers.shrooms.find_first_available", return_value="llama3.2:latest"), \
         patch.object(controller, "rebuild_agent", return_value=fallback_agent), \
         patch("routers.shrooms.list_available_models", return_value=["llama3.2:latest"]):
        resp = client.post("/shrooms/alpha-shroom/message", json={"message": "hi"})

    assert resp.status_code == 502
    detail = resp.json()["detail"]
    assert "mistral:latest" in detail
    assert "ollama pull" in detail


def test_message_generic_error_not_treated_as_model_error(client, controller):
    fake_agent = MagicMock()
    fake_agent.run.side_effect = RuntimeError("connection refused")
    controller.agents["alpha-shroom"] = fake_agent

    resp = client.post("/shrooms/alpha-shroom/message", json={"message": "hi"})
    assert resp.status_code == 502
    assert resp.json()["detail"] == "Agent processing failed"


def test_message_ollama_error_in_content_triggers_fallback(client, controller):
    fake_agent = MagicMock()
    fake_agent.run.return_value = SimpleNamespace(
        content="Failed to connect to Ollama. Please check that Ollama is downloaded, running and accessible."
    )
    controller.agents["alpha-shroom"] = fake_agent

    with patch("routers.shrooms.find_first_available", return_value=None), \
         patch("routers.shrooms.list_available_models", return_value=[]):
        resp = client.post("/shrooms/alpha-shroom/message", json={"message": "hi"})

    assert resp.status_code == 502
    detail = resp.json()["detail"]
    assert "ollama pull" in detail


def test_message_model_not_found_in_content_triggers_fallback(client, controller):
    fake_agent = MagicMock()
    fake_agent.run.return_value = SimpleNamespace(
        content="model 'mistral:latest' not found, try pulling it first"
    )
    controller.agents["alpha-shroom"] = fake_agent

    fallback_agent = MagicMock()
    fallback_agent.run.return_value = SimpleNamespace(content="fallback reply")

    mock_rebuild = MagicMock(return_value=fallback_agent)
    with patch("routers.shrooms.find_first_available", return_value="llama3.2:latest"), \
         patch.object(controller, "rebuild_agent", mock_rebuild):
        resp = client.post("/shrooms/alpha-shroom/message", json={"message": "hi"})

    assert resp.status_code == 200
    assert resp.json()["response"] == "fallback reply"
