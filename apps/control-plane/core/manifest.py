from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, Field, model_validator


class ShroomMetadata(BaseModel):
    id: str
    name: str


class ShroomSpec(BaseModel):
    model: str = "mistral-7b"
    skills: list[str] = Field(default_factory=list)
    escalates_to: str | None = None
    sla_response_minutes: int | None = None
    can: list[dict[str, list[str]]] = Field(default_factory=list)
    cannot: list[dict[str, list[str]]] = Field(default_factory=list)
    mcps: list[str] = Field(default_factory=list)
    memory: dict[str, Any] = Field(default_factory=dict)
    rag_access: list[dict[str, Any]] = Field(default_factory=list)
    inbox: dict[str, Any] = Field(default_factory=dict)
    api: dict[str, Any] = Field(default_factory=dict)


class ShroomManifest(BaseModel):
    model_config = {"extra": "forbid"}

    apiVersion: str
    kind: str
    metadata: ShroomMetadata
    spec: ShroomSpec

    @model_validator(mode="after")
    def _validate_kind_and_version(self) -> ShroomManifest:
        if self.apiVersion != "mycelium.io/v1":
            raise ValueError(f"Unsupported apiVersion: {self.apiVersion}")
        if self.kind != "Shroom":
            raise ValueError(f"Unsupported kind: {self.kind}")
        return self


class MyceliumConfig(BaseModel):
    company: dict[str, str]
    shrooms: list[str]
    graph: dict[str, Any] = Field(default_factory=dict)


def _safe_yaml_load(path: Path) -> dict:
    try:
        raw = yaml.safe_load(path.read_text())
    except yaml.YAMLError as exc:
        raise ValueError(f"Failed to parse YAML at {path}") from exc
    if not isinstance(raw, dict):
        raise ValueError(
            f"Expected YAML mapping at {path}, got {type(raw).__name__}"
        )
    return raw


def load_mycelium_config(path: Path) -> MyceliumConfig:
    return MyceliumConfig(**_safe_yaml_load(path))


def load_shroom_manifest(path: Path) -> ShroomManifest:
    return ShroomManifest(**_safe_yaml_load(path))


def load_all_shroom_manifests(config_path: Path) -> dict[str, ShroomManifest]:
    config = load_mycelium_config(config_path)
    base_dir = config_path.parent
    manifests: dict[str, ShroomManifest] = {}
    for rel_path in config.shrooms:
        manifest_path = base_dir / rel_path
        manifest = load_shroom_manifest(manifest_path)
        manifests[manifest.metadata.id] = manifest
    return manifests
