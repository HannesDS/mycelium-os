---
name: implement-ticket
description: Step-by-step workflow for implementing a Linear ticket (MYC-XX) in Mycelium OS. Uses OpenSpec for spec-driven implementation. Use when the user says "Implement MYC-XX" or references a Linear ticket to work on.
---

# Implement Ticket

Workflow for picking up and implementing a Mycelium OS Linear ticket via OpenSpec.

## When to Use

- User says "Implement MYC-XX" or "Pick up MYC-XX"
- User pastes a Linear ticket and asks you to implement it
- Linear delegates a ticket to Cursor

## Pre-Implementation Checklist

1. Read `CLAUDE.md` for full project context
2. Read the Linear ticket (MYC-XX) via Linear MCP (`get_issue`) — get acceptance criteria
3. Read `docs/project-state/BACKLOG.md` — check dependencies are done
4. Read `docs/project-state/OPEN-QUESTIONS.md` — if blocked by TBD, stop and comment on ticket
5. Derive OpenSpec change name from ticket: `myc-XX-short-slug` (e.g. MYC-25 → `myc-25-shrooms-list`)

## OpenSpec Integration

**Primary path:** Every implementation goes through OpenSpec. The change folder is the spec.

1. **Check if OpenSpec change exists:**
   ```bash
   openspec list --json
   ```
   Look for a change matching the ticket (e.g. `myc-25-shrooms-list`). Also check `openspec/changes/` directory.

2. **If no change exists:** Create one from the ticket:
   - Run `openspec new change "myc-XX-short-slug"`
   - Create `proposal.md` from ticket: intent, scope, approach; reference MYC-XX
   - Create delta specs in `specs/<domain>/spec.md` from acceptance criteria (ADDED requirements)
   - Create `design.md` from technical approach (control plane vs data plane, ADRs)
   - Create `tasks.md` with checkboxes from AC (one task per verifiable criterion)
   - Use `openspec status --change "myc-XX-short-slug"` to validate

3. **If change exists:** Proceed to apply.

4. **Implement:** Invoke the `openspec-apply-change` skill (or follow its logic):
   - Read proposal, specs, design, tasks
   - Work through tasks, check off as done
   - Update artifacts if implementation reveals design issues

5. **On completion:** `/opsx-archive`, then open PR.

## Implementation Rules

- Follow coding conventions from `CLAUDE.md`: TypeScript strict, Python + Pydantic, always "shroom"
- Write tests for every acceptance criterion
- If API or schema changed: update relevant docs
- If ticket is ambiguous on product: comment on Linear, do not assume

## Pre-PR Verification

```bash
pnpm --filter frontend lint
pnpm --filter frontend exec tsc --noEmit
pnpm test
pytest apps/control-plane/tests/
```

All must pass. Do not proceed if any fail.

## PR Creation

- Branch: `feature/MYC-XX-short-description`
- PR title: `[MYC-XX] Short description`
- PR body: summary, link to Linear, test results
- Push and create via `gh pr create`

## Post-PR Pipeline

1. **Link PR to Linear:** `save_issue` with `links: [{ url: "<PR URL>", title: "PR #<n>" }]`
2. **Request Copilot review:** `request_copilot_review` (GitHub MCP)
3. **Chain next ticket:** Set next backlog ticket to In Progress via `save_issue`

## References

- `CLAUDE.md` — project context
- `docs/dev-flow/WORKFLOW.md` — OpenSpec workflow
- `docs/project-state/BACKLOG.md` — V1 sprint order
- `docs/project-state/OPEN-QUESTIONS.md` — TBDs
- `openspec-apply-change` skill — implementation loop
