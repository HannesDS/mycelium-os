"""Tests for ConstitutionWriterService and the constitution proposal/approval flow."""
from __future__ import annotations

import uuid
from pathlib import Path

import pytest
import yaml
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event as sa_event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from core.constitution_writer import (
    ConstitutionWriterService,
    InvalidChangePayload,
    ConstitutionWriteError,
    validate_change_payload,
    _apply_change_to_state,
    _default_summary,
)
from core.controller import ShroomController
from core.database import Base
from core.manifest import (
    MyceliumConfig,
    ShroomManifest,
    ShroomMetadata,
    ShroomSpec,
    load_mycelium_config,
    load_shroom_manifest,
)
from core.models import Approval, ConstitutionChange
from core.nats_client import NatsEventBus
import core.models  # noqa: F401  ensure all tables are registered


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def _engine():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @sa_event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_conn, _):
        dbapi_conn.execute("PRAGMA foreign_keys=OFF")

    Base.metadata.create_all(engine)
    return engine


@pytest.fixture()
def session_factory(_engine):
    return sessionmaker(bind=_engine)


@pytest.fixture()
def tmp_config(tmp_path) -> Path:
    """Write a minimal mycelium.yaml + one shroom manifest to a temp dir."""
    shrooms_dir = tmp_path / "examples" / "shrooms"
    shrooms_dir.mkdir(parents=True)

    alpha_manifest = {
        "apiVersion": "mycelium.io/v1",
        "kind": "Shroom",
        "metadata": {"id": "alpha-shroom", "name": "Alpha"},
        "spec": {
            "model": "mistral-7b",
            "skills": ["skill_a"],
            "escalates_to": "root-shroom",
        },
    }
    (shrooms_dir / "alpha-shroom.yaml").write_text(yaml.dump(alpha_manifest))

    ceo_manifest = {
        "apiVersion": "mycelium.io/v1",
        "kind": "Shroom",
        "metadata": {"id": "root-shroom", "name": "CEO"},
        "spec": {"model": "mistral-7b", "skills": ["decision_routing"]},
    }
    (shrooms_dir / "root-shroom.yaml").write_text(yaml.dump(ceo_manifest))

    config = {
        "company": {"name": "Test Co", "instance": "dev"},
        "shrooms": [
            "examples/shrooms/alpha-shroom.yaml",
            "examples/shrooms/root-shroom.yaml",
        ],
        "graph": {
            "edges": [{"from": "alpha-shroom", "to": "root-shroom", "type": "reports-to"}]
        },
    }
    config_path = tmp_path / "mycelium.yaml"
    config_path.write_text(yaml.dump(config))
    return config_path


@pytest.fixture()
def writer(tmp_config, session_factory) -> ConstitutionWriterService:
    return ConstitutionWriterService(tmp_config, session_factory)


def _make_approval(payload: dict, event_type: str = "constitution_change") -> Approval:
    return Approval(
        id=uuid.uuid4(),
        shroom_id="root-shroom",
        event_type=event_type,
        summary="test change",
        payload=payload,
        status="pending",
    )


# ---------------------------------------------------------------------------
# validate_change_payload
# ---------------------------------------------------------------------------


class TestValidateChangePayload:
    def test_valid_add_shroom(self):
        validate_change_payload(
            {"change_type": "add_shroom", "shroom_id": "new-shroom", "spec": {"name": "New"}}
        )

    def test_valid_edit_shroom(self):
        validate_change_payload(
            {"change_type": "edit_shroom", "shroom_id": "alpha-shroom", "updates": {"model": "llama3"}}
        )

    def test_valid_remove_shroom(self):
        validate_change_payload({"change_type": "remove_shroom", "shroom_id": "alpha-shroom"})

    def test_valid_edit_company(self):
        validate_change_payload({"change_type": "edit_company", "updates": {"name": "Newco"}})

    def test_valid_edit_graph_edge(self):
        validate_change_payload(
            {
                "change_type": "edit_graph_edge",
                "from_shroom": "alpha-shroom",
                "to_shroom": "root-shroom",
                "edge_type": "collaborates-with",
            }
        )

    def test_valid_remove_graph_edge(self):
        validate_change_payload(
            {
                "change_type": "remove_graph_edge",
                "from_shroom": "alpha-shroom",
                "to_shroom": "root-shroom",
            }
        )

    def test_invalid_change_type(self):
        with pytest.raises(InvalidChangePayload, match="change_type"):
            validate_change_payload({"change_type": "nuke_everything"})

    def test_add_shroom_invalid_id(self):
        with pytest.raises(InvalidChangePayload):
            validate_change_payload(
                {"change_type": "add_shroom", "shroom_id": "Bad ID!", "spec": {"name": "X"}}
            )

    def test_add_shroom_missing_name(self):
        with pytest.raises(InvalidChangePayload, match="name"):
            validate_change_payload(
                {"change_type": "add_shroom", "shroom_id": "ok-id", "spec": {}}
            )

    def test_edit_company_empty_updates(self):
        with pytest.raises(InvalidChangePayload):
            validate_change_payload({"change_type": "edit_company", "updates": {}})


