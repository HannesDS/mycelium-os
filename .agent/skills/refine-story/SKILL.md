---
name: refine-story
description: Refine a rough idea into a fully specified OpenSpec change and create a a Linear ticket for it for Mycelium OS. Use when the user brings a feature idea, bug report, or improvement and wants it turned into a spec.
---

# Refine Story

Turn a rough idea into a well-specified OpenSpec change. Also create a Linear ticket for backlog tracking.

## When to Use

- User describes a feature idea, bug, or improvement
- User says "I want to add X" or "We need Y"
- User asks to create a ticket or spec

## Refinement Process (2–5 turns)

Challenge the idea across these dimensions:

1. **Why does this exist?** — Who benefits? What breaks without it?
2. **Scope** — What's in? What's explicitly out?
3. **Acceptance criteria** — Must be verifiable/testable. No vague "it should work well."
4. **Size** — S (< 1 day), M (1–3 days), L (3–5 days). If L, suggest splitting.
5. **Dependencies** — Check `docs/project-state/BACKLOG.md` for blockers
6. **Open questions** — Things that must NOT be assumed. Check `docs/project-state/OPEN-QUESTIONS.md`.

## Primary Output: OpenSpec Change

After refinement, create an OpenSpec change:

```
/opsx:propose "kebab-case-change-name"
```

Or invoke the `openspec-propose` skill with the refined idea. Derive the name from the description (e.g. "add shrooms list page" → `add-shrooms-list-page`).

The proposal should capture:
- Intent (why)
- Scope (in/out)
- Approach (high-level how)
- Reference Linear ticket (MYC-XX) if one exists

## Optional: Linear Ticket

For backlog tracking, create a Linear ticket via MCP:

```
server: plugin-linear-linear
tool: save_issue
args: {
  title: "<ticket title>",
  team: "Mycellium-os",
  project: "Mycelium OS — MVP",
  priority: <1–4>,
  labels: ["Feature" | "Bug" | "Chore"],
  description: "<full description in markdown>",
  blockedBy: ["MYC-XX"]
}
```

Link the ticket in `openspec/changes/<name>/proposal.md`.

## Auto-Delegation (Linear)

1. Read `docs/project-state/BACKLOG.md` — is any ticket In Progress?
2. If NO ticket In Progress AND no blockers: set this ticket In Progress, delegate to Cursor
3. If another ticket is In Progress: leave in Backlog
4. Update BACKLOG.md with the new ticket

## Rules

- Never assume answers to open questions — flag them
- If touching ShroomEvent schema: note in security/migration notes
- If touching Approvals inbox: flag security sensitivity
- Size L tickets: suggest splitting
- Reference ADRs when touching locked architecture

## References

- `docs/project-state/BACKLOG.md` — existing tickets
- `docs/project-state/OPEN-QUESTIONS.md` — TBDs
- `docs/adrs/` — locked decisions
- `CLAUDE.md` — project context
- `openspec-propose` skill — create change
