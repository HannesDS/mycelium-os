---
name: refine-story
description: Refine a rough idea into a fully specified Linear ticket for Mycelium OS. Use when the user brings a feature idea, bug report, or improvement and wants it turned into a ticket.
---

# Refine Story

Turn a rough idea into a well-specified Linear ticket (MYC-XX).

## When to Use

- User describes a feature idea, bug, or improvement
- User says "I want to add X" or "We need Y"
- User asks to create a ticket

## Refinement Process

Challenge the idea across these dimensions (2-5 turns max):

1. **Why does this exist?** — Who benefits? What breaks without it?
2. **Scope** — What's in? What's explicitly out?
3. **Acceptance criteria** — Must be verifiable/testable. No vague "it should work well."
4. **Size** — S (< 1 day), M (1-3 days), L (3-5 days). If L, suggest splitting.
5. **Dependencies** — Check `docs/project-state/BACKLOG.md` for blockers
6. **Open questions** — Things that must NOT be assumed. Check `docs/project-state/OPEN-QUESTIONS.md` for existing TBDs.

## Ticket Format

```
Title: [concise, imperative]
Type: feature | bug | chore | spike | design
Size: S | M | L
Blocked by: MYC-XX (if any)

## Context
Why this exists. 1-2 sentences.

## Acceptance Criteria
- [ ] Testable criterion 1
- [ ] Testable criterion 2

## Out of Scope
- Explicit exclusion 1

## Open Questions (if any)
- Question that must be answered before implementation

## Security Notes (if applicable)
- Any security considerations
```

## Rules

- Never assume answers to open questions — flag them explicitly
- If it touches the ShroomEvent schema: note that in security/migration notes
- If it touches the Approvals inbox (MYC-26): flag security sensitivity
- Size L tickets should be split unless there's a good reason not to
- Reference ADRs when the ticket touches a locked architecture decision

## References

- `docs/project-state/BACKLOG.md` — existing tickets and dependency graph
- `docs/project-state/OPEN-QUESTIONS.md` — unresolved decisions (TBD-1 through TBD-5)
- `docs/adrs/` — locked architecture decisions
- `CLAUDE.md` — project context
