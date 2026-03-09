## Context

Agno stores sessions in a database when `db` is configured on the Agent. Each session has `session_id`, `agent_id`, `runs` (message history), `created_at`, `updated_at`. The control plane currently creates Agents without `db` — sessions are not persisted. MYC-22 delivers the control plane + Agno runtime; this change adds session persistence and a UI to inspect them.

**ADR-005**: Agno session storage: SQLite dev / Postgres prod. OPEN-QUESTIONS.md recommends Postgres for docker-compose MVP.

**Control plane vs data plane**: Session storage is data plane (ephemeral, observable). The control plane proxies reads only — no governance logic. Frontend never hits Agno directly.

## Goals / Non-Goals

**Goals:**
- Operational visibility: see active and completed shroom sessions
- Debug support: drill into session detail with full message history
- Link sessions to audit log via `metadata.session_id` (ShroomEvent schema)

**Non-Goals:**
- Terminating active sessions from UI (Phase 2)
- Session replay
- Cross-shroom session correlation
- Search/filter beyond Active/Completed tabs

## Decisions

### 1. Agno session storage: Postgres, shared with control plane

**Choice:** Use Postgres for Agno session storage, same instance as control plane (`DATABASE_URL`).

**Rationale:** docker-compose already runs Postgres. OPEN-QUESTIONS.md recommends Postgres. Single DB simplifies ops. Agno's `PostgresDb` supports `session_table` — we use `agno_sessions` (default) or a namespaced table.

**Alternative:** SQLite per agent — rejected; no cross-shroom listing, harder to query.

### 2. Control plane proxies Agno session storage via Python API

**Choice:** Control plane configures Agents with `db=PostgresDb(...)` and queries sessions via Agno's storage API. Implement `GET /sessions` and `GET /sessions/{id}` that aggregate across all registered shrooms.

**Rationale:** Frontend never hits Agno directly (CLAUDE.md). Agno's `Agent.get_session()` and db read methods give us session data. We need a way to list sessions — Agno's db typically exposes `read_sessions()` or we query `agno_sessions` table directly with `agent_id IN (shroom_ids)`.

**Implementation:** Add `PostgresDb` to controller's agent creation. Sessions router queries db for sessions where `agent_id` matches a known shroom. For `GET /sessions/{id}`, use `agent.get_session(session_id)` on the owning agent (from `agent_id` in session record).

### 3. Active vs Completed: heuristic based on recency

**Choice:** "Active" = session updated in last N minutes (e.g. 5). "Completed" = older. No explicit status field in Agno schema — we infer from `updated_at`.

**Rationale:** Agno doesn't have a first-class "active" flag. Sessions that received a message recently are effectively active. Simple, no schema change.

**Alternative:** Add `status` to our API response — computed, not stored.

### 4. Audit log linkage: `metadata.session_id` in ShroomEvents

**Choice:** When emitting ShroomEvents, include `metadata.session_id` when a session context exists. Session detail view fetches audit log entries where `details->>'session_id' = session_id`.

**Rationale:** docs/design/SHROOM-EVENT-SCHEMA.md allows arbitrary `metadata`. Audit log `details` JSON can store `session_id`. Requires ensuring shroom message flow passes session_id into event emission (MYC-22 may need a small change).

### 5. Frontend: Server Components for list, client for auto-refresh

**Choice:** Sessions page uses Next.js App Router. List fetched server-side. Active tab uses `useEffect` + `setInterval` to refetch every 10s (client component or client-only section).

**Rationale:** Vercel best practices: server for initial data, client for interactivity. Avoid full page reload.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-------------|
| Agno db API may not expose list_sessions | Fallback: raw SQL on `agno_sessions` table if Agno schema is stable |
| Session storage adds latency to agent creation | Acceptable for MVP; agents are created at startup |
| Active heuristic may misclassify | Tune N minutes; document in UI |

## Migration Plan

1. Add `PostgresDb` to Agent creation in controller (requires `agno_sessions` table — Agno creates it on first write)
2. Deploy sessions router
3. Add `/sessions` route and nav item (already in nav-items, `enabled: false` → `true`)
4. No rollback needed — sessions API is additive

## Open Questions

- Confirm Agno Python `PostgresDb` / `read_sessions` API for listing. If absent, use direct table query with schema compatibility check.
