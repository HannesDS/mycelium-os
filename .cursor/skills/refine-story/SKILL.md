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

## Creating the Ticket in Linear

After refinement, create the ticket using the Linear MCP:

```
server: plugin-linear-linear
tool: save_issue
args: {
  title: "<ticket title>",
  team: "Mycellium-os",
  project: "Mycelium OS — MVP",
  priority: <1=Urgent, 2=High, 3=Medium, 4=Low>,
  labels: ["Feature" | "Bug" | "Chore"],
  description: "<full ticket description in markdown>",
  blockedBy: ["MYC-XX"]  // if dependencies exist
}
```

## Auto-Delegation

After creating the ticket, check if it should start immediately:

1. Read `docs/project-state/BACKLOG.md` — is there a ticket currently In Progress?
2. If NO ticket is In Progress AND this ticket has no unresolved blockers:
   - Set it as active immediately:
     ```
     save_issue args: { id: "<ticket id>", state: "In Progress", delegate: "Cursor", assignee: "me" }
     ```
   - Tell the user: "Ticket created and assigned to Cursor. Implementation will start automatically."
3. If another ticket IS In Progress:
   - Leave it in Backlog
   - Tell the user: "Ticket created in Backlog. It will be picked up after the current ticket completes."
4. Always update `docs/project-state/BACKLOG.md` to include the new ticket in the correct position.

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
