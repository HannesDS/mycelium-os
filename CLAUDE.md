# Mycelium OS — Developer Context

> A constitutional framework for AI-native organisations. Agents are the employees.
> The platform governs how they communicate, escalate, evolve — and makes it visible.

---

## What this project is

Mycelium OS is an open source platform that lets you define a company of AI agents via code,
config, or chat — and then runs, visualises, and governs it as a living ecosystem.

It is NOT a runtime (that's pluggable underneath). It IS:
- A constitutional layer (who can do what, who reports to whom)
- A living graph (the org visualised in real-time, like a city map)
- An escalation protocol (agents propose, humans decide)
- A governance engine (audit log, version control, sandboxed execution)

**The north star UI**: a real-time visual "office" where agents move, communicate, and escalate
— like a living city map of your company.

---

## Architecture

### Two planes — always keep them separate

```
CONTROL PLANE                        DATA PLANE
─────────────────────────────        ──────────────────────────────
Constitution (mycelium.yaml)         Agent sandboxes (K8s namespaces)
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
Agent activity → NATS event bus → WebSocket server → Frontend (Next.js + canvas)
```

Every agent emits structured events. The visual office consumes the event stream.
Mock agents emit the same events as real ones — the frontend never knows the difference.

### Repo structure

```
mycelium-os/
├── apps/
│   ├── frontend/          # Next.js — the visual office (canvas-based)
│   └── control-plane/     # Constitution engine, graph API, escalation
├── agents/                # Agent sandbox definitions + mock agents
├── chart/                 # Helm chart — bundled stack (Postgres, Neo4j, NATS, MinIO)
├── docs/                  # Zenicastle source — auto-published on merge
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
| Control plane | Node.js or Python FastAPI | TBD per ticket |
| Graph | Neo4j | Agent topology |
| Event bus | NATS | Lightweight, K8s-native |
| Database | Postgres | Constitution, audit, inbox |
| Object storage | MinIO | S3-compatible |
| Mail | Mailhog (dev) / Postfix (prod) | |
| Models | Mistral / Ollama | EU-native, open source |
| Orchestration | Kubernetes | Namespace per agent sandbox |
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

agents:
  - id: sales-agent
    role: "Sales Development"
    model: mistral-7b
    can:
      - read: [crm, emails]
      - write: [draft_emails, crm_notes]
      - propose: [send_email, book_meeting]
    cannot:
      - execute: [send_email, payments]
    escalates_to: ceo-agent
    sla_response_minutes: 60

graph:
  edges:
    - from: sales-agent
      to: ceo-agent
      type: reports-to       # reports-to | requests-from | monitors | triggers | collaborates-with
```

---

## Agent event schema — never deviate from this

```json
{
  "agent_id": "sales-001",
  "event": "message_sent",        // message_sent | task_started | task_completed | escalation_raised | decision_received | idle | error
  "to": "ceo-agent",              // optional
  "topic": "lead_qualified",
  "timestamp": "ISO-8601",
  "payload_summary": "Human-readable one-liner",
  "metadata": {}                  // optional, arbitrary
}
```

---

## Security rules — never violate these

- No agent executes financial or external actions directly. They **propose**. A human or authorised executor acts.
- Inter-agent messages must be signed (agent ID + timestamp + hash).
- Each agent sandbox has NO access to other sandboxes or the control plane DB directly.
- All agent actions are written to the append-only audit log before execution.
- Prompt injection defence: external data is always tagged as untrusted in agent context.

---

## Coding conventions

- TypeScript everywhere on the frontend. Strict mode on.
- Every new component gets a Storybook story.
- Every new API endpoint gets an OpenAPI annotation.
- Event schema changes require a migration + changelog entry.
- No direct DB access from the frontend. Always via the control plane API.
- Feature flags for anything not ready for prod.

---

## PR requirements (from issue template)

Every PR must include:
1. A working demo (video, screenshot, or live preview — Cursor native demo preferred)
2. Updated docs if any API or schema changed
3. Tests for acceptance criteria
4. No TODOs left in code (use feature flags instead)

---

## Ticket types & what Cursor should do with each

| Type | Cursor behaviour |
|---|---|
| `feature` | Implement to acceptance criteria, open PR with demo |
| `bug` | Reproduce first (add failing test), then fix, PR with before/after |
| `chore` | Config/infra change, no demo needed, but must not break existing tests |
| `spike` | Produce a markdown doc in `/docs/spikes/`, no production code |
| `design` | Produce a spec or mockup in `/docs/design/`, may include prototype code |

---

## Current MVP scope

Five mock agents simulating a digital agency:
- `sales-agent` — finds lead, drafts proposal, escalates for approval
- `delivery-agent` — tracks project, flags delay, escalates
- `billing-agent` — detects overdue invoice, proposes chase email
- `compliance-agent` — flags contract renewal
- `ceo-agent` — receives escalations, routes decisions, escalates to human

The human owner receives one real proposal to approve. That interaction is the MVP demo.

Mock agents emit real events to the real NATS bus. The visual office does not know they are mocks.
