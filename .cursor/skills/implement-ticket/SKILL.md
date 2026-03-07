---
name: implement-ticket
description: Step-by-step workflow for implementing a Linear ticket (MYC-XX) in Mycelium OS. Use when the user says "Implement MYC-XX" or references a Linear ticket to work on.
---

# Implement Ticket

Workflow for picking up and implementing a Mycelium OS Linear ticket.

## When to Use

- User says "Implement MYC-XX" or "Pick up MYC-XX"
- User pastes a Linear ticket and asks you to implement it

## Pre-Implementation Checklist

1. Read `CLAUDE.md` for full project context
2. Read the Linear ticket (MYC-XX) — get the acceptance criteria
3. Read `docs/project-state/BACKLOG.md` — check this ticket's dependencies are done
4. Read `docs/project-state/OPEN-QUESTIONS.md` — check if any TBD items block this ticket
5. If blocked by an unresolved TBD: **stop and tell the user**. Do not guess.

## Implementation

1. Create a branch: `feature/MYC-XX-short-description` (or `bug/`, `chore/`, `spike/`)
2. Implement to the acceptance criteria — no more, no less
3. If the ticket is ambiguous on a product decision: ask the user, do not assume
4. Follow coding conventions from `CLAUDE.md`:
   - TypeScript strict mode on frontend
   - Python + type hints + Pydantic on control plane
   - Never use "agent" in new code — always "shroom"
5. Write tests for every acceptance criterion
6. If API or schema changed: update relevant docs

## Pre-PR Verification

Run all checks before opening a PR:

```bash
pnpm --filter frontend lint
pnpm --filter frontend exec tsc --noEmit
pnpm test
pytest apps/control-plane/tests/
```

## PR Format

- Branch: `feature/MYC-XX-short-description`
- PR title: `[MYC-XX] Short description`
- PR must include: working demo, updated docs (if API/schema changed), tests, no TODOs

## References

- `CLAUDE.md` — project context (read every session)
- `docs/project-state/BACKLOG.md` — dependency graph
- `docs/project-state/OPEN-QUESTIONS.md` — unresolved decisions
- `docs/design/SHROOM-EVENT-SCHEMA.md` — event schema (if event work)
