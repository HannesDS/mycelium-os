## Context

- MYC-19: Org graph view — interactive shroom topology in the Organisation nav item.
- Shroom definitions and relationships are stored in `mycelium.yaml` and Neo4j.
- ShroomEvents are emitted on NATS and bridged via WebSocket to the frontend.
- The Office view already uses a canvas; side panels exist for inspecting shrooms.
- Scale target: org graphs up to ~200 shrooms per company.
- Layout is purely computed for now; no persisted node positions.

## Goals / Non-Goals

**Goals**

- Provide an org-level overview of shroom topology and live activity.
- Make escalation chains and collaboration relationships explicit.
- Allow operators to inspect any shroom in context, with recent activity.
- Support focus modes for specific traces/sessions via path queries.
- Reuse canvas and side-panel primitives to minimise new UI surface.
- Keep backend design future proof and secure, following control plane constraints.

**Non-Goals**

- Editing the org graph from the UI.
- Full trace/session visualisations (Traces / Sessions will integrate later as consumers of org-graph).
- Handling multi-company or cross-tenant graphs.
- Persisted layout editing or visual theming.

## Data Flow

- Control plane exposes:
  - `GET /org/graph` returning `OrgGraphWithActivity`.
  - `GET /org/shrooms/{id}` returning node detail with edges and recent events.
  - `GET /org/graph/paths` for constrained path queries in focus modes.
- Frontend:
  - Fetches `/org/graph` on Organisation page load.
  - Subscribes to ShroomEvents via WebSocket.
  - Maintains in-memory `ShroomActivityState` per node and triggers animations.
  - Uses `/org/graph/paths` to highlight flows for specific traces/sessions when integrated.
- Topology is refreshed:
  - On page load.
  - When constitution version changes (TBD signalling mechanism).

## Layout

- Default layout: hierarchical by `reports-to`.
  - Roots: shrooms with no incoming `reports-to` edges.
  - Levels: depth determined by `reports-to` chains.
  - Other edge types overlaid without changing node positions.
- Optional alternate: network layout (force-directed) clustered by `tags` or role.
- Pan/zoom:
  - Mouse wheel / trackpad zoom.
  - Drag to pan.
  - "Fit to screen" control.
- Layout is computed on the client using stable, deterministic algorithms to avoid jitter.

## Visual Semantics

- Nodes:
  - Shape: pill or rounded rectangle with shroom icon.
  - Color encodes `status` (`idle`, `busy`, `waiting`, `error`) from `ShroomActivityState`.
  - Badges for role/tag and counts (e.g. escalations in window).
- Edges:
  - `reports-to`: solid line with arrow towards manager.
  - `requests-from`: dashed line.
  - `triggers`: bold line with arrow.
  - `monitors`: dotted line.
  - `collaborates-with`: double-headed line.
- Activity:
  - Pulses and glows along edges/nodes for ShroomEvents.
  - Error events colour nodes red and show a persistent badge until next healthy event.

## Interaction

- Clicking a node:
  - Opens side panel:
    - Header: name, id, role, model, SLA.
    - Capabilities from manifest.
    - Relationships grouped by edge type.
    - Recent events (summarised).
- Hovering an edge:
  - Tooltip with `{from} {type} {to}` and any edge metadata.
- Global controls:
  - Time window selector (e.g. 5m / 30m / 2h).
  - Filters for role/tag, status, and edge types; default view shows all edge types where possible.
- Focus integration:
  - Organisation view accepts context from Traces/Sessions (e.g. a set of shroom_ids or a source/target pair) and calls `/org/graph/paths` to highlight flows on top of the full graph.

## Event Mapping

- ShroomEvents drive:
  - Node status transitions (idle/busy/waiting/error).
  - Rolling metrics per node (events/tasks/escalations/errors).
  - Visual animations from `shroom_id` to optional `to` along relevant edges.
- Control plane provides:
  - Initial aggregates so the graph is informative before live events arrive.
  - Optional downsampling to avoid overloading the client.

## Security / Future-Proofing

- OrgGraph endpoints are read-only and respect the same auth and tenancy boundaries as other control plane endpoints.
- No write operations on topology are exposed.
- Implementation keeps a clean separation between control plane (topology, aggregates, security) and frontend (visualisation, animations).
- Design assumes future auth and multi-tenant decisions can be enforced at the router and query layers without breaking the API surface.

## Risks / Trade-offs

- Visual clutter for larger graphs:
  - Mitigate with filters, edge-type toggles, and potentially group collapsing if needed.
- Event flood:
  - Mitigate with client-side throttling and server-side aggregation.
- Layout stability:
  - Initial implementation uses deterministic layouts; persisted layouts can be added later without changing API shapes.

## Open Questions

- Exact signalling mechanism for constitution / topology version changes.
- Whether to compute activity aggregates entirely in control plane vs partial computation in frontend.
