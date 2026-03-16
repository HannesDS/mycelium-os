# Repository Sanity Audit — 2026-03-15

> Ticket: MYC-37 | Auditor: polecat/guzzle

---

## 1. Documentation Audit

### Issues Found & Fixed

**README.md — NATS described as JetStream (incorrect)**
- Line: `| NATS | localhost:4222 | Event bus (JetStream) |`
- Reality: Per TBD-1 resolution (OPEN-QUESTIONS.md), Core NATS is used for MVP. JetStream is deferred post-MVP.
- Fix: Updated to `Event bus (Core NATS; JetStream deferred post-MVP)`

**BACKLOG.md — outdated**
- `last updated: 2026-03-09` and MYC-37 was in the backlog without in-progress status.
- Fix: Updated last-updated date and marked MYC-37 as in progress.

### No Issues Found

- All internal links in README.md, CLAUDE.md, CONTRIBUTING.md, and docs/ resolve correctly.
- All ADR files ADR-001 through ADR-008 exist.
- OPEN-QUESTIONS.md accurately reflects resolved (TBD-1, TBD-5) and open (TBD-2, TBD-3, TBD-4, TBD-6) questions.
- CLAUDE.md current state section (`2026-03-07`) is accurate for infra/frontend status; control plane and shrooms have since been implemented (MYC-22 through MYC-33) but this is covered by the Done section of BACKLOG.md.

---

## 2. Test Coverage Audit

### Critical Paths Verified (existing coverage)

| Path | Test File | Status |
|---|---|---|
| Shroom list / detail | test_api.py | ✅ covered |
| Chat message flow | test_api.py | ✅ covered |
| Model not found / fallback | test_api.py | ✅ covered |
| Approvals: list, approve, reject | test_approvals.py | ✅ covered |
| Approvals: duplicate / conflict | test_approvals.py | ✅ covered |
| Approvals: NATS event emission | test_approvals.py | ✅ covered |
| Constitution fetch | test_constitution.py | ✅ covered |
| Constitution not loaded (503) | test_constitution.py | ✅ covered |
| Beads (memory) CRUD + retention | test_beads.py | ✅ covered |
| Session binding | test_session_binding.py | ✅ covered |
| WebSocket accept/reject | test_ws_events.py | ✅ covered |
| Auth: valid key | test_session_binding.py | ✅ covered |
| Org graph paths | test_org_graph.py | ✅ covered |
| Event schema validation | test_events.py | ✅ covered |

### Missing Tests Added

1. **Auth failure on authenticated endpoint** (`test_api.py`)
   - `test_missing_api_key_on_authenticated_endpoint_returns_401`
   - `test_wrong_api_key_on_authenticated_endpoint_returns_401`
   - Gap: No test for missing/invalid key on `POST /shrooms/{id}/message`.

2. **WebSocket max connections** (`test_ws_events.py`)
   - `test_ws_max_connections_rejects_when_full`
   - Gap: `ConnectionManager` max-connection rejection logic had no test.

3. **NATS publish failure** (`test_approvals.py`)
   - `test_approve_nats_failure_returns_500`
   - Gap: No test documenting behavior when NATS is unavailable during approval.

### Test Results

```
Backend:  133 passed in 26s
Frontend: 66 passed in 6.6s
Total:    199 passed, 0 failed
```

---

## 3. Codebase Consistency

### Issues Found & Fixed

**`ShroomController.agents` dict — terminology violation**
- `self.agents: dict[str, Agent]` stored Agno Agent runners using forbidden "agent" term.
- Fix: Renamed to `self._runners: dict[str, Agent]` with a clarifying comment marking it as internal Agno runtime storage. Updated all references in tests and callers.

**`ShroomController.get_agent()` accessor — retained (acceptable)**
- `get_agent()` returns an Agno `Agent` object (external SDK type). Renaming it to `get_shroom()` would conflict with the existing manifest-info method of the same name. The method is internal implementation only and the Agno `Agent` type can't be renamed — keeping `get_agent` is acceptable per CLAUDE.md ("External SDK classes are wrapped").

**User-facing error strings using "Agent"**
- `routers/shrooms.py`: `"Agent processing failed"` and `"Agent processing failed for {shroom_id}"` in event topic/payload.
- Fix: Renamed to `"Shroom processing failed"` and topic `shroom_error`. Updated corresponding test assertions.

### No Issues Found

- No TODO, FIXME, or placeholder comments in Python or TypeScript source files.
- No unused exports detected.
- No stray dead code or obvious duplication.
- `session_type="agent"` and `agent_id`/`agent_data` attribute accesses in `sessions.py` are Agno SDK constants/field names — cannot and should not be changed.
- A2A endpoint `/.well-known/agent-card.json` and `AgentCard`/`AgentSkill` types in `shrooms.py` are A2A standard terminology — acceptable per external API compliance.

---

## 4. Safe Fixes Summary

| File | Change | Risk |
|---|---|---|
| `README.md` | NATS: "JetStream" → "Core NATS; JetStream deferred" | Zero — doc only |
| `docs/project-state/BACKLOG.md` | Updated last-updated date + MYC-37 status | Zero — doc only |
| `core/controller.py` | `self.agents` → `self._runners` | Low — internal rename, all callers updated |
| `routers/shrooms.py` | Error strings "Agent processing failed" → "Shroom processing failed" | Low — error message + NATS event topic |
| `tests/test_api.py` | Updated agent dict refs + error string assertions + 2 new auth tests | Low — test-only |
| `tests/test_session_binding.py` | Updated `c.agents[...]` → `c._runners[...]` | Low — test-only |
| `tests/test_controller.py` | Renamed test + updated accessor reference | Low — test-only |
| `tests/test_ws_events.py` | Added max-connections test | Low — test addition |
| `tests/test_approvals.py` | Added NATS failure test | Low — test addition |

---

## 5. Out of Scope (Not Changed)

- No architectural changes.
- No API changes.
- No new features.
- Security deep-dive deferred (SECURITY_BACKLOG.md tracks outstanding items).
