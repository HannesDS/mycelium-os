# Open Questions — Human Decisions Required

> These are unresolved decisions that the Orchestrator must NOT assume.
> Each one blocks one or more tickets. Resolve before assigning those tickets.

---

## Resolved

### TBD-1: NATS Subject Schema — RESOLVED

**Decision:** `shroom.{id}.events` for per-shroom events, `mycelium.events` for fan-out. Core NATS for MVP, JetStream deferred.
**Resolved in:** MYC-17 spike session + MYC-24 ticket refinement

### TBD-5: Shroom API Port Assignment — RESOLVED

**Decision:** Single control plane router. All shrooms are behind FastAPI at `localhost:8000`. No per-shroom ports.
**Resolved in:** MYC-22 implementation

---

## Still Open

### TBD-2: Beads Retention Policy

**Question:** What is the default maximum number of beads retained per shroom?

**Current implementation:** 50 beads per shroom (env override via `BEADS_MAX_PER_SHROOM`)
**Status:** Working with default. Confirm before production.

**Blocks:** Nothing critical — beads work with the default.

---

### TBD-3: Vector Store for RAG

**Question:** Which vector store for Personal RAG (MYC-23) and Shared RAG (MYC-29)?

**Options:** pgvector (no new service) / Chroma (Python-native) / Qdrant (best perf, EU-hosted)
**Recommendation:** pgvector for MVP, Qdrant post-MVP. Confirm.

**Blocks:** MYC-29 (Knowledge base)
**Resolve before:** MYC-29 is picked up

---

### TBD-4: Phoenix / Observability Integration

**Question:** How do we integrate Phoenix (Arize) for LLM observability?

**Options:** Sidecar per shroom / Central Phoenix service
**Blocks:** MYC-27 design (but doesn't block implementation with our own event log)
**Phase:** Post-MVP unless Traces page requires it

---

### TBD-6: Config Repo Migration Path

**Question:** When and how do we switch from same-repo config (MVP) to separate config repos per company?

**Current state:** MVP stores constitution and shroom manifests in the same repo (e.g. `config/<instance>/` or `companies/<company_id>/`). MYC-36 (CEO-guided constitution evolution) will dual-write to DB + this path.

**Options:**
- Stay in same repo indefinitely (simplest)
- Migrate when multi-tenant: one config repo per tenant, control plane clones/pushes to it
- Migrate when self-hosted: user provides config repo URL, control plane writes there

**Blocks:** Design decision for MYC-36 implementation; does not block MVP.
**Resolve before:** Scaling to multi-tenant or self-hosted deployments.

---

## Resolved Product Questions

### MYC-18 (Chat with shroom) — RESOLVED
- Chat panel **coexists** with Approvals inbox. Different UX paradigms: chat = conversation, approvals = governance decisions.
- Timeout: 30 seconds with visible error message.

### MYC-26 (Approvals inbox) — RESOLVED
- No authentication for MVP. Control plane is internal-only (localhost / compose network).
- Auth is post-MVP scope.

### MYC-28 (Sessions) — Still open
- Agno session storage: Postgres (already in compose) recommended. Confirm before implementing.
