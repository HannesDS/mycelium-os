from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from core.controller import ShroomController
from core.manifest import MyceliumConfig


router = APIRouter(tags=["constitution"])


class ShroomManifestResponse(BaseModel):
    name: str
    model: str
    skills: list[str] = Field(default_factory=list)
    escalates_to: str | None = None
    sla_response_minutes: int | None = None
    can: list[dict[str, list[str]]] = Field(default_factory=list)
    cannot: list[dict[str, list[str]]] = Field(default_factory=list)
    mcps: list[str] = Field(default_factory=list)


class ShroomConstitutionEntry(BaseModel):
    id: str
    manifest: ShroomManifestResponse


class GraphEdge(BaseModel):
    from_: str = Field(alias="from")
    to: str
    type: str

    model_config = {"populate_by_name": True}


class GraphResponse(BaseModel):
    edges: list[GraphEdge] = Field(default_factory=list)


class ConstitutionResponse(BaseModel):
    company: dict[str, str]
    shrooms: list[ShroomConstitutionEntry]
    graph: GraphResponse


def _get_config(request: Request) -> MyceliumConfig:
    config = getattr(request.app.state, "mycelium_config", None)
    if config is None:
        raise HTTPException(status_code=503, detail="Constitution not loaded")
    return config


def _get_controller(request: Request) -> ShroomController:
    controller = getattr(request.app.state, "controller", None)
    if controller is None:
        raise HTTPException(status_code=503, detail="Control plane not initialized")
    return controller


@router.get(
    "/constitution",
    response_model=ConstitutionResponse,
    summary="Get the full constitutional view",
)
def get_constitution(request: Request):
    config = _get_config(request)
    controller = _get_controller(request)

    shrooms = []
    for shroom_id, manifest in sorted(controller.manifests.items()):
        shrooms.append(
            ShroomConstitutionEntry(
                id=shroom_id,
                manifest=ShroomManifestResponse(
                    name=manifest.metadata.name,
                    model=manifest.spec.model,
                    skills=manifest.spec.skills,
                    escalates_to=manifest.spec.escalates_to,
                    sla_response_minutes=manifest.spec.sla_response_minutes,
                    can=manifest.spec.can,
                    cannot=manifest.spec.cannot,
                    mcps=manifest.spec.mcps,
                ),
            )
        )

    raw_edges = config.graph.get("edges", []) if config.graph else []
    edges = [
        GraphEdge(**{"from": e["from"], "to": e["to"], "type": e["type"]})
        for e in raw_edges
    ]

    return ConstitutionResponse(
        company=config.company,
        shrooms=shrooms,
        graph=GraphResponse(edges=edges),
    )
