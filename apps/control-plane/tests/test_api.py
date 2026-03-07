from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
import yaml
from fastapi.testclient import TestClient

from core.controller import ShroomController
from core.manifest import ShroomManifest, ShroomMetadata, ShroomSpec


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
def client(controller):
    from main import app
    app.state.controller = controller
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
    fake_agent.run.assert_called_once_with("hi")


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
