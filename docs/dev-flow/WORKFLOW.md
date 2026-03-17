# Mycelium OS — Development Workflow

> How we build: spec-driven with OpenSpec, human + Orchestrator dev loop.

---

## The Orchestrator

The **Orchestrator** = Cursor. One tool for story refinement and implementation.

```
┌─────────────────────────────────────────────────────────────────┐
│                        HUMAN OWNER                              │
└───────┬─────────────────────────────────────────────┬──────────┘
        │ rough idea / approve PR / answer open questions
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR (Cursor)                         │
│                                                                  │
│  • Refines ideas (chat)                                          │
│  • Creates OpenSpec changes (/opsx:propose)                      │
│  • Implements via OpenSpec (/opsx:apply)                         │
│  • Opens PR with demo                                            │
└───────┬─────────────────────────────────────────────────────────┘
        │ creates / reads
        ▼
┌───────────────────┐     ┌───────────────────┐
│   OPENSPEC        │     │      LINEAR       │
│   changes/        │     │   (MYC-XX)        │
│   proposal,       │     │   backlog only    │
│   specs, design,  │     └───────────────────┘
│   tasks           │
└───────────────────┘
```

**Orchestrator does NOT make product decisions.** If the ticket is ambiguous on something product-level, it opens a PR comment with a question, not a guess.

**Orchestrator does NOT assume answers to open questions.** See `docs/project-state/OPEN-QUESTIONS.md` — flag TBD items explicitly.

---

## OpenSpec — Spec-Driven Development

We use [OpenSpec](https://github.com/Fission-AI/OpenSpec) for spec-driven development. Every change gets:

- `proposal.md` — why, what, scope
- `specs/` — requirements (ADDED/MODIFIED/REMOVED)
- `design.md` — technical approach
- `tasks.md` — implementation checklist

**Core workflow:**

```
/opsx:propose "add-shrooms-list-page"   →  creates change + all artifacts
/opsx:apply                            →  implements tasks
/opsx:archive                          →  merges specs, moves to archive
```

**Other commands:** `/opsx:explore` (think through ideas), `/opsx:list` (active changes)

Requires: `npm install -g @fission-ai/openspec` then `openspec init` (already done). Refresh: `openspec update`.

---

## The Loop

### Step 1 — Bring an idea to the Orchestrator

In Cursor chat, describe the idea in plain language.

### Step 2 — Story refinement (2–5 turns)

The Orchestrator will challenge you on:
- **Why does this exist?** — value, who benefits, what breaks without it
- **Scope** — what's in, what's explicitly out
- **Acceptance criteria** — must be verifiable/testable
- **Size** — S/M/L; if L, suggests splitting
- **Open questions** — things it must NOT assume

### Step 3 — Create OpenSpec change

Run `/opsx:propose "kebab-case-change-name"` (or describe the idea; the Orchestrator derives the name).

This creates `openspec/changes/<name>/` with proposal, specs, design, tasks. **Agree before you build.**

Optionally create a Linear ticket (MYC-XX) for backlog tracking. Link it in `proposal.md`.

### Step 4 — Implement

Run `/opsx:apply` (or specify the change name). The Orchestrator works through `tasks.md`, checking off as it goes.

If implementation reveals design issues: update the artifact, then continue. OpenSpec is fluid — no phase gates.

### Step 5 — Archive and PR

When all tasks are done: `/opsx:archive`. Specs merge into `openspec/specs/`, change moves to `archive/`.

Open a PR. PR must include:
1. Working demo (video, screenshot, or Cursor native demo)
2. Updated docs if API/schema changed
3. Tests for acceptance criteria
4. No TODOs (use feature flags instead)

Human reviews and merges.

---

## Linear + OpenSpec

| Use case | Linear | OpenSpec |
|---|---|---|
| Backlog order, sprint planning | ✓ | — |
| Implementation spec | — | ✓ |
| Acceptance criteria | Optional (can mirror) | In specs + tasks |
| Tracking "what's next" | ✓ | `openspec list` |

**When picking up MYC-XX from backlog:** Create OpenSpec change from ticket content (or use existing `openspec/changes/<ticket-slug>/`), then `/opsx:apply`. The implement-ticket skill handles this.

---

## Important: What Goes Where

| Decision type | Where it lives | Who decides |
|---|---|---|
| Product direction, scope | Orchestrator chat | Human |
| Architecture locked decisions | `docs/adrs/` | Human (ADR session) |
| Open architecture questions | `docs/project-state/OPEN-QUESTIONS.md` | Human (before Orchestrator implements) |
| Implementation spec | `openspec/changes/<name>/` | Orchestrator |
| "How should I build this?" (not in spec) | Orchestrator asks human via PR comment | Human |

---

## Context management

`CLAUDE.md` is the single source of truth for the Orchestrator's project context. **If something is true about this project and it's not in CLAUDE.md, it doesn't exist.**

`openspec/config.yaml` injects Mycelium context into all OpenSpec artifacts.

Before each implementation session, the Orchestrator should:
1. Read `CLAUDE.md`
2. Read the OpenSpec change (proposal, specs, design, tasks)
3. @ mention `docs/project-state/OPEN-QUESTIONS.md` if blocked by TBDs

---

## Branch & PR conventions

```
feature/MYC-XX-short-description
bug/MYC-XX-short-description
chore/MYC-XX-short-description
spike/MYC-XX-short-description
```

PR title: `[MYC-XX] Short description` (or `[openspec] change-name` if no ticket)

---

## Local development

```bash
# Start the full stack
docker compose up

# Frontend only (faster iteration)
cd apps/frontend && npm run dev

# Control plane only
cd apps/control-plane && uvicorn main:app --reload
```

After `docker compose up`:
- Frontend: http://localhost:3000
- Control plane API: http://localhost:8000
- API docs (OpenAPI): http://localhost:8000/docs
- NATS: nats://localhost:4222

---

## Running the MVP demo

The MVP demo shows:
1. Five mock shrooms running (sales, delivery, billing, compliance, ceo)
2. Mock shrooms emit real events to NATS
3. The visual office shows shrooms active, communicating, escalating
4. The sales-shroom escalates a lead proposal to root-shroom
5. root-shroom escalates to the human owner
6. Human owner sees the proposal in the Approvals inbox (MYC-26)
7. Human approves → `decision_received` event emitted → audit log written

**The human never sees that the first four shrooms are mocks.**
