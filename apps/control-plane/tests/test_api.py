from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from core.controller import ShroomController
from core.manifest import load_all_shroom_manifests


@pytest.fixture
def client():
    repo_root = Path(__file__).resolve().parent.parent.parent.parent
    config_path = repo_root / "mycelium.yaml"
    if not config_path.exists():
        pytest.skip("mycelium.yaml not found at repo root")

    manifests = load_all_shroom_manifests(config_path)
    controller = ShroomController()
    for m in manifests.values():
        controller.register(m)

    from routers.shrooms import init_router
    init_router(controller)

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
    assert len(data) == 5
    ids = {s["id"] for s in data}
    assert ids == {"sales-shroom", "delivery-shroom", "billing-shroom", "compliance-shroom", "ceo-shroom"}


def test_get_shroom(client):
    resp = client.get("/shrooms/sales-shroom")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == "sales-shroom"
    assert data["name"] == "Sales Development"
    assert data["status"] == "running"
    assert "lead_qualification" in data["skills"]


def test_get_shroom_not_found(client):
    resp = client.get("/shrooms/nonexistent")
    assert resp.status_code == 404


def test_all_shrooms_have_required_fields(client):
    resp = client.get("/shrooms")
    for shroom in resp.json():
        assert "id" in shroom
        assert "name" in shroom
        assert "model" in shroom
        assert "skills" in shroom
        assert "status" in shroom
