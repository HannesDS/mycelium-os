from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from core.controller import ShroomController
from core.database import Base
from core.manifest import (
    MyceliumConfig,
    ShroomManifest,
    ShroomMetadata,
    ShroomSpec,
)
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
def mycelium_config():
    return MyceliumConfig(
        company={"name": "Test Co", "instance": "dev"},
        shrooms=["shrooms/alpha-shroom.yaml", "shrooms/beta-shroom.yaml"],
        graph={
            "edges": [
                {"from": "alpha-shroom", "to": "beta-shroom", "type": "reports-to"},
            ]
        },
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
def client(controller, mycelium_config, _db_session_factory):
    from main import app
    app.state.controller = controller
    app.state.mycelium_config = mycelium_config
    app.state.db_session_factory = _db_session_factory
    app.state.nats_bus = NatsEventBus()
    return TestClient(app, raise_server_exceptions=False)


def test_constitution_returns_200(client):
    resp = client.get("/constitution")
    assert resp.status_code == 200


def test_constitution_has_company(client):
    data = client.get("/constitution").json()
    assert data["company"]["name"] == "Test Co"
    assert data["company"]["instance"] == "dev"


def test_constitution_has_graph_edges(client):
    data = client.get("/constitution").json()
    edges = data["graph"]["edges"]
    assert len(edges) == 1
    assert edges[0]["from"] == "alpha-shroom"
    assert edges[0]["to"] == "beta-shroom"
    assert edges[0]["type"] == "reports-to"


def test_constitution_has_shroom_manifests(client):
    data = client.get("/constitution").json()
    shrooms = data["shrooms"]
    assert len(shrooms) == 2
    ids = {s["id"] for s in shrooms}
    assert ids == {"alpha-shroom", "beta-shroom"}


def test_constitution_shroom_manifest_has_full_details(client):
    data = client.get("/constitution").json()
    shrooms = {s["id"]: s for s in data["shrooms"]}
    alpha = shrooms["alpha-shroom"]
    manifest = alpha["manifest"]
    assert manifest["name"] == "Alpha"
    assert manifest["model"] == "mistral-7b"
    assert manifest["skills"] == ["skill_a"]
    assert manifest["escalates_to"] == "ceo-shroom"
    assert "can" in manifest
    assert "cannot" in manifest


def test_constitution_no_config_returns_503(controller, _db_session_factory):
    from main import app
    app.state.controller = controller
    app.state.db_session_factory = _db_session_factory
    app.state.nats_bus = NatsEventBus()
    if hasattr(app.state, "mycelium_config"):
        del app.state.mycelium_config
    c = TestClient(app, raise_server_exceptions=False)
    resp = c.get("/constitution")
    assert resp.status_code == 503


def test_constitution_missing_controller_returns_503(mycelium_config, _db_session_factory):
    from main import app
    if hasattr(app.state, "controller"):
        del app.state.controller
    app.state.mycelium_config = mycelium_config
    app.state.db_session_factory = _db_session_factory
    app.state.nats_bus = NatsEventBus()
    c = TestClient(app, raise_server_exceptions=False)
    resp = c.get("/constitution")
    assert resp.status_code == 503
    assert resp.json()["detail"] == "Control plane not initialized"