# ---------------------------------------------------------------------------
# _apply_change_to_state
# ---------------------------------------------------------------------------


def _base_config_and_manifests():
    config = MyceliumConfig(
        company={"name": "Test Co", "instance": "dev"},
        shrooms=["examples/shrooms/alpha-shroom.yaml"],
        graph={"edges": [{"from": "alpha-shroom", "to": "root-shroom", "type": "reports-to"}]},
    )
    manifests = {
        "alpha-shroom": ShroomManifest(
            apiVersion="mycelium.io/v1",
            kind="Shroom",
            metadata=ShroomMetadata(id="alpha-shroom", name="Alpha"),
            spec=ShroomSpec(model="mistral-7b", skills=["skill_a"], escalates_to="root-shroom"),
        )
    }
    return config, manifests


class TestApplyChangeToState:
    def test_add_shroom(self, tmp_config):
        config, manifests = _base_config_and_manifests()
        payload = {
            "change_type": "add_shroom",
            "shroom_id": "beta-shroom",
            "spec": {"name": "Beta", "model": "mistral-7b", "skills": ["skill_b"]},
        }
        new_config, new_manifests = _apply_change_to_state(payload, config, manifests, tmp_config)
        assert "beta-shroom" in new_manifests
        assert new_manifests["beta-shroom"].metadata.name == "Beta"
        assert any("beta-shroom" in p for p in new_config.shrooms)

    def test_add_shroom_duplicate_raises(self, tmp_config):
        config, manifests = _base_config_and_manifests()
        payload = {
            "change_type": "add_shroom",
            "shroom_id": "alpha-shroom",
            "spec": {"name": "Duplicate"},
        }
        with pytest.raises(InvalidChangePayload, match="already exists"):
            _apply_change_to_state(payload, config, manifests, tmp_config)

    def test_edit_shroom(self, tmp_config):
        config, manifests = _base_config_and_manifests()
        payload = {
            "change_type": "edit_shroom",
            "shroom_id": "alpha-shroom",
            "updates": {"model": "llama3", "name": "Alpha Updated"},
        }
        _, new_manifests = _apply_change_to_state(payload, config, manifests, tmp_config)
        assert new_manifests["alpha-shroom"].spec.model == "llama3"
        assert new_manifests["alpha-shroom"].metadata.name == "Alpha Updated"

    def test_remove_shroom(self, tmp_config):
        config, manifests = _base_config_and_manifests()
        payload = {"change_type": "remove_shroom", "shroom_id": "alpha-shroom"}
        new_config, new_manifests = _apply_change_to_state(payload, config, manifests, tmp_config)
        assert "alpha-shroom" not in new_manifests
        assert not any("alpha-shroom" in p for p in new_config.shrooms)
        # Edge referencing removed shroom should be gone
        edges = new_config.graph.get("edges", [])
        assert not any(e.get("from") == "alpha-shroom" or e.get("to") == "alpha-shroom" for e in edges)

    def test_edit_company(self, tmp_config):
        config, manifests = _base_config_and_manifests()
        payload = {"change_type": "edit_company", "updates": {"name": "NewCo"}}
        new_config, _ = _apply_change_to_state(payload, config, manifests, tmp_config)
        assert new_config.company["name"] == "NewCo"
        assert new_config.company["instance"] == "dev"

    def test_edit_graph_edge_updates_existing(self, tmp_config):
        config, manifests = _base_config_and_manifests()
        payload = {
            "change_type": "edit_graph_edge",
            "from_shroom": "alpha-shroom",
            "to_shroom": "root-shroom",
            "edge_type": "collaborates-with",
        }
        new_config, _ = _apply_change_to_state(payload, config, manifests, tmp_config)
        edges = new_config.graph["edges"]
        matching = [e for e in edges if e["from"] == "alpha-shroom" and e["to"] == "root-shroom"]
        assert len(matching) == 1
        assert matching[0]["type"] == "collaborates-with"

    def test_edit_graph_edge_adds_new(self, tmp_config):
        config, manifests = _base_config_and_manifests()
        payload = {
            "change_type": "edit_graph_edge",
            "from_shroom": "alpha-shroom",
            "to_shroom": "other-shroom",
            "edge_type": "monitors",
        }
        new_config, _ = _apply_change_to_state(payload, config, manifests, tmp_config)
        edges = new_config.graph["edges"]
        assert any(e["from"] == "alpha-shroom" and e["to"] == "other-shroom" for e in edges)

    def test_remove_graph_edge(self, tmp_config):
        config, manifests = _base_config_and_manifests()
        payload = {
            "change_type": "remove_graph_edge",
            "from_shroom": "alpha-shroom",
            "to_shroom": "root-shroom",
        }
        new_config, _ = _apply_change_to_state(payload, config, manifests, tmp_config)
        edges = new_config.graph.get("edges", [])
        assert not any(e.get("from") == "alpha-shroom" and e.get("to") == "root-shroom" for e in edges)


