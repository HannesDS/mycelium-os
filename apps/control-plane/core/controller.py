from __future__ import annotations

import logging
import os
from typing import Any

from agno.agent import Agent
from agno.db.postgres import PostgresDb
from agno.models.ollama import Ollama
from agno.models.openrouter import OpenRouter

from core.database import DATABASE_URL
from core.manifest import ShroomManifest

logger = logging.getLogger(__name__)

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

MODEL_MAP = {
    "mistral-7b": "mistral:latest",
    "mistral:latest": "mistral:latest",
}

OPENROUTER_PREFIX = "openrouter/"


def _resolve_model(model_id: str) -> Any:
    if model_id.startswith(OPENROUTER_PREFIX):
        openrouter_id = model_id[len(OPENROUTER_PREFIX) :]
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            raise ValueError(
                "OPENROUTER_API_KEY must be set when using OpenRouter models. "
                "Get a key at https://openrouter.ai/settings/keys"
            )
        return OpenRouter(id=openrouter_id, api_key=api_key)
    ollama_id = MODEL_MAP.get(model_id, model_id)
    return Ollama(id=ollama_id, host=OLLAMA_HOST)


FALLBACK_MODELS = [
    "llama3.2:latest",
    "llama3.1:latest",
    "llama3:latest",
    "phi3:latest",
    "gemma:latest",
    "mistral:latest",
]


def _build_system_prompt(manifest: ShroomManifest) -> str:
    skills = ", ".join(manifest.spec.skills) if manifest.spec.skills else "general"
    return (
        f"You are {manifest.metadata.name} ({manifest.metadata.id}), "
        f"a shroom in the Mycelium OS organisation.\n"
        f"Your skills: {skills}.\n"
        f"You escalate unresolved issues to: {manifest.spec.escalates_to or 'human'}.\n"
        f"Always respond concisely and stay in character."
    )


def _create_agno_db() -> PostgresDb:
    return PostgresDb(
        db_url=DATABASE_URL,
        session_table="agno_sessions",
    )


def _create_agent_with_model(
    manifest: ShroomManifest, model_id: str, db: PostgresDb | None
) -> Agent:
    kwargs: dict = {
        "name": manifest.metadata.id,
        "model": _resolve_model(model_id),
        "instructions": [_build_system_prompt(manifest)],
        "markdown": True,
    }
    if db:
        kwargs["db"] = db
    return Agent(**kwargs)


def create_agent(manifest: ShroomManifest, db: PostgresDb | None = None) -> Agent:
    raw = manifest.spec.model
    model_id = raw if raw.startswith(OPENROUTER_PREFIX) else MODEL_MAP.get(raw, raw)
    return _create_agent_with_model(manifest, model_id, db)


class ShroomController:
    def __init__(self, db: PostgresDb | None = None) -> None:
        self.manifests: dict[str, ShroomManifest] = {}
        self.agents: dict[str, Agent] = {}
        self.db = db or _create_agno_db()

    def register(self, manifest: ShroomManifest) -> None:
        self.manifests[manifest.metadata.id] = manifest
        self.agents[manifest.metadata.id] = create_agent(manifest, self.db)

    def get_agent(self, shroom_id: str) -> Agent | None:
        return self.agents.get(shroom_id)

    def get_resolved_model(self, shroom_id: str) -> str | None:
        m = self.manifests.get(shroom_id)
        if not m:
            return None
        return MODEL_MAP.get(m.spec.model, m.spec.model)

    def create_temp_agent(self, shroom_id: str, model_id: str) -> Agent | None:
        manifest = self.manifests.get(shroom_id)
        if not manifest:
            return None
        return _create_agent_with_model(manifest, model_id, self.db)

    def list_shrooms(self) -> list[dict]:
        return [
            {
                "id": m.metadata.id,
                "name": m.metadata.name,
                "model": m.spec.model,
                "skills": m.spec.skills,
                "escalates_to": m.spec.escalates_to,
                "status": "running",
            }
            for m in self.manifests.values()
        ]

    def get_shroom(self, shroom_id: str) -> dict | None:
        m = self.manifests.get(shroom_id)
        if not m:
            return None
        return {
            "id": m.metadata.id,
            "name": m.metadata.name,
            "model": m.spec.model,
            "skills": m.spec.skills,
            "escalates_to": m.spec.escalates_to,
            "sla_response_minutes": m.spec.sla_response_minutes,
            "can": m.spec.can,
            "cannot": m.spec.cannot,
            "mcps": m.spec.mcps,
            "status": "running",
        }
