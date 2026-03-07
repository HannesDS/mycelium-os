# Mycelium OS — Development Workflow

> How we build: the human + Orchestrator dev loop.

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
│  • Refines ideas into Linear tickets (chat)                      │
│  • Implements to AC (code)                                       │
│  • Opens PR with demo                                            │
└───────┬─────────────────────────────────────────────────────────┘
        │ creates / reads
        ▼
┌───────────────────┐
│      LINEAR       │
│   (MYC-XX)        │
└───────────────────┘
```

**Orchestrator does NOT make product decisions.** If the ticket is ambiguous on something product-level, it opens a PR comment with a question, not a guess.

**Orchestrator does NOT assume answers to open questions.** See `docs/project-state/OPEN-QUESTIONS.md` — flag TBD items explicitly.

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

### Step 3 — Ticket confirmed and created in Linear

Once the ticket is solid, create it in Linear (manually or via MCP).

### Step 4 — Orchestrator implements the ticket

Reference the Linear ticket: `Implement MYC-XX`

The Orchestrator reads the ticket, reads `CLAUDE.md`, and implements to the acceptance criteria.

### Step 5 — PR review

The Orchestrator opens a PR. The PR must include:
1. Working demo (video, screenshot, or Cursor native demo)
2. Updated docs if API/schema changed
3. Tests for acceptance criteria
4. No TODOs (use feature flags instead)

Human reviews and merges.

---

## Important: What Goes Where

| Decision type | Where it lives | Who decides |
|---|---|---|
| Product direction, scope | Orchestrator chat | Human |
| Architecture locked decisions | `docs/adrs/` | Human (ADR session) |
| Open architecture questions | `docs/project-state/OPEN-QUESTIONS.md` | Human (before Orchestrator implements) |
| Implementation details | Linear ticket, then PR | Orchestrator |
| "How should I build this?" (not in ticket) | Orchestrator asks human via PR comment | Human |

---

## Context management

`CLAUDE.md` is the single source of truth for the Orchestrator's project context. **If something is true about this project and it's not in CLAUDE.md, it doesn't exist.**

Keep `CLAUDE.md` updated as architecture evolves.

Before each implementation session, the Orchestrator should:
1. Read `CLAUDE.md`
2. Read the ticket (MYC-XX)
3. @ mention `docs/project-state/OPEN-QUESTIONS.md` if implementing MYC-22+

---

## Branch & PR conventions

```
feature/MYC-XX-short-description
bug/MYC-XX-short-description
chore/MYC-XX-short-description
spike/MYC-XX-short-description
```

PR title: `[MYC-XX] Short description`

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
4. The sales-shroom escalates a lead proposal to ceo-shroom
5. ceo-shroom escalates to the human owner
6. Human owner sees the proposal in the Approvals inbox (MYC-26)
7. Human approves → `decision_received` event emitted → audit log written

**The human never sees that the first four shrooms are mocks.**
