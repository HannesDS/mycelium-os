## Context

MYC-28 removed client-supplied `session_id` to prevent hijacking. Sessions are server-generated only. Each message creates a new session. Multi-turn continuity is lost. SB-003 (SECURITY_BACKLOG.md) requires auth + session binding before multi-user deployment. Control plane has no auth today (MYC-26: no auth for MVP). This change restores continuity in an auth-gated way.

## Goals / Non-Goals

**Goals:**
- Restore multi-turn chat continuity: one session per conversation
- Bind sessions to authenticated principal + shroom
- Validate session reuse; reject foreign sessions with 403
- Auth-protect sessions API; filter by principal

**Non-Goals:**
- Full auth system design (separate ticket)
- Rate limiting, session expiry, session revocation
- Multi-tenant isolation beyond principal (beads, etc.)

## Decisions

### 1. Auth: minimal dev auth vs full auth

**Choice:** Minimal dev auth for MVP — single principal (e.g. `dev-user`) when no real auth. Full auth deferred.

**Rationale:** OPEN-QUESTIONS.md says no auth for MVP. Session binding requires a principal. Minimal dev auth unblocks continuity without designing OAuth/JWT. Production auth is a separate ticket.

**Alternatives:** (a) No auth, accept single-user risk — contradicts SB-003. (b) Full auth first — blocks this ticket.

### 2. Session binding storage

**Choice:** Postgres table `session_bindings (principal_id, shroom_id, session_id, created_at)` with unique (principal_id, shroom_id) for "current" binding per principal+shroom. One active binding per principal+shroom; new session overwrites.

**Rationale:** Control plane already uses Postgres. Simple, queryable, survives restarts. Agno stores messages; we store ownership.

**Alternatives:** (a) In-memory — lost on restart. (b) Redis — extra service. (c) Agno metadata — Agno may not expose principal; we need control-plane ownership.

### 3. Session binding lifecycle

**Choice:** On first message (no session_id): create Agno session, insert binding, return session_id. On subsequent message (with session_id): verify binding exists and matches principal+shroom; reuse; else 403.

**Rationale:** Server owns session creation. Client never creates sessions. Client only sends back previously received session_id.

### 4. Sessions API auth

**Choice:** `GET /sessions` and `GET /sessions/{id}` require auth. Filter by principal: only return sessions where binding exists for caller's principal. 401 when unauthenticated, 403 when session exists but not owned.

**Rationale:** SB-003. Without auth, sessions are exposed to anyone.

## Risks / Trade-offs

- [Minimal dev auth is weak] → Mitigation: deploy constraint (localhost/compose only). Document in security backlog.
- [Binding table grows unbounded] → Mitigation: Phase 2 — retention policy, cleanup job. Out of scope here.
- [Session overwrite: new conversation overwrites binding] → Mitigation: One active binding per principal+shroom is intentional. Old sessions remain in Agno; list/detail filter by principal. If we want multiple concurrent sessions per principal+shroom later, schema change.

## Migration Plan

1. Add `session_bindings` table (Alembic migration)
2. Add auth layer (or dev auth stub)
3. Implement binding in message handler; add optional `session_id` to request
4. Add auth + filtering to sessions router
5. Frontend: persist session_id from response; send on subsequent messages

Rollback: Remove session_id from request schema; revert to "always create new session". Bindings table can remain.

## Open Questions

- Exact dev auth mechanism: API key header? Cookie? Environment variable for principal_id?
- Resolve before implementation or accept as implementation detail.
