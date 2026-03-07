# Mycelium OS — Project State & Backlog

> Last updated: 2026-03-07 (evening)

---

## Ticket Status Overview

### Done
| Ticket | Title |
|---|---|
| MYC-5 | Initial repo scaffold |
| MYC-6 | Visual office canvas (Konva) |
| MYC-7 | Click-to-inspect side panel |
| MYC-8 | Escalation trigger + human inbox flow |
| MYC-15 | Linear MCP in Cursor |
| MYC-16 | Dev environment setup (docker-compose, CI, CLAUDE.md) |
| MYC-17 | Spike: NATS schema + API boundary |
| MYC-20 | Rename agent→shroom across codebase |
| MYC-21 | Shroom manifest schema v1 (Pydantic + JSON Schema) |
| MYC-22 | Control plane scaffold + Agno runtime |
| MYC-23 | Beads episodic memory |

### Cancelled
MYC-9, MYC-10, MYC-11, MYC-12, MYC-14 — superseded

### Noise (Linear onboarding, ignore)
MYC-1, MYC-2, MYC-3, MYC-4

---

## V1 Sprint — Implementation Order

These tickets are sequenced. Implement one at a time, top to bottom.

| Order | Ticket | Title | Size | Blocked by |
|---|---|---|---|---|
| 1 | MYC-33 | Dashboard shell — sidebar nav + route structure | S | None |
| 2 | MYC-25 | Shrooms list page + API client layer | S | MYC-33 |
| 3 | MYC-18 | Chat with shroom | L | MYC-33, MYC-25 |
| 4 | MYC-26 | Approvals inbox | M | MYC-33, MYC-25 |
| 5 | MYC-24 | NATS event bus + WebSocket bridge | M | MYC-33 |
| 6 | MYC-30 | Constitution viewer | S | MYC-33, MYC-25 |

### V1 dependency graph

```
MYC-33 (dashboard shell)        ← START HERE
  ├── MYC-25 (shrooms list + API client)
  │     ├── MYC-18 (chat)
  │     ├── MYC-26 (approvals) 🔴
  │     └── MYC-30 (constitution)
  └── MYC-24 (NATS + WebSocket bridge)
```

### V1 demo story

After all 6 tickets:
1. `docker compose up`, open localhost:3000
2. Dashboard with sidebar nav, visual office canvas on home page
3. Navigate to Shrooms — see 5 shrooms with status and manifests
4. Navigate to Chat — talk to ceo-shroom, get real LLM response
5. Navigate to Approvals — see pending proposals, approve/reject
6. Canvas shows real events via NATS/WebSocket
7. Constitution page shows the governance rules

---

## Post-V1 Backlog

### Unblocked (can start after V1)
| Ticket | Title | Size | Notes |
|---|---|---|---|
| MYC-19 | Org graph view | L | Needs MYC-24 (NATS events) |
| MYC-27 | Traces viewer | M | Needs MYC-24 (event data) |
| MYC-28 | Sessions view | M | Needs control plane (done) |
| MYC-29 | Knowledge base (shared RAG) | L | Needs TBD-3 (vector store) resolved |

### Phase 2
| Ticket | Title | Size |
|---|---|---|
| MYC-31 | Evaluation dashboard | L |
| MYC-32 | Scheduler (cron triggers) | M |
| MYC-13 | Public website | M |

---

## Resolved Open Questions

| ID | Question | Decision | Resolved in |
|---|---|---|---|
| TBD-1 | NATS subject schema | `shroom.{id}.events` + `mycelium.events` (Core NATS, no JetStream for MVP) | MYC-17 spike |
| TBD-5 | Shroom API port assignment | Single control plane router (all shrooms behind FastAPI) | MYC-22 implementation |

## Still Open Questions

| ID | Question | Blocks |
|---|---|---|
| TBD-2 | Beads retention policy (default 50, confirm) | Cosmetic — beads work with default |
| TBD-3 | Vector store for RAG (pgvector vs Qdrant) | MYC-29 |
| TBD-4 | Phoenix observability integration | MYC-27 design |

---

## Dashboard Navigation (locked design)

```
MYCELIUM OS
──────────────────────────
🏢  Office          ← Canvas. Living city map.
🌿  Organisation    ← Org graph. Shroom topology. (MYC-19)
🍄  Shrooms         ← List, status, manifest viewer (MYC-25)
💬  Chat            ← Talk to any shroom (MYC-18)
✅  Approvals       ← Human-in-the-loop inbox (MYC-26) 🔴
🧠  Memory          ← Beads timeline + Personal RAG (MYC-23)
📚  Knowledge       ← Shared Mycelium RAG (MYC-29)
📋  Traces          ← Append-only audit log (MYC-27)
▶   Sessions        ← Active + historical sessions (MYC-28)
📊  Evaluation      ← Shroom performance (MYC-31) [Phase 2]
🕐  Scheduler       ← Cron triggers per shroom (MYC-32) [Phase 2]
⚖️  Constitution    ← mycelium.yaml + manifests (MYC-30)
⚙️  Settings        ← Models, MCP connectors, environment
──────────────────────────
```

---

## MVP Five Shrooms

| Shroom ID | Role | Key behaviour |
|---|---|---|
| `sales-shroom` | Sales Development | Finds lead, drafts proposal, escalates for approval |
| `delivery-shroom` | Delivery | Tracks project, flags delay, escalates |
| `billing-shroom` | Billing | Detects overdue invoice, proposes chase email |
| `compliance-shroom` | Compliance | Flags contract renewal |
| `ceo-shroom` | CEO | Receives escalations, routes decisions, escalates to human |
