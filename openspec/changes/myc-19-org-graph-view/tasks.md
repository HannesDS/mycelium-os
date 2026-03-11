## Tasks

### Backend / Control Plane

- Define data models for `ShroomNode`, `OrgEdge`, `OrgGraph`, `ShroomActivityState`, and `OrgPath` in the control plane.
- Implement `GET /org/graph`:
  - Derive topology from `mycelium.yaml` / Neo4j.
  - Add per-shroom activity aggregates for a configurable time window.
- Implement `GET /org/shrooms/{id}`:
  - Return node details, incoming/outgoing edges, optional activity, and bounded recent events.
- Implement `GET /org/graph/paths` for constrained path queries:
  - Support basic path queries for focus modes (e.g. traces/sessions).
- Add tests to validate that `/org/graph` matches constitution / Neo4j data and respects security constraints.

### Event Integration

- Ensure ShroomEvents are exposed on WebSocket in a way the Organisation view can consume.
- Define the mapping from ShroomEvents to `ShroomActivityState` (status + metrics).
- Implement windowed metrics aggregation in the control plane for the OrgGraph API.

### Frontend / Organisation View

- Add Organisation route and sidebar navigation item if not already present.
- Implement canvas-based graph renderer for `OrgGraph` with hierarchical layout by `reports-to` and optional network layout.
- Implement node/edge visual semantics (colors, badges, styles) as per design, showing all edge types by default where possible.
- Implement side panel for shroom details, backed by `/org/shrooms/{id}`.
- Implement filters (status, role/tag, edge type) and time-window selector.
- Connect WebSocket ShroomEvents to graph state and animations.
- Implement focus integration using `/org/graph/paths` to highlight flows on the full graph.

### UX / DX

- Seed dev environment with the 5-shroom MVP graph and ensure it renders correctly.
- Add Storybook stories / fixtures for small, medium, and dense org graphs (up to ~200 nodes).
- Document how the org graph is derived from constitution and how changes propagate.