# ---------------------------------------------------------------------------
# ConstitutionWriterService.apply_change
# ---------------------------------------------------------------------------


class TestConstitutionWriterService:
    def test_apply_add_shroom_writes_yaml(self, writer, session_factory, tmp_config):
        approval = _make_approval({
            "change_type": "add_shroom",
            "shroom_id": "new-shroom",
            "spec": {"name": "New Shroom", "model": "mistral-7b", "skills": ["skill_x"]},
        })
        change = writer.apply_change(approval, applied_by="human")

        assert change.change_type == "add_shroom"
        assert change.applied_by == "human"

        # YAML file should exist
        new_manifest_path = tmp_config.parent / "examples" / "shrooms" / "new-shroom.yaml"
        assert new_manifest_path.exists()
        loaded = load_shroom_manifest(new_manifest_path)
        assert loaded.metadata.id == "new-shroom"
        assert loaded.metadata.name == "New Shroom"

        # mycelium.yaml should reference the new shroom
        config = load_mycelium_config(tmp_config)
        assert any("new-shroom" in p for p in config.shrooms)

    def test_apply_change_records_db_row(self, writer, session_factory):
        approval = _make_approval({
            "change_type": "edit_company",
            "updates": {"name": "Updated Co"},
        })
        change = writer.apply_change(approval, applied_by="admin")

        session = session_factory()
        try:
            row = session.query(ConstitutionChange).filter_by(id=change.id).first()
            assert row is not None
            assert row.change_type == "edit_company"
            assert row.applied_by == "admin"
            assert row.constitution_snapshot["company"]["name"] == "Updated Co"
        finally:
            session.close()

    def test_apply_invalid_payload_raises(self, writer):
        approval = _make_approval({"change_type": "add_shroom", "shroom_id": "BAD ID!!", "spec": {}})
        with pytest.raises(InvalidChangePayload):
            writer.apply_change(approval, applied_by="human")

    def test_apply_write_failure_raises_constitution_write_error(self, writer, monkeypatch):
        """If the YAML write fails, ConstitutionWriteError is raised and no DB record created."""
        import core.constitution_writer as cw

        def _bad_write(*args, **kwargs):
            raise ConstitutionWriteError("disk full")

        monkeypatch.setattr(cw, "_write_yaml_files", _bad_write)
        approval = _make_approval({
            "change_type": "edit_company",
            "updates": {"name": "Should Fail"},
        })
        with pytest.raises(ConstitutionWriteError):
            writer.apply_change(approval, applied_by="human")

    def test_apply_remove_shroom(self, writer, tmp_config):
        approval = _make_approval({"change_type": "remove_shroom", "shroom_id": "alpha-shroom"})
        writer.apply_change(approval, applied_by="human")

        config = load_mycelium_config(tmp_config)
        assert not any("alpha-shroom" in p for p in config.shrooms)

    def test_list_changes(self, writer, session_factory):
        approval = _make_approval({"change_type": "edit_company", "updates": {"name": "V2"}})
        writer.apply_change(approval, applied_by="human")

        changes = writer.list_changes()
        assert len(changes) >= 1
        assert changes[0].change_type == "edit_company"

    def test_snapshot_stored_in_change_record(self, writer, session_factory):
        approval = _make_approval({
            "change_type": "add_shroom",
            "shroom_id": "snap-shroom",
            "spec": {"name": "Snapshot Test"},
        })
        change = writer.apply_change(approval, applied_by="human")

        assert "snap-shroom" in change.constitution_snapshot["shrooms"]


# ---------------------------------------------------------------------------
# API: POST /constitution/propose
# ---------------------------------------------------------------------------


def _make_test_client(tmp_config, session_factory) -> TestClient:
    from main import app

    manifests = {}
    from core.manifest import load_all_shroom_manifests, load_mycelium_config
    manifests = load_all_shroom_manifests(tmp_config)
    controller = ShroomController()
    for m in manifests.values():
        controller.register(m)

    app.state.controller = controller
    app.state.mycelium_config = load_mycelium_config(tmp_config)
    app.state.db_session_factory = session_factory
    app.state.nats_bus = NatsEventBus()
    app.state.config_path = tmp_config
    app.state.constitution_writer = ConstitutionWriterService(tmp_config, session_factory)
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture()
def api_client(tmp_config, session_factory):
    return _make_test_client(tmp_config, session_factory)


