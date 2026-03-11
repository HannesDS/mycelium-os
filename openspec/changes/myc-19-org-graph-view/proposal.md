## Title

Org graph view — interactive shroom topology (MYC-19)

## Context

- Navigation has a locked "🌿 Organisation" entry intended for an org graph view (`docs/project-state/BACKLOG.md`).
- `mycelium.yaml` defines shrooms and `graph.edges` (reports-to, collaborates-with, etc.) and is the constitutional source of truth.
- Neo4j is the graph store for shroom topology.
- NATS + WebSocket bridge (MYC-24) expose a live stream of ShroomEvents describing shroom activity.
- Today there is no way to see the shroom org topology or how work and escalations actually flow through it.

## Problem

Operators and designers have no visual, live view of:

- Which shrooms exist and how they relate (hierarchy, collaboration, triggers).
- Which shrooms are currently busy, idle, waiting on decisions, or in error.
- How work and escalations actually traverse the organisation over time.

This makes it hard to:

- Explain the system to humans ("who does what, and who talks to whom").
- Diagnose routing issues or bottlenecks.
- Validate that the implemented topology matches the intended constitution.

## Proposal

Add an Organisation view that renders the shroom topology as an interactive graph:

- Nodes: shrooms (from constitution / Neo4j).
- Edges: typed relationships (`reports-to`, `requests-from`, `monitors`, `triggers`, `collaborates-with`).
- Live overlays: status and recent activity per shroom, driven by ShroomEvents.

Backend:

- Control plane exposes a read-only OrgGraph API derived from constitution/Neo4j, under `/org/graph` and related endpoints.
- Per-shroom activity aggregates (windowed metrics) are computed in the control plane and exposed via the OrgGraph API.

Frontend:

- New `Organisation` page renders the graph on a canvas, with pan/zoom and a side panel.
- Live ShroomEvents animate along the graph and update per-node status.

## Goals

- Visualise shroom topology for a single company, derived from `mycelium.yaml`.
- Make escalation paths and collaboration relationships obvious at a glance.
- Overlay live status (idle / busy / waiting / error) and recent activity per shroom.
- Reuse existing canvas and side-panel primitives from the Office and Shrooms views.
- Keep backend aspects future proof and secure, following control plane and OpenSpec constraints.

## Non-Goals

- Editing topology from the UI (no graph mutations; constitution remains the source of truth).
- Full trace/session replay on the org graph (belongs to MYC-27/MYC-28), though the graph must support focus views for specific traces/sessions.
- Multi-tenant / cross-company org views.
- Complex layout editors or visual theming.

## Risks / Trade-offs

- Dense graphs may become visually cluttered; mitigations via filters, edge-type toggles, and capped org sizes for v1. Default view still shows all edge types where possible.
- Live event volume may impact browser performance; mitigations via windowing, throttling, and aggregating in control plane.
- Layout stability vs dynamic topology changes (e.g. new shrooms or edges); v1 treats layout as purely computed per constitution revision, no persisted layout state.

## Acceptance Criteria

- Organisation nav item renders an interactive org graph for the current company.
- Every shroom from `mycelium.yaml` appears as a node; every `graph.edges` entry appears as a typed edge.
- Clicking a node opens a side panel showing its manifest summary and graph relationships.
- ShroomEvents received via WebSocket update node status and trigger appropriate animations.
- For the MVP 5-shroom "digital agency" setup, the org graph is readable and clearly shows escalation and collaboration paths.
- Scale target: the implementation remains usable and performant up to at least 200 shrooms in a single company graph.
