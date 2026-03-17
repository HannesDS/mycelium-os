# Spike: Visual Office Technical Foundations

**Date:** 2026-03-05  
**Issue:** MYC-5  
**Timebox:** Half day

---

## 1. Checklist findings

| Foundation | Status | Notes |
| -- | -- | -- |
| `apps/frontend` — Next.js app boots locally | **missing** | No `apps/` directory exists. Repo contains only `CLAUDE.md` and `.github/` issue templates. |
| Canvas library installed (Konva or D3) | **missing** | No frontend exists; no `package.json` anywhere in repo. |
| NATS running in dev (via Helm chart or docker-compose) | **missing** | No `chart/` directory, no `docker-compose*.yml`, no Helm values. |
| WebSocket bridge: NATS → frontend exists | **missing** | No control-plane or bridge service. |
| At least one mock agent emitting events to NATS | **missing** | No `agents/` directory. |
| Agent event schema implemented (matches `CLAUDE.md` spec) | **missing** | Schema is specified in `CLAUDE.md` but no code implements it. |
| `mycelium.yaml` constitution file exists with at least 1 agent | **missing** | File does not exist. |

---

## 2. Recommendation

**Red** — significant scaffolding needed.

A chore ticket must land before any visual office feature work (Ticket A, B, or C). The repo is an architecture spec only; no runtime, no frontend, no event pipeline.

### Proposed chore ticket outline

**Title:** Scaffold visual office foundations

**Scope:**

1. **`apps/frontend`** — Next.js 14+ app with TypeScript strict mode, boots via `pnpm dev` (or npm). Minimal landing page; no canvas yet.
2. **Canvas library** — Install Konva + react-konva (see §4).
3. **`chart/`** — Helm chart bundling NATS (plus Postgres, Neo4j, MinIO per `CLAUDE.md`). Include `values-dev.yaml` for local dev.
4. **`docker-compose.yml`** — Dev-only stack: NATS, optional Postgres/Neo4j stubs. Must allow `pnpm dev` + NATS to run without full K8s.
5. **WebSocket bridge** — Small Node.js service (or control-plane submodule) that subscribes to NATS subject(s), pushes to connected WebSocket clients. Expose on configurable port (e.g. 3001).
6. **`agents/`** — At least one mock agent (e.g. `sales-agent`) that publishes events to NATS on a fixed subject. Event payload must match `CLAUDE.md` schema.
7. **`mycelium.yaml`** — Constitution file with the 5 MVP agents from `CLAUDE.md` (sales, delivery, billing, compliance, root).

**Acceptance criteria:**

- [ ] `pnpm dev` in `apps/frontend` serves a page at localhost:3000
- [ ] `docker-compose up` starts NATS; mock agent can publish; bridge receives and forwards to WebSocket
- [ ] Frontend can connect to WebSocket and log incoming events (no UI required)
- [ ] `mycelium.yaml` validates against constitution format

---

## 3. Proposed agent roster (for when foundations exist)

For a fully-digital SaaS agency (8 agents), suitable for Ticket A canvas work:

| id | role | escalates_to | Day-to-day |
| -- | -- | -- | -- |
| `sales-agent` | Sales Development | ceo-agent | Qualifies leads, drafts proposals, books demos |
| `delivery-agent` | Delivery Lead | ceo-agent | Tracks sprints, flags blockers, reports status |
| `billing-agent` | Billing & Finance | ceo-agent | Monitors invoices, proposes chase emails, reconciles |
| `compliance-agent` | Compliance & Legal | ceo-agent | Flags contract renewals, reviews terms |
| `support-agent` | Customer Success | delivery-agent | Triages tickets, escalates bugs, tracks NPS |
| `engineering-agent` | Platform Engineer | delivery-agent | Monitors infra, proposes deploys, handles incidents |
| `product-agent` | Product Manager | ceo-agent | Prioritises backlog, writes specs, coordinates releases |
| `ceo-agent` | CEO / Decider | human | Receives escalations, routes decisions, approves proposals |

---

## 4. Canvas library recommendation

**Recommendation: Konva (with react-konva)**

Konva is better suited than D3 for the visual office use case. The north star is agents as moving, interactive sprites with speech/thought bubbles — a scene-graph of objects, not a data-driven chart. Konva provides a hierarchical scene graph with built-in transforms, hit detection, and event handling; it is designed for CAD-like and game-like UIs. D3 excels at binding data to DOM/SVG for visualisations (charts, graphs, maps) and requires more glue for real-time sprite animation. For WebSocket-driven agent movement and bubble updates, Konva’s imperative API and React bindings (`react-konva`) will reduce boilerplate and keep the codebase simpler. If the visual office later needs graph topology overlays (e.g. org chart), D3 can be added for that layer; the base canvas should be Konva.

---

## 5. Remaining risks or unknowns

- **NATS subject design** — No convention yet for subject names (e.g. `agents.>` vs `mycelium.events`). The chore ticket should define this so mock agents and bridge align.
- **WebSocket auth** — Bridge has no auth model. For dev this is fine; production will need a decision (e.g. JWT, session cookie).
- **Control plane vs bridge** — `CLAUDE.md` mentions control-plane but not the WebSocket bridge explicitly. Decide whether the bridge lives inside control-plane or as a separate service.
- **Storybook** — Coding conventions require a Storybook story per component. Chore ticket should add Storybook to the frontend scaffold so Ticket A doesn’t block on it.
