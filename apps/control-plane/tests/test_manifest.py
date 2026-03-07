from pathlib import Path

import pytest
import yaml

from core.manifest import (
    MyceliumConfig,
    ShroomManifest,
    load_all_shroom_manifests,
    load_mycelium_config,
    load_shroom_manifest,
)

FIXTURES = Path(__file__).resolve().parent / "fixtures"


@pytest.fixture(autouse=True)
def setup_fixtures(tmp_path):
    shroom_dir = tmp_path / "shrooms"
    shroom_dir.mkdir()

    manifest_data = {
        "apiVersion": "mycelium.io/v1",
        "kind": "Shroom",
        "metadata": {"id": "test-shroom", "name": "Test Shroom"},
        "spec": {
            "model": "mistral-7b",
            "skills": ["testing"],
            "escalates_to": "ceo-shroom",
            "sla_response_minutes": 60,
            "can": [{"read": ["data"]}],
            "cannot": [{"execute": ["payments"]}],
        },
    }
    (shroom_dir / "test-shroom.yaml").write_text(yaml.dump(manifest_data))

    config_data = {
        "company": {"name": "Test Co", "instance": "dev"},
        "shrooms": ["shrooms/test-shroom.yaml"],
    }
    (tmp_path / "mycelium.yaml").write_text(yaml.dump(config_data))

    return tmp_path


def test_load_mycelium_config(setup_fixtures):
    config = load_mycelium_config(setup_fixtures / "mycelium.yaml")
    assert isinstance(config, MyceliumConfig)
    assert config.company["name"] == "Test Co"
    assert len(config.shrooms) == 1


def test_load_shroom_manifest(setup_fixtures):
    manifest = load_shroom_manifest(setup_fixtures / "shrooms" / "test-shroom.yaml")
    assert isinstance(manifest, ShroomManifest)
    assert manifest.metadata.id == "test-shroom"
    assert manifest.metadata.name == "Test Shroom"
    assert manifest.spec.model == "mistral-7b"
    assert "testing" in manifest.spec.skills
    assert manifest.spec.escalates_to == "ceo-shroom"


def test_load_all_shroom_manifests(setup_fixtures):
    manifests = load_all_shroom_manifests(setup_fixtures / "mycelium.yaml")
    assert "test-shroom" in manifests
    assert manifests["test-shroom"].metadata.name == "Test Shroom"


def test_invalid_manifest_missing_metadata(tmp_path):
    bad = {"apiVersion": "mycelium.io/v1", "kind": "Shroom", "spec": {"model": "x"}}
    path = tmp_path / "bad.yaml"
    path.write_text(yaml.dump(bad))
    with pytest.raises(Exception):
        load_shroom_manifest(path)


def test_load_real_manifests():
    repo_root = Path(__file__).resolve().parent.parent.parent.parent
    config_path = repo_root / "mycelium.yaml"
    if not config_path.exists():
        pytest.skip("mycelium.yaml not found at repo root")
    manifests = load_all_shroom_manifests(config_path)
    assert len(manifests) == 5
    expected_ids = {"sales-shroom", "delivery-shroom", "billing-shroom", "compliance-shroom", "ceo-shroom"}
    assert set(manifests.keys()) == expected_ids
