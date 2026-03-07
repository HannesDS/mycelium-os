from pathlib import Path

import pytest
import yaml
from pydantic import ValidationError

from core.manifest import (
    MyceliumConfig,
    ShroomManifest,
    load_all_shroom_manifests,
    load_mycelium_config,
    load_shroom_manifest,
)


def _write_manifest(tmp_path: Path, filename: str, data: dict) -> Path:
    p = tmp_path / filename
    p.write_text(yaml.dump(data))
    return p


def _valid_manifest_data() -> dict:
    return {
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


@pytest.fixture()
def config_dir(tmp_path):
    shroom_dir = tmp_path / "shrooms"
    shroom_dir.mkdir()
    _write_manifest(shroom_dir, "test-shroom.yaml", _valid_manifest_data())
    config = {
        "company": {"name": "Test Co", "instance": "dev"},
        "shrooms": ["shrooms/test-shroom.yaml"],
    }
    (tmp_path / "mycelium.yaml").write_text(yaml.dump(config))
    return tmp_path


def test_load_mycelium_config(config_dir):
    config = load_mycelium_config(config_dir / "mycelium.yaml")
    assert isinstance(config, MyceliumConfig)
    assert config.company["name"] == "Test Co"
    assert len(config.shrooms) == 1


def test_load_shroom_manifest(config_dir):
    manifest = load_shroom_manifest(config_dir / "shrooms" / "test-shroom.yaml")
    assert isinstance(manifest, ShroomManifest)
    assert manifest.metadata.id == "test-shroom"
    assert manifest.metadata.name == "Test Shroom"
    assert manifest.spec.model == "mistral-7b"
    assert "testing" in manifest.spec.skills
    assert manifest.spec.escalates_to == "ceo-shroom"


def test_load_all_shroom_manifests(config_dir):
    manifests = load_all_shroom_manifests(config_dir / "mycelium.yaml")
    assert "test-shroom" in manifests
    assert manifests["test-shroom"].metadata.name == "Test Shroom"


def test_invalid_manifest_missing_metadata(tmp_path):
    data = {"apiVersion": "mycelium.io/v1", "kind": "Shroom", "spec": {"model": "x"}}
    path = _write_manifest(tmp_path, "bad.yaml", data)
    with pytest.raises(ValidationError):
        load_shroom_manifest(path)


def test_invalid_manifest_missing_spec(tmp_path):
    data = {"apiVersion": "mycelium.io/v1", "kind": "Shroom", "metadata": {"id": "x", "name": "X"}}
    path = _write_manifest(tmp_path, "bad.yaml", data)
    with pytest.raises(ValidationError):
        load_shroom_manifest(path)


def test_invalid_manifest_wrong_kind(tmp_path):
    data = _valid_manifest_data()
    data["kind"] = "NotAShroom"
    path = _write_manifest(tmp_path, "bad.yaml", data)
    with pytest.raises(ValidationError, match="Unsupported kind"):
        load_shroom_manifest(path)


def test_invalid_manifest_wrong_api_version(tmp_path):
    data = _valid_manifest_data()
    data["apiVersion"] = "wrong/v2"
    path = _write_manifest(tmp_path, "bad.yaml", data)
    with pytest.raises(ValidationError, match="Unsupported apiVersion"):
        load_shroom_manifest(path)


def test_invalid_manifest_extra_fields(tmp_path):
    data = _valid_manifest_data()
    data["unexpected"] = "field"
    path = _write_manifest(tmp_path, "bad.yaml", data)
    with pytest.raises(ValidationError):
        load_shroom_manifest(path)


def test_malformed_yaml(tmp_path):
    path = tmp_path / "bad.yaml"
    path.write_text(": :\n  bad: [yaml\n")
    with pytest.raises(ValueError, match="Failed to parse YAML"):
        load_shroom_manifest(path)


def test_empty_yaml(tmp_path):
    path = tmp_path / "empty.yaml"
    path.write_text("")
    with pytest.raises(ValueError, match="Expected YAML mapping"):
        load_shroom_manifest(path)


def test_load_real_manifests():
    repo_root = Path(__file__).resolve().parent.parent.parent.parent
    config_path = repo_root / "mycelium.yaml"
    if not config_path.exists():
        pytest.skip("mycelium.yaml not found at repo root")
    manifests = load_all_shroom_manifests(config_path)
    assert isinstance(manifests, dict)
    assert len(manifests) >= 1
    for m in manifests.values():
        assert isinstance(m, ShroomManifest)
        assert m.metadata.id
        assert m.metadata.name
