## Why

MYC-28 security fixes (SB-003) removed client-supplied `session_id` to prevent session hijacking. Each message now creates a new session. Multi-turn chat continuity is lost — the sessions view shows many single-message sessions instead of coherent conversations. We need to restore continuity while keeping sessions secure and principal-bound.

## What Changes

- Add authentication to control plane (prerequisite; may be minimal dev auth for MVP)
- Store session binding: `(principal_id, shroom_id) -> session_id` when server creates a session
- Allow client to send `session_id` on subsequent messages; server validates ownership before reuse
- Require auth on `GET /sessions` and `GET /sessions/{id}`; filter results by principal
- Return 403 when client attempts to reuse a session not bound to their principal

## Capabilities

### New Capabilities

- `session-binding`: Server-owned session binding. On first message: create session, store binding (principal_id, shroom_id) -> session_id, return session_id. On subsequent messages: accept optional session_id, verify binding, reuse or reject 403.

### Modified Capabilities

- `sessions-api`: Require authentication. Filter `GET /sessions` and `GET /sessions/{id}` by principal. Return 401 when unauthenticated, 403 when session does not belong to caller.

## Impact

- Control plane: new auth layer (or minimal dev auth), session binding store (Postgres table or Agno metadata)
- `POST /shrooms/{shroom_id}/message`: optional `session_id` in request body; validation logic
- `GET /sessions`, `GET /sessions/{id}`: auth required, principal-scoped
- Frontend: pass `session_id` from first response into subsequent message requests; handle 401/403
- Linear: MYC-38
