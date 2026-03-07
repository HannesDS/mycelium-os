---
name: implement-ticket
description: Step-by-step workflow for implementing a Linear ticket (MYC-XX) in Mycelium OS. Use when the user says "Implement MYC-XX" or references a Linear ticket to work on.
---

# Implement Ticket

Workflow for picking up and implementing a Mycelium OS Linear ticket.

## When to Use

- User says "Implement MYC-XX" or "Pick up MYC-XX"
- User pastes a Linear ticket and asks you to implement it
- Linear delegates a ticket to Cursor

## Pre-Implementation Checklist

1. Read `CLAUDE.md` for full project context
2. Read the Linear ticket (MYC-XX) via Linear MCP (`get_issue`) — get the acceptance criteria
3. Read `docs/project-state/BACKLOG.md` — check this ticket's dependencies are done
4. Read `docs/project-state/OPEN-QUESTIONS.md` — check if any TBD items block this ticket
5. If blocked by an unresolved TBD: **stop and comment on the Linear ticket**. Do not guess.

## Implementation

1. Create a branch: `feature/MYC-XX-short-description` (or `bug/`, `chore/`, `spike/`)
2. Implement to the acceptance criteria — no more, no less
3. If the ticket is ambiguous on a product decision: comment on the Linear ticket, do not assume
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

All commands must pass with exit code 0. Do not proceed if any fail.

## PR Creation

- Branch: `feature/MYC-XX-short-description`
- PR title: `[MYC-XX] Short description`
- PR body: summary of changes, link to Linear ticket, test results
- Push the branch and create the PR via `gh pr create`

## Post-PR Pipeline (autonomous)

After the PR is created, execute these steps to keep the pipeline moving:

### Step 1: Request Copilot code review

Use the GitHub MCP `request_copilot_review` tool:

```
server: user-github
tool: request_copilot_review
args: { owner: "HannesDS", repo: "mycelium-os", pullNumber: <PR number> }
```

### Step 2: Mark the Linear ticket as Done

Use the Linear MCP `save_issue` tool:

```
server: plugin-linear-linear
tool: save_issue
args: { id: "<ticket UUID>", state: "Done" }
```

### Step 3: Chain to the next ticket

1. Read `docs/project-state/BACKLOG.md` — find the **V1 Sprint** table
2. Identify the current ticket's position in the implementation order
3. Find the next ticket in sequence that is still in Backlog
4. Set it as the next active ticket via Linear MCP:

```
server: plugin-linear-linear
tool: save_issue
args: {
  id: "<next ticket identifier, e.g. MYC-25>",
  state: "In Progress",
  delegate: "Cursor",
  assignee: "me"
}
```

If there is no next ticket (all V1 tickets are done), skip this step.

## References

- `CLAUDE.md` — project context (read every session)
- `docs/project-state/BACKLOG.md` — V1 sprint sequence and dependency graph
- `docs/project-state/OPEN-QUESTIONS.md` — unresolved decisions
- `docs/design/SHROOM-EVENT-SCHEMA.md` — event schema (if event work)
