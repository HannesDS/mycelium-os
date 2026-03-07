from __future__ import annotations

import os

from agno.agent import Agent
from agno.models.ollama import Ollama

from core.manifest import ShroomManifest

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

MODEL_MAP = {
    "mistral-7b": "mistral:latest",
    "mistral:latest": "mistral:latest",
}


def _build_system_prompt(manifest: ShroomManifest) -> str:
    skills = ", ".join(manifest.spec.skills) if manifest.spec.skills else "general"
    return (
        f"You are {manifest.metadata.name} ({manifest.metadata.id}), "
        f"a shroom in the Mycelium OS organisation.\n"
        f"Your skills: {skills}.\n"
        f"You escalate unresolved issues to: {manifest.spec.escalates_to or 'human'}.\n"
        f"Always respond concisely and stay in character."
    )


def create_agent(manifest: ShroomManifest) -> Agent:
    model_id = MODEL_MAP.get(manifest.spec.model, manifest.spec.model)
    return Agent(
        name=manifest.metadata.id,
        model=Ollama(id=model_id, host=OLLAMA_HOST),
        instructions=[_build_system_prompt(manifest)],
        markdown=True,
    )


class ShroomController:
    def __init__(self) -> None:
        self.manifests: dict[str, ShroomManifest] = {}
        self.agents: dict[str, Agent] = {}

    def register(self, manifest: ShroomManifest) -> None:
        self.manifests[manifest.metadata.id] = manifest
        self.agents[manifest.metadata.id] = create_agent(manifest)

    def get_agent(self, shroom_id: str) -> Agent | None:
        return self.agents.get(shroom_id)

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
