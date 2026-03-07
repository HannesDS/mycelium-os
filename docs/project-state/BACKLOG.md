# Mycelium OS — Project State & Backlog

> Last updated: 2026-03-07

---

## Ticket Status Overview

### Done ✅
| Ticket | Title |
|---|---|
| MYC-5 | Initial repo scaffold |
| MYC-6 | docker-compose stack |
| MYC-7 | Next.js frontend scaffold |
| MYC-8 | Basic Helm chart |
| MYC-15 | ADR session — architecture locked |
| MYC-16 | Infrastructure wiring (NATS, Neo4j, Postgres in compose) |

### Cancelled ❌
MYC-9, MYC-10, MYC-11, MYC-12 — superseded

### Noise (Linear onboarding auto-created, ignore)
MYC-1, MYC-2, MYC-3, MYC-4

---

## Active Backlog

### Can start now
| Ticket | Title | Size | Notes |
|---|---|---|---|
| MYC-20 | Rename agent→shroom in codebase | S | No deps, pure refactor |
| MYC-17 | Spike: NATS schema + API boundary | S | Human+Orchestrator session, not solo |

### Blocked on MYC-17 (spike)
| Ticket | Title | Size |
|---|---|---|
| MYC-21 | Shroom manifest schema v1 (Pydantic) | S |
| MYC-22 | Control plane scaffold + Agno runtime | M |

### Blocked on MYC-22 (control plane)
| Ticket | Title | Size | Security |
|---|---|---|---|
| MYC-18 | Chat with any shroom | L | |
| MYC-25 | Shrooms list page | S | |
| MYC-26 | Approvals inbox | M | 🔴 Security-sensitive |
| MYC-28 | Sessions view | M | |
| MYC-30 | Constitution viewer | S | |

### Blocked on MYC-24 (NATS + WebSocket)
| Ticket | Title | Size |
|---|---|---|
| MYC-24 | NATS event bus + WebSocket bridge | M |
| MYC-19 | Org graph view | L |
| MYC-27 | Traces viewer | M |

### Blocked on MYC-23 (beads memory)
| Ticket | Title | Size |
|---|---|---|
| MYC-23 | Beads episodic memory | M |
| MYC-29 | Knowledge base (shared RAG) | L |

### Phase 2 (post-MVP)
| Ticket | Title | Size | Blocked by |
|---|---|---|---|
| MYC-31 | Evaluation dashboard | L | MYC-22 + MYC-27 |
| MYC-32 | Scheduler (cron triggers) | M | MYC-22 |

---

## Dependency Graph

```
MYC-20 (rename)           ← START NOW
MYC-17 (spike)            ← START NOW (human+Orchestrator, not solo)
  └── MYC-21 (manifest schema)
        └── MYC-22 (control plane + Agno)    ← MAIN UNBLOCK
              ├── MYC-18 (chat)
              ├── MYC-25 (shrooms list)
              ├── MYC-26 (approvals) 🔴
              ├── MYC-28 (sessions)
              └── MYC-30 (constitution)
MYC-24 (NATS + WS bridge)
  ├── MYC-19 (org graph)
  └── MYC-27 (traces)
MYC-23 (beads memory)
  └── MYC-29 (knowledge)

Phase 2:
  MYC-31 (evaluation) ← after MYC-27 has real data
  MYC-32 (scheduler)  ← after MYC-22 stable
```

**Parallel note:** MYC-26, MYC-27, MYC-28 have no dependency on each other — can be separate branches simultaneously.

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

## MVP Five Mock Shrooms

| Shroom ID | Role | Key behaviour |
|---|---|---|
| `sales-shroom` | Sales Development | Finds lead, drafts proposal, escalates for approval |
| `delivery-shroom` | Delivery | Tracks project, flags delay, escalates |
| `billing-shroom` | Billing | Detects overdue invoice, proposes chase email |
| `compliance-shroom` | Compliance | Flags contract renewal |
| `ceo-shroom` | CEO | Receives escalations, routes decisions, escalates to human |

Mock shrooms emit real events to the real NATS bus. The visual office does not know they are mocks.
