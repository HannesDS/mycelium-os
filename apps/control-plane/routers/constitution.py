from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from core.auth import get_principal
from core.constitution_writer import (
    ConstitutionWriterService,
    InvalidChangePayload,
    validate_change_payload,
)
from core.controller import ShroomController
from core.manifest import MyceliumConfig
from core.models import Approval, ConstitutionChange


router = APIRouter(tags=["constitution"])


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------


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


class ConstitutionChangeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    approval_id: uuid.UUID | None
    change_type: str
    change_summary: str
    payload: dict
    constitution_snapshot: dict
    applied_by: str
    applied_at: datetime


class ProposeChangeRequest(BaseModel):
    change_type: str = Field(
        description=(
            "One of: add_shroom, edit_shroom, remove_shroom, "
            "edit_company, edit_graph_edge, remove_graph_edge"
        )
    )
    payload: dict[str, Any] = Field(
        description="Structured change payload. Must include change_type field."
    )
    change_summary: str | None = Field(
        default=None,
        description="Human-readable summary of the proposed change (optional, auto-generated if omitted)",
    )


class ProposeChangeResponse(BaseModel):
    approval_id: uuid.UUID
    status: str
    summary: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


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


def _get_writer(request: Request) -> ConstitutionWriterService:
    writer = getattr(request.app.state, "constitution_writer", None)
    if writer is None:
        raise HTTPException(status_code=503, detail="Constitution writer not initialized")
    return writer


def _get_db(request: Request) -> Session:
    factory = getattr(request.app.state, "db_session_factory", None)
    if factory is None:
        raise HTTPException(status_code=503, detail="Database not initialized")
    session = factory()
    try:
        yield session
    finally:
        session.close()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


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


@router.post(
    "/constitution/propose",
    response_model=ProposeChangeResponse,
    status_code=201,
    summary="Propose a constitution change (creates a pending approval)",
)
def propose_constitution_change(
    body: ProposeChangeRequest,
    request: Request,
    principal_id: str = Depends(get_principal),
    db: Session = Depends(_get_db),
):
    # Merge change_type into payload and validate
    payload = dict(body.payload)
    payload["change_type"] = body.change_type
    if body.change_summary:
        payload["change_summary"] = body.change_summary

    try:
        validate_change_payload(payload)
    except InvalidChangePayload as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    from core.constitution_writer import _default_summary
    summary = body.change_summary or _default_summary(payload)

    approval = Approval(
        shroom_id="ceo-shroom",
        event_type="constitution_change",
        summary=summary,
        payload=payload,
        status="pending",
    )
    db.add(approval)
    db.commit()
    db.refresh(approval)

    return ProposeChangeResponse(
        approval_id=approval.id,
        status="pending",
        summary=summary,
    )


@router.get(
    "/constitution/changes",
    response_model=list[ConstitutionChangeResponse],
    summary="List applied constitution changes (history)",
)
def list_constitution_changes(
    request: Request,
    db: Session = Depends(_get_db),
    _principal: str = Depends(get_principal),
):
    changes = (
        db.query(ConstitutionChange)
        .order_by(ConstitutionChange.applied_at.desc())
        .limit(100)
        .all()
    )
    return changes