class TestConstitutionProposeEndpoint:
    def test_propose_creates_pending_approval(self, api_client, session_factory):
        resp = api_client.post(
            "/constitution/propose",
            json={
                "change_type": "add_shroom",
                "payload": {
                    "shroom_id": "proposed-shroom",
                    "spec": {"name": "Proposed"},
                },
            },
            headers={"X-API-Key": "test-key"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "pending"
        assert "approval_id" in data

        session = session_factory()
        try:
            approval = session.query(Approval).filter_by(id=uuid.UUID(data["approval_id"])).first()
            assert approval is not None
            assert approval.event_type == "constitution_change"
            assert approval.status == "pending"
        finally:
            session.close()

    def test_propose_invalid_payload_returns_422(self, api_client):
        resp = api_client.post(
            "/constitution/propose",
            json={
                "change_type": "add_shroom",
                "payload": {"shroom_id": "Bad ID!!", "spec": {}},
            },
            headers={"X-API-Key": "test-key"},
        )
        assert resp.status_code == 422

    def test_propose_with_custom_summary(self, api_client, session_factory):
        resp = api_client.post(
            "/constitution/propose",
            json={
                "change_type": "edit_company",
                "payload": {"updates": {"name": "NewCo"}},
                "change_summary": "Custom summary",
            },
            headers={"X-API-Key": "test-key"},
        )
        assert resp.status_code == 201
        assert resp.json()["summary"] == "Custom summary"


# ---------------------------------------------------------------------------
# API: GET /constitution/changes
# ---------------------------------------------------------------------------


class TestConstitutionChangesEndpoint:
    def test_empty_changes_returns_list(self, api_client):
        resp = api_client.get("/constitution/changes", headers={"X-API-Key": "test-key"})
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_applied_change_appears_in_history(self, api_client, writer):
        approval = _make_approval({"change_type": "edit_company", "updates": {"name": "History Co"}})
        writer.apply_change(approval, applied_by="human")

        resp = api_client.get("/constitution/changes", headers={"X-API-Key": "test-key"})
        assert resp.status_code == 200
        changes = resp.json()
        assert any(c["change_type"] == "edit_company" for c in changes)


# ---------------------------------------------------------------------------
# API: Approval approve endpoint with constitution_change type
# ---------------------------------------------------------------------------


class TestApprovalApproveWithConstitutionChange:
    def test_approve_constitution_change_applies_and_marks_approved(
        self, api_client, session_factory
    ):
        # First propose a change
        propose_resp = api_client.post(
            "/constitution/propose",
            json={
                "change_type": "edit_company",
                "payload": {"updates": {"name": "Approved Co"}},
            },
            headers={"X-API-Key": "test-key"},
        )
        assert propose_resp.status_code == 201
        approval_id = propose_resp.json()["approval_id"]

        # Then approve it
        approve_resp = api_client.post(
            f"/approvals/{approval_id}/approve",
            headers={"X-API-Key": "test-key"},
        )
        assert approve_resp.status_code == 200
        assert approve_resp.json()["status"] == "approved"

        # Verify the change was recorded
        resp = api_client.get("/constitution/changes", headers={"X-API-Key": "test-key"})
        changes = resp.json()
        assert any(
            c["change_type"] == "edit_company"
            and c["constitution_snapshot"]["company"]["name"] == "Approved Co"
            for c in changes
        )

    def test_approve_constitution_change_updates_in_memory_config(
        self, api_client
    ):
        propose_resp = api_client.post(
            "/constitution/propose",
            json={
                "change_type": "edit_company",
                "payload": {"updates": {"name": "Live Co"}},
            },
            headers={"X-API-Key": "test-key"},
        )
        approval_id = propose_resp.json()["approval_id"]
        api_client.post(f"/approvals/{approval_id}/approve", headers={"X-API-Key": "test-key"})

        # The constitution endpoint should reflect the new name
        constitution_resp = api_client.get("/constitution", headers={"X-API-Key": "test-key"})
        assert constitution_resp.status_code == 200
        assert constitution_resp.json()["company"]["name"] == "Live Co"

    def test_regular_approval_unaffected(self, api_client, session_factory):
        """Non-constitution approvals still go through the normal path."""
        session = session_factory()
        try:
            approval = Approval(
                shroom_id="sales-shroom",
                event_type="escalation_raised",
                summary="Test escalation",
                payload={"action": "send_email"},
            )
            session.add(approval)
            session.commit()
            approval_id = str(approval.id)
        finally:
            session.close()

        resp = api_client.post(
            f"/approvals/{approval_id}/approve",
            headers={"X-API-Key": "test-key"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "approved"
