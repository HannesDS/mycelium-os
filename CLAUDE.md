# Mycelium OS — Developer Context

> A constitutional framework for AI-native organisations. Shrooms are the employees.
> The platform governs how they communicate, escalate, evolve — and makes it visible.

---

## What this project is

Mycelium OS is an open source platform that lets you define a company of AI shrooms via code,
config, or chat — and then runs, visualises, and governs it as a living ecosystem.

It is NOT a runtime (that's pluggable underneath). It IS:
- A constitutional layer (who can do what, who reports to whom)
- A living graph (the org visualised in real-time, like a city map)
- An escalation protocol (shrooms propose, humans decide)
- A governance engine (audit log, version control, sandboxed execution)

**The north star UI**: a real-time visual "office" where shrooms move, communicate, and escalate
— like a living city map of your company.

---

## Terminology

- **Shroom** = an AI agent in Mycelium OS (singular and plural: Shroom / Shrooms)
- Never use "agent", "bot", or "worker" in product code or UI
- In code: `shroom`, `shroom_id`, `ShroomManifest`, `ShroomEvent`
- External SDK classes (e.g. Agno's `Agent`) are wrapped in a `Shroom` class

---

## Architecture

### Two planes — always keep them separate

```
CONTROL PLANE                        DATA PLANE
─────────────────────────────        ──────────────────────────────
Constitution (mycelium.yaml)         Shroom sandboxes (logical, MVP)
Graph DB (Neo4j)                     Tool execution
Escalation engine                    MCP connectors
Human decision inbox                 Object storage (MinIO)
Audit log (append-only)              Mail / calendar integrations
Instance manager (dev/stg/prd)       Token metering
```

Control plane = immutable, signed, version-controlled. Never put side effects here.
Data plane = ephemeral, isolated, observable. Never put governance logic here.

### Event flow

```
Shroom activity → NATS event bus → WebSocket bridge → Frontend (Next.js + canvas)
```

Every shroom emits structured ShroomEvents. The visual office consumes the event stream.
Mock shrooms emit the same events as real ones — the frontend never knows the difference.

### Repo structure

```
mycelium-os/
├── apps/
│   ├── frontend/          # Next.js — the visual office (canvas-based)
│   └── control-plane/     # Python FastAPI — constitution engine, graph API, escalation
├── shrooms/               # Shroom sandbox definitions + mock shrooms (Python)
├── chart/                 # Helm chart — bundled stack (Postgres, Neo4j, NATS, MinIO)
├── openspec/              # OpenSpec — spec-driven development
│   ├── specs/             # Source of truth (system behaviour)
│   ├── changes/           # Active changes (proposal, specs, design, tasks)
│   └── config.yaml        # Project context for artifacts
├── docs/
│   ├── adrs/              # Architecture Decision Records (ADR-001 through ADR-008+)
│   ├── dev-flow/          # Development workflow docs
│   ├── design/            # Specs, schemas, UI design docs
│   └── project-state/     # Backlog, open questions
├── .github/
│   ├── ISSUE_TEMPLATE/    # feature.md, bug.md, chore.md, spike.md, design.md
│   └── workflows/
└── mycelium.yaml          # The constitution — source of truth
```

---

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js + canvas (Konva or D3) | Real-time via WebSocket |
| Control plane | Python FastAPI | Agno runtime, constitution engine |
| Runtime | Agno (Python) | Wraps LLM calls, tools, session memory |
| Graph | Neo4j | Shroom topology |
| Event bus | NATS | Lightweight, K8s-native |
| Database | Postgres | Constitution, audit, inbox, beads memory |
| Object storage | MinIO | S3-compatible |
| Mail | Mailhog (dev) / Postfix (prod) | |
| Models | Mistral / Ollama | EU-native, open source |
| Orchestration | docker compose (MVP) / Kubernetes (prod) | K8s namespace per shroom deferred |
| IaC | Helm + Pulumi | |
| Docs | Zenicastle | Auto-sync on merge to main |
| Cloud target | Scaleway or OVH | EU, eco-friendly |

---

## The constitution format

```yaml
# mycelium.yaml — never break this contract
company:
  name: "Acme AI Co"
  instance: production  # dev | staging | production

shrooms:                          # ← always "shrooms:", never "agents:"
  - id: sales-shroom
    role: "Sales Development"
    model: mistral-7b
    can:
      - read: [crm, emails]
      - write: [draft_emails, crm_notes]
      - propose: [send_email, book_meeting]
    cannot:
      - execute: [send_email, payments]
    escalates_to: ceo-shroom
    sla_response_minutes: 60

graph:
  edges:
    - from: sales-shroom
      to: ceo-shroom
      type: reports-to       # reports-to | requests-from | monitors | triggers | collaborates-with
```

---

## ShroomEvent schema — never deviate from this

```json
{
  "shroom_id": "sales-shroom",
  "event": "message_sent",        // message_sent | task_started | task_completed | escalation_raised | decision_received | idle | error
  "to": "ceo-shroom",             // optional
  "topic": "lead_qualified",
  "timestamp": "ISO-8601",
  "payload_summary": "Human-readable one-liner",
  "metadata": {}                  // optional, arbitrary
}
```

Full schema reference: `docs/design/SHROOM-EVENT-SCHEMA.md`

---

## Security rules — never violate these

- No shroom executes financial or external actions directly. They **propose**. A human or authorised executor acts.
- Inter-shroom messages must be signed (shroom ID + timestamp + hash).
- Each shroom sandbox has NO access to other sandboxes or the control plane DB directly.
- All shroom actions are written to the append-only audit log **before** execution.
- Audit log write MUST happen before the ShroomEvent is emitted to NATS. No exceptions.
- Prompt injection defence: external data is always tagged as untrusted in shroom context.

---

## Architecture decisions locked (ADRs)

See `docs/adrs/` for full records. Summary:

| ADR | Decision |
|---|---|
| ADR-001 | Canonical term is "Shroom" |
| ADR-002 | NATS as event bus |
| ADR-003 | `mycelium.yaml` manifest format |
| ADR-004 | Three-layer memory: working / beads / RAG |
| ADR-005 | Agno as shroom execution runtime |
| ADR-006 | Python / FastAPI for control plane |
| ADR-007 | Mistral / Ollama (EU-native, open source) |
| ADR-008 | Logical isolation for MVP (K8s namespaces deferred) |

---

## Coding conventions

- TypeScript everywhere on the frontend. Strict mode on.
- Python on the control plane and agents. Type hints required. Pydantic for all data shapes.
- Every new component gets a Storybook story.
- Every new API endpoint gets an OpenAPI annotation.
- ShroomEvent schema changes require a migration + changelog entry.
- No direct DB access from the frontend. Always via the control plane API.
- Feature flags for anything not ready for prod.
- Never use `agent` in new code — always `shroom`.

---

## PR requirements

Every PR must include:
1. A working demo (video, screenshot, or live preview — Cursor native demo preferred)
2. Updated docs if any API or schema changed
3. Tests for acceptance criteria
4. No TODOs left in code (use feature flags instead)

---

## Ticket types & what the Orchestrator should do with each

| Type | Orchestrator behaviour |
|---|---|
| `feature` | Implement to acceptance criteria, open PR with demo |
| `bug` | Reproduce first (add failing test), then fix, PR with before/after |
| `chore` | Config/infra change, no demo needed, but must not break existing tests |
| `spike` | Produce a markdown doc in `docs/spikes/`, no production code |
| `design` | Produce a spec or mockup in `docs/design/`, may include prototype code |

---

## Current MVP scope

Five mock shrooms simulating a digital agency:
- `sales-shroom` — finds lead, drafts proposal, escalates for approval
- `delivery-shroom` — tracks project, flags delay, escalates
- `billing-shroom` — detects overdue invoice, proposes chase email
- `compliance-shroom` — flags contract renewal
- `ceo-shroom` — receives escalations, routes decisions, escalates to human

The human owner receives one real proposal to approve. That interaction is the MVP demo.

Mock shrooms emit real events to the real NATS bus. The visual office does not know they are mocks.

---

## Current codebase state (as of 2026-03-07)

After `docker compose up`:
- ✅ Full infra stack running (NATS, Postgres, Neo4j, MinIO)
- ✅ Next.js frontend running at http://localhost:3000
- ❌ No visual office — blank canvas only
- ❌ No control plane / FastAPI service
- ❌ No shrooms / Agno runtime
- ❌ No NATS event emission
- ❌ No WebSocket bridge

Next tickets to unblock product: MYC-20 (rename), MYC-17 (spike), MYC-21 → MYC-22.

---

## Context for the Orchestrator

The **Orchestrator** = Cursor (this IDE). It reads this file every session for project context.

**Before implementing any change:**
1. Read this file (CLAUDE.md)
2. Read the OpenSpec change (`openspec/changes/<name>/`) — proposal, specs, design, tasks
3. If from Linear: read ticket (MYC-XX) for context; create OpenSpec change if none exists
4. If schema/API work: read `docs/design/SHROOM-EVENT-SCHEMA.md` and relevant ADRs
5. If blocked by open questions: read `docs/project-state/OPEN-QUESTIONS.md` — do NOT assume

**Spec-driven workflow:** Use OpenSpec. `/opsx-propose` → `/opsx-apply` → `/opsx-archive`. See `docs/dev-flow/WORKFLOW.md`.

**@ mention these for context:**
- `@CLAUDE.md` — always
- `@openspec/changes/<name>/` — the change being implemented
- `@docs/project-state/BACKLOG.md` — for dependency order
- `@docs/project-state/OPEN-QUESTIONS.md` — before MYC-22+
- `@docs/design/SHROOM-EVENT-SCHEMA.md` — for event work
- `@docs/adrs/` — for architecture constraints

**Do not assume** answers to TBD-1 through TBD-5. Flag in PR comments if ticket is ambiguous.

---

## Development workflow

See `docs/dev-flow/WORKFLOW.md` for the full human + Orchestrator dev loop. We use **OpenSpec** for spec-driven development: `/opsx-propose` → `/opsx-apply` → `/opsx-archive`.

## Open architecture questions

See `docs/project-state/OPEN-QUESTIONS.md` before implementing MYC-22 onwards.

## Full backlog

See `docs/project-state/BACKLOG.md`.
