## Capability: org-graph

### Overview

Expose the shroom organisation as a typed graph and provide sufficient data for the frontend to render an interactive Org Graph view with live activity overlays and focus paths for traces/sessions.

### Data Shapes

#### ShroomNode

- `id: string` — shroom_id
- `name: string` — human-friendly label
- `role: string`
- `tags: string[]`
- `model: string`
- `capabilities`:
  - `can_read: string[]`
  - `can_write: string[]`
  - `can_propose: string[]`
  - `cannot_execute: string[]`
- `escalates_to: string | null`
- `sla_response_minutes: number | null`
- `metadata: object`

#### OrgEdge

- `from: string` (shroom_id)
- `to: string` (shroom_id)
- `type: "reports-to" | "requests-from" | "monitors" | "triggers" | "collaborates-with"`
- `metadata: object`

#### OrgGraph

- `nodes: ShroomNode[]`
- `edges: OrgEdge[]`
- `layout_hints?`:
  - `groups: { id: string; label: string; node_ids: string[] }[]`

#### ShroomActivityState

- `shroom_id: string`
- `status: "idle" | "busy" | "waiting" | "error"`
- `last_event`:
  - `event: string`
  - `timestamp: string`
  - `topic?: string`
- `metrics_window`:
  - `window_seconds: number`
  - `events_total: number`
  - `tasks_started: number`
  - `tasks_completed: number`
  - `escalations_raised: number`
  - `errors: number`

#### OrgGraphWithActivity

- `graph: OrgGraph`
- `activity: ShroomActivityState[]`

#### OrgPath

- `nodes: string[]` — ordered list of shroom_ids
- `edges: OrgEdge[]`

### API Endpoints

#### GET `/org/graph`

- **Purpose**: return org topology (and optionally activity) for the current company.
- **Auth**: same as other control-plane read endpoints; must respect future auth decisions and not expose cross-tenant data.
- **Query Parameters**:
  - `include_activity?: boolean` (default: `true`).
  - `activity_window_seconds?: number` (default: 300).
- **Response**:
  - When `include_activity = false`: `OrgGraph`.
  - Otherwise: `OrgGraphWithActivity`.
- **Semantics**:
  - Graph is derived from current constitution / Neo4j, not from ad-hoc events.
  - Activity aggregates are computed over the requested window using ShroomEvents.

#### GET `/org/shrooms/{id}`

- **Purpose**: detailed node view for side panel.
- **Auth**: required.
- **Response**:
  - `node: ShroomNode`
  - `incoming_edges: OrgEdge[]`
  - `outgoing_edges: OrgEdge[]`
  - `activity?: ShroomActivityState`
  - `recent_events?: ShroomEvent[]` (bounded list, e.g. last 20)

#### GET `/org/graph/paths`

- **Purpose**: constrained path queries for focus modes, including traces/sessions.
- **Query**:
  - `from?: string`
  - `to?: string`
  - `max_length?: number` (default: 4)
  - `edge_types?: string[]`
- **Response**:
  - `paths: OrgPath[]`

### Behaviour

- Every shroom in `mycelium.yaml` must appear exactly once in `OrgGraph.nodes`.
- Every `graph.edges` entry must be represented in `OrgGraph.edges`.
- No additional edges are introduced from event data.
- Activity state is derived from ShroomEvents using a simple state machine and counters.
- Missing or unknown shrooms in events are ignored for topology but may still be counted in logs/metrics.
- The implementation must remain usable and performant for org graphs up to at least 200 shrooms.

### Non-Functional

- Endpoint latency should remain acceptable for org graphs up to at least 200 nodes.
- API must be read-only; modifications to topology flow via constitution and existing governance workflow.
- Implementation must be secure-by-default and compatible with future auth and multi-tenant decisions.
