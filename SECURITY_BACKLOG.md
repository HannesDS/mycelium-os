# Security Backlog

Open security concerns flagged during development. Each entry should be resolved, mitigated, or accepted before production.

---

## SB-001 — Multi-principal memory isolation (beads)

**Severity:** High (if multi-tenant), Low (single-user MVP)
**Flagged in:** MYC-23 (PR #15, Cursor security review)
**Status:** Open — accepted risk for MVP, must resolve before multi-user exposure

Bead storage and retrieval is scoped only by `shroom_id`. There is no `tenant_id`, `user_id`, or `conversation_id` boundary. If the API is reachable by more than one principal, one caller can influence and potentially read another caller's interaction summaries for the same shroom.

**Current mitigation:** MVP is single-user with mock shrooms behind localhost.

**Required before multi-user:**
- Add `tenant_id` + `actor_id` / `conversation_id` columns to `shroom_beads`
- Enforce authn/authz at the API layer and bind memory access to caller identity
- Consider encrypting or minimising persisted summaries to reduce data exposure
- Alembic migration to add columns + backfill

---

## SB-002 — Residual prompt-injection surface in bead replay

**Severity:** Medium
**Flagged in:** MYC-23 (PR #15, Cursor security review)
**Status:** Partially mitigated

User-controlled text is persisted as bead summaries and replayed into subsequent prompts. A crafted message could attempt to override model behaviour when replayed.

**Current mitigations (MYC-23):**
- Bead context is injected as user-message content, not system instructions
- Summaries are sanitised (control chars stripped, capped at 200 chars)
- Context block is wrapped in `[UNTRUSTED CONTEXT]` / `[END UNTRUSTED CONTEXT]` delimiters

**Remaining risk:**
- Delimiter-based trust tagging is not a hard security boundary — LLMs can be convinced to ignore delimiters
- No structural role separation (e.g. separate `tool` or `context` message role) — depends on Agno SDK capabilities

**Recommended follow-ups:**
- Investigate whether Agno supports separate message roles for injected context
- Evaluate output-side filtering for bead summaries derived from model responses
- Stress-test with adversarial prompt payloads once the LLM runtime is connected
