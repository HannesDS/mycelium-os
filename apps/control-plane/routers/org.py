from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, Field

from core.controller import ShroomController
from core.manifest import MyceliumConfig, ShroomManifest


router = APIRouter(prefix="/org", tags=["org"])


class ShroomNode(BaseModel):
    id: str
    name: str
    role: str
    tags: list[str] = Field(default_factory=list)
    model: str
    capabilities: dict[str, list[str]] = Field(default_factory=dict)
    escalates_to: str | None = None
    sla_response_minutes: int | None = None


class OrgEdge(BaseModel):
    from_: str = Field(alias="from")
    to: str
    type: str
    metadata: dict[str, Any] = Field(default_factory=dict)

    model_config = {"populate_by_name": True}


class OrgGraph(BaseModel):
    nodes: list[ShroomNode] = Field(default_factory=list)
    edges: list[OrgEdge] = Field(default_factory=list)
    layout_hints: dict[str, Any] = Field(default_factory=dict)


class ShroomActivityMetrics(BaseModel):
    window_seconds: int
    events_total: int
    tasks_started: int
    tasks_completed: int
    escalations_raised: int
    errors: int


class ShroomActivityState(BaseModel):
    shroom_id: str
    status: str
    last_event: dict[str, Any] | None = None
    metrics_window: ShroomActivityMetrics


class OrgGraphResponse(BaseModel):
    graph: OrgGraph
    activity: list[ShroomActivityState]


class OrgPath(BaseModel):
    nodes: list[str]
    edges: list[OrgEdge]


class OrgPathsResponse(BaseModel):
    paths: list[OrgPath]


class OrgShroomDetail(BaseModel):
    node: ShroomNode
    incoming_edges: list[OrgEdge] = Field(default_factory=list)
    outgoing_edges: list[OrgEdge] = Field(default_factory=list)
    activity: ShroomActivityState | None = None
    recent_events: list[dict[str, Any]] = Field(default_factory=list)


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


def _build_node(manifest: ShroomManifest) -> ShroomNode:
    capabilities: dict[str, list[str]] = {}
    for entry in manifest.spec.can:
        for key, value in entry.items():
            capabilities.setdefault(key, []).extend(value)
    for entry in manifest.spec.cannot:
        for key, value in entry.items():
            capabilities.setdefault(f"cannot_{key}", []).extend(value)

    return ShroomNode(
        id=manifest.metadata.id,
        name=manifest.metadata.name,
        role=manifest.metadata.name,
        model=manifest.spec.model,
        tags=[],
        capabilities=capabilities,
        escalates_to=manifest.spec.escalates_to,
        sla_response_minutes=manifest.spec.sla_response_minutes,
    )


def _build_edges(config: MyceliumConfig) -> list[OrgEdge]:
    raw_edges = config.graph.get("edges", []) if config.graph else []
    return [
        OrgEdge(**{"from": e["from"], "to": e["to"], "type": e["type"]})
        for e in raw_edges
    ]


def _default_activity(
    shroom_ids: list[str], window_seconds: int
) -> list[ShroomActivityState]:
    metrics = ShroomActivityMetrics(
        window_seconds=window_seconds,
        events_total=0,
        tasks_started=0,
        tasks_completed=0,
        escalations_raised=0,
        errors=0,
    )
    return [
        ShroomActivityState(
            shroom_id=sid,
            status="idle",
            last_event=None,
            metrics_window=metrics,
        )
        for sid in shroom_ids
    ]


@router.get(
    "/graph",
    response_model=OrgGraphResponse,
    summary="Get org graph with optional activity data",
)
def get_org_graph(
    request: Request,
    include_activity: bool = True,
    activity_window_seconds: int = 300,
) -> OrgGraphResponse:
    config = _get_config(request)
    controller = _get_controller(request)

    manifests = controller.manifests
    nodes = [_build_node(m) for m in manifests.values()]
    edges = _build_edges(config)

    graph = OrgGraph(nodes=nodes, edges=edges)
    activity = (
        _default_activity([n.id for n in nodes], activity_window_seconds)
        if include_activity
        else []
    )

    return OrgGraphResponse(graph=graph, activity=activity)


@router.get(
    "/shrooms/{shroom_id}",
    response_model=OrgShroomDetail,
    summary="Get org-level detail for a single shroom",
)
def get_org_shroom_detail(request: Request, shroom_id: str) -> OrgShroomDetail:
    config = _get_config(request)
    controller = _get_controller(request)

    manifest = controller.manifests.get(shroom_id)
    if manifest is None:
        raise HTTPException(status_code=404, detail=f"Shroom '{shroom_id}' not found")

    node = _build_node(manifest)
    edges = _build_edges(config)
    incoming = [e for e in edges if e.to == shroom_id]
    outgoing = [e for e in edges if e.from_ == shroom_id]

    activity = _default_activity([shroom_id], window_seconds=300)[0]

    return OrgShroomDetail(
        node=node,
        incoming_edges=incoming,
        outgoing_edges=outgoing,
        activity=activity,
        recent_events=[],
    )


@router.get(
    "/graph/paths",
    response_model=OrgPathsResponse,
    summary="Compute paths in the org graph between shrooms",
)
def get_org_paths(
    request: Request,
    from_id: str = Query(..., alias="from"),
    to_id: str = Query(..., alias="to"),
    max_length: int = 4,
    edge_types: list[str] | None = Query(default=None),
) -> OrgPathsResponse:
    config = _get_config(request)
    edges = _build_edges(config)

    if edge_types:
        edges = [e for e in edges if e.type in edge_types]

    adjacency: dict[str, list[OrgEdge]] = {}
    for edge in edges:
        adjacency.setdefault(edge.from_, []).append(edge)

    paths: list[OrgPath] = []
    queue: list[tuple[str, list[str], list[OrgEdge]]] = [(from_id, [from_id], [])]
    visited: set[tuple[str, int]] = set()

    while queue:
        current, nodes, used_edges = queue.pop(0)
        if (current, len(nodes)) in visited:
            continue
        visited.add((current, len(nodes)))

        if current == to_id:
            paths.append(OrgPath(nodes=nodes, edges=used_edges))
            continue

        if len(nodes) > max_length:
            continue

        for edge in adjacency.get(current, []):
            if edge.to in nodes:
                continue
            queue.append(
                (
                    edge.to,
                    nodes + [edge.to],
                    used_edges + [edge],
                )
            )

    if not paths and from_id == to_id:
        paths.append(OrgPath(nodes=[from_id], edges=[]))

    return OrgPathsResponse(paths=paths)

