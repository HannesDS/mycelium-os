## Context

- Current state: `ZenikOfficeCanvas` subscribes to `startEventSource` (WS or mock fallback) but the escalation flow is scripted via `injectEvent` and local timeouts. Approve/reject uses `injectEvent` (mock-event-loop) instead of the approvals API. Control plane has NATS + WebSocket bridge, approvals API, and seeded demo approvals. No `GET /events` endpoint; no backfill on reconnect.
- Constraints: Audit log before NATS emit (ADR-002, SHROOM-EVENT-SCHEMA). Control plane vs data plane separation (CLAUDE.md). No direct DB from frontend.
- Stakeholders: Operators viewing the Office; shrooms that need approval decisions.

## Goals / Non-Goals

**Goals**

- Office canvas consumes real events from WS and backfill API; no mock escalation.
- Event replay and backfill on reconnect with deterministic ordering.
- Trigger escalation creates real approval and emits to NATS.
- Approve/reject calls control plane; control plane emits `decision_received` to NATS after audit log.
- Minimal execution pipeline: one shroom can run a real task (LLM → events → escalation → approval gate).
- Event log as queryable API for backfill and replay.

**Non-Goals**

- Full multi-shroom orchestration; auth; rate limiting; multi-user concurrency.
- Traces viewer (MYC-27); full session replay UI (MYC-28).
- Config evolution workflow (MYC-36).

## Decisions

### 1. Backfill strategy

**Decision**: On WS connect, fetch `GET /events?since=<last_timestamp>` (or `limit=100` if no last). Replay backfill events in order; then process live WS events. Client deduplicates by `(shroom_id, event, timestamp)` if needed.

**Alternatives**: Server-side cursor (more complex); no backfill (gaps on reconnect). Chosen for simplicity and correctness.

### 2. Event log storage

**Decision**: Append-only `events` table in Postgres (or reuse existing audit log). Schema: `id`, `shroom_id`, `event`, `to`, `topic`, `timestamp`, `payload_summary`, `metadata` (JSONB), `session_id` (nullable). Index on `(timestamp, shroom_id)` for queries.

**Alternatives**: NATS JetStream (replay from stream)—deferred for MVP; events in DB is simpler and aligns with audit log requirement.

### 3. Trigger escalation

**Decision**: `POST /demo/trigger-escalation` creates a new Approval in DB, emits `escalation_raised` and `message_sent` to NATS, returns `approval_id`. Frontend calls this; then polls or fetches pending approvals to show inbox. No local timeouts.

**Alternatives**: Time-based demo script in control plane—rejected; we want explicit user trigger for demo clarity.

### 4. Approval → NATS emit

**Decision**: In `approve_proposal` and `reject_proposal`, after audit log write and DB commit, call `nats_bus.publish_event(ShroomEvent(decision_received, ...))`. Event payload includes `metadata.approved` and `metadata.approval_id`.

**Alternatives**: Async job—adds latency; we want immediate feedback for Office.

### 5. Execution pipeline scope

**Decision**: Phase 1: `POST /sessions/{id}/messages` with `{ "content": "..." }` triggers Agno run for the session's shroom. Emit `task_started` before LLM call, `message_sent` or `escalation_raised` after. Persist session state; write to audit log before each NATS emit. Phase 2: Approval gate—when shroom raises escalation, wait for approval; on `decision_received`, continue execution.

**Alternatives**: Separate "task" entity—more complex; sessions already exist. Reuse sessions for task execution.

### 6. WS auth

**Decision**: Keep `ALLOW_INSECURE_WS=true` for MVP. No token-based WS auth in this change. Document that production must use auth or internal network.

## Risks / Trade-offs

- **Event volume**: High event rate may overwhelm client. Mitigation: Backfill cap (e.g. last 100 events); client-side throttling for animations.
- **Ordering**: Backfill + live can have overlap if events arrive during fetch. Mitigation: Dedupe by `(shroom_id, event, timestamp)`; prefer backfill order for replay.
- **Approval race**: Two users approve same proposal. Mitigation: Existing 409 on non-pending; no change.
- **Execution pipeline complexity**: Agno + session + audit + NATS is non-trivial. Mitigation: Start with single shroom, single message flow; no approval gate in Phase 1 if needed.

## Migration Plan

1. Add `events` table and `GET /events`; no breaking changes.
2. Add `POST /demo/trigger-escalation`; frontend can opt-in.
3. Add NATS emit to approvals; frontend switches approve/reject to API.
4. Refactor Office to use backfill + WS; remove `injectEvent` for escalation.
5. Add execution pipeline; wire one shroom end-to-end (optional Phase 2).

Rollback: Feature flags; revert frontend to mock if WS/API unavailable.

## Open Questions

- Exact `events` table schema vs reusing `audit_log` (audit log may have different shape).
- Whether `trigger-escalation` should create a real approval or a "demo" approval type (separate from production approvals).
