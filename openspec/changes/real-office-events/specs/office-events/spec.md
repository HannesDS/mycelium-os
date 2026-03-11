## ADDED Requirements

### Requirement: Office consumes real events from WebSocket and backfill API

The Office canvas SHALL consume ShroomEvents from the control plane WebSocket (`/ws/events`) as the primary source. When WebSocket connects, the frontend SHALL fetch recent events via `GET /events` (backfill) and replay them before processing live WebSocket events. The Office SHALL NOT use `injectEvent` or mock-event-loop for the escalation flow.

#### Scenario: Backfill on WebSocket connect

- **GIVEN** WebSocket connects successfully
- **WHEN** the Office subscribes to the event stream
- **THEN** the frontend SHALL call `GET /events?limit=100` (or `since=<timestamp>` if available) and replay returned events in chronological order before processing any live WebSocket messages

#### Scenario: Live events after backfill

- **GIVEN** backfill has completed
- **WHEN** a new ShroomEvent arrives via WebSocket
- **THEN** the Office SHALL process it and update the canvas (speech bubbles, thought bubbles, node status) without re-fetching

#### Scenario: No mock escalation flow

- **GIVEN** user clicks "Trigger escalation"
- **WHEN** the button is clicked
- **THEN** the frontend SHALL call `POST /demo/trigger-escalation` (or equivalent) and SHALL NOT call `injectEvent`

#### Scenario: Approve and reject use control plane API

- **GIVEN** a pending approval is displayed in the HumanInboxCard
- **WHEN** user clicks Approve or Reject
- **THEN** the frontend SHALL call `POST /approvals/{id}/approve` or `POST /approvals/{id}/reject` and SHALL NOT call `injectEvent`

### Requirement: Event ordering is deterministic

The Office SHALL process events in deterministic order: backfill events first (chronological), then live WebSocket events. The client SHALL deduplicate events by `(shroom_id, event, timestamp)` when the same event appears in both backfill and live stream.

#### Scenario: Deduplication on overlap

- **GIVEN** backfill returns event E with timestamp T
- **WHEN** the same event E arrives via WebSocket before backfill replay completes
- **THEN** the Office SHALL process E only once (prefer backfill order)
