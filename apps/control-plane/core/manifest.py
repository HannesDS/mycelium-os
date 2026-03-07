from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, Field


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
    apiVersion: str = "mycelium.io/v1"
    kind: str = "Shroom"
    metadata: ShroomMetadata
    spec: ShroomSpec


class MyceliumConfig(BaseModel):
    company: dict[str, str]
    shrooms: list[str]
    graph: dict[str, Any] = Field(default_factory=dict)


def load_mycelium_config(path: Path) -> MyceliumConfig:
    raw = yaml.safe_load(path.read_text())
    return MyceliumConfig(**raw)


def load_shroom_manifest(path: Path) -> ShroomManifest:
    raw = yaml.safe_load(path.read_text())
    return ShroomManifest(**raw)


def load_all_shroom_manifests(config_path: Path) -> dict[str, ShroomManifest]:
    config = load_mycelium_config(config_path)
    base_dir = config_path.parent
    manifests: dict[str, ShroomManifest] = {}
    for rel_path in config.shrooms:
        manifest_path = base_dir / rel_path
        manifest = load_shroom_manifest(manifest_path)
        manifests[manifest.metadata.id] = manifest
    return manifests
