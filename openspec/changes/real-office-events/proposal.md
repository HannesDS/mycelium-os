## Why

The Office canvas and escalation flow are scripted: `ZenikOfficeCanvas` uses `injectEvent` (mock-event-loop) and local timeouts instead of real control-plane events. Approvals are seeded in the DB but the UI does not consume them; approve/reject calls `injectEvent` instead of the approvals API. The backend can already broadcast NATS and expose `/ws/events`, but the frontend treats them as optional—falling back to mock when WS is unavailable or after reconnect fails. Without real events and a minimal execution pipeline, Mycelium is a demo, not a usable product.

## What Changes

- **Office consumes WS events as first-class**: Replace mock-driven escalation flow with real control-plane events. No `injectEvent` for escalation. Approve/reject calls the approvals API; control plane emits `decision_received` to NATS after audit log write.
- **Event replay and backfill on reconnect**: On WS connect, fetch recent events from control plane (e.g. `GET /events?since=...` or `GET /events`) and replay; then subscribe to live stream. Deterministic ordering: backfill first, then live events.
- **Trigger escalation creates real approval**: "Trigger escalation" button calls control plane to create a new Approval in DB, emit `escalation_raised` + `message_sent` to NATS, and show the Approvals inbox (or fetch pending approvals). No local timeouts.
- **Minimal execution pipeline**: One shroom (e.g. sales-shroom) can run a real task: receive message → LLM call → emit events → raise escalation → wait for approval → continue. Persists session state; writes audit log before emit; approvals as gate.
- **Event log API**: Control plane exposes `GET /events` (queryable, filter by shroom/session/topic) for backfill and replay.
- **Approvals emit decision_received**: When human approves/rejects, control plane writes audit log, then emits `decision_received` ShroomEvent to NATS so the Office and any running shroom can react.

## Capabilities

### New Capabilities

- `office-events`: Office canvas consumes real events from WS and backfill API; event replay on reconnect; no mock escalation flow.
- `event-log-api`: Control plane `GET /events` for queryable, append-only event log with filters (shroom_id, session_id, topic, since).
- `approval-nats-emit`: Approvals API emits `decision_received` to NATS after audit log write when human approves/rejects.
- `trigger-escalation-api`: Control plane endpoint to create a demo escalation (approval + NATS events) for "Trigger escalation" button.
- `execution-pipeline`: Minimal task execution: shroom receives message, runs LLM, emits events, raises escalation; approval gate; session persistence.

### Modified Capabilities

- `sessions-api`: Extend session model to support task execution and event emission (if needed for execution pipeline).

## Impact

- **Frontend**: `ZenikOfficeCanvas` refactor—remove `injectEvent`, use approvals API and `triggerEscalation` API; use `startEventSource` with backfill; event ordering logic.
- **Control plane**: New `/events` router, `GET /events`; `POST /demo/trigger-escalation`; approvals router emits to NATS; execution pipeline (Agno + session + audit + NATS).
- **Event source**: Backfill on connect; optional `GET /events` integration.
- **Dependencies**: None new beyond existing NATS, Postgres, Agno.
