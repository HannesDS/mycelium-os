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

## Architecture

### Two planes — always keep them separate

```
CONTROL PLANE                        DATA PLANE
─────────────────────────────        ──────────────────────────────
Constitution (mycelium.yaml)         Shroom sandboxes (K8s namespaces)
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
Shroom activity → NATS event bus → WebSocket server → Frontend (Next.js + canvas)
```

Every shroom emits structured events. The visual office consumes the event stream.
Mock shrooms emit the same events as real ones — the frontend never knows the difference.

### Repo structure

```
mycelium-os/
├── apps/
│   ├── frontend/          # Next.js — the visual office (canvas-based)
│   └── control-plane/     # Constitution engine, graph API, escalation
├── shrooms/               # Shroom sandbox definitions + mock shrooms
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
| Graph | Neo4j | Shroom topology |
| Event bus | NATS | Lightweight, K8s-native |
| Database | Postgres | Constitution, audit, inbox |
| Object storage | MinIO | S3-compatible |
| Mail | Mailhog (dev) / Postfix (prod) | |
| Models | Mistral / Ollama | EU-native, open source |
| Orchestration | Kubernetes | Namespace per shroom sandbox |
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

shrooms:
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

## Shroom event schema — never deviate from this

```json
{
  "shroom_id": "sales-001",
  "event": "message_sent",        // message_sent | task_started | task_completed | escalation_raised | decision_received | idle | error
  "to": "ceo-shroom",             // optional
  "topic": "lead_qualified",
  "timestamp": "ISO-8601",
  "payload_summary": "Human-readable one-liner",
  "metadata": {}                  // optional, arbitrary
}
```

---

## Security rules — never violate these

- No shroom executes financial or external actions directly. They **propose**. A human or authorised executor acts.
- Inter-shroom messages must be signed (shroom ID + timestamp + hash).
- Each shroom sandbox has NO access to other sandboxes or the control plane DB directly.
- All shroom actions are written to the append-only audit log before execution.
- Prompt injection defence: external data is always tagged as untrusted in shroom context.

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

Five mock shrooms simulating a digital agency:
- `sales-shroom` — finds lead, drafts proposal, escalates for approval
- `delivery-shroom` — tracks project, flags delay, escalates
- `billing-shroom` — detects overdue invoice, proposes chase email
- `compliance-shroom` — flags contract renewal
- `ceo-shroom` — receives escalations, routes decisions, escalates to human

The human owner receives one real proposal to approve. That interaction is the MVP demo.

Mock shrooms emit real events to the real NATS bus. The visual office does not know they are mocks.

---

## How to work in this repo

### Start the stack

```bash
docker compose up -d        # Postgres, Neo4j, NATS, MinIO, Mailhog
pnpm install                # install all workspace deps (if not done)
pnpm dev                    # start frontend dev server on :3000
```

### Run checks

```bash
pnpm test                             # run Vitest tests
pnpm --filter frontend exec tsc --noEmit  # type check
pnpm --filter frontend lint           # lint
```

### Docker Compose services

| Service | Image | Ports | Notes |
|---|---|---|---|
| postgres | postgres:16-alpine | 5432 | user/pass/db: `mycelium` |
| neo4j | neo4j:5 | 7474, 7687 | No auth |
| nats | nats:latest | 4222 | JetStream enabled |
| minio | minio/minio | 9000, 9001 | user/pass: `minioadmin` |
| mailhog | mailhog/mailhog | 1025, 8025 | SMTP + web UI |

All services have health checks. Copy `docker-compose.override.yml.example` to `docker-compose.override.yml` to customise locally.

### Testing

- **Framework**: Vitest + React Testing Library + jsdom
- **Config**: `apps/frontend/vitest.config.ts`
- **Convention**: tests live in `__tests__/` directories next to the code they test
- **Run**: `pnpm test` (once) or `pnpm --filter frontend test:watch` (watch mode)

### CI

GitHub Actions runs on every PR and push to `main`:
1. `pnpm --filter frontend lint`
2. `pnpm --filter frontend exec tsc --noEmit`
3. `pnpm --filter frontend test`

### PR checklist

Before opening a PR, verify locally:
```bash
pnpm --filter frontend lint && pnpm --filter frontend exec tsc --noEmit && pnpm test
```

### When to stop and ask (set Linear issue to Blocked)

- `docker compose up` fails with missing env vars
- A type error cannot be resolved in 2 attempts
- Schema changes required — never guess, flag as open question
