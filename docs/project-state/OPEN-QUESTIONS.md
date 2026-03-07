# Open Questions — Human Decisions Required

> These are unresolved decisions that the Orchestrator must NOT assume.
> Each one blocks one or more tickets. Resolve before assigning those tickets.

---

## TBD-1: NATS Subject Schema

**Question:** What is the exact NATS subject naming convention?

**Candidate pattern:** `mycelium.events.<shroom_id>.<event_type>`  
**Alternative:** `mycelium.<shroom_id>.events` (topic-per-shroom)

**Also decide:** JetStream (durable) vs core NATS for MVP?  
Recommendation: Core NATS for MVP, JetStream post-MVP — but confirm.

**Blocks:** MYC-24 (NATS + WebSocket bridge)  
**Resolve in:** MYC-17 spike session

---

## TBD-2: Beads Retention Policy

**Question:** What is the default maximum number of beads retained per shroom?

**Current assumption:** 50 beads per shroom  

**Blocks:** MYC-23 (beads memory)  
**Resolve before:** MYC-23 is picked up by the Orchestrator

---

## TBD-3: Vector Store for RAG

**Question:** Which vector store for Personal RAG (MYC-23) and Shared RAG (MYC-29)?

**Options:** pgvector (no new service) / Chroma (Python-native) / Qdrant (best perf, EU-hosted)  
**Recommendation:** pgvector for MVP, Qdrant post-MVP. Confirm.

**Blocks:** MYC-23, MYC-29  
**Resolve in:** MYC-17 spike session or before MYC-23

---

## TBD-4: Phoenix / Observability Integration

**Question:** How do we integrate Phoenix (Arize) for LLM observability?

**Options:** Sidecar per shroom / Central Phoenix service  
**Blocks:** MYC-27 design (but doesn't block implementation with our own event log)  
**Phase:** Post-MVP unless Traces page requires it

---

## TBD-5: Shroom API Port Assignment

**Question:** How do shrooms expose their local API?

**Options:** Static port config in manifest / Service discovery via NATS / Single control plane router  
**Recommendation:** Single router for MVP. Confirm before MYC-22.

**Blocks:** MYC-22 (control plane scaffold)  
**Resolve in:** MYC-17 spike session

---

## Open Product Questions (from specific tickets)

### MYC-18 (Chat with shroom)
- Does the chat panel **replace** the Approvals inbox or **coexist** with it?
- Timeout/retry policy for shroom responses: 30s suggested, confirm.

### MYC-26 (Approvals inbox) 🔴 Security
- Does the Approvals inbox require **authentication** for MVP?
- Current assumption: control plane is internal-only (localhost / compose network)
- **Do NOT assume unauthenticated access is acceptable**

### MYC-28 (Sessions)
- Agno session storage: **SQLite (dev) vs Postgres (prod)** — which does docker-compose MVP use?
- Recommendation: Postgres (already in compose), confirm before implementing

### MYC-31 (Evaluation)
- SLA clock: starts at `task_started` or `escalation_raised`?
