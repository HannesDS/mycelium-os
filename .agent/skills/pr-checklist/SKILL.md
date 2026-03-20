---
name: pr-checklist
description: Pre-PR verification checklist for Mycelium OS. Runs lint, type-check, tests, and checks for TODOs. Invoke manually before opening a PR.
disable-model-invocation: true
---

# PR Checklist

Run this before opening any PR in Mycelium OS.

## When to Use

Invoke manually with `/pr-checklist` before opening a PR.

## Steps

1. Run the verification script: `scripts/verify.sh` from this skill's directory
2. If any check fails: fix the issue before proceeding
3. Verify no TODOs remain in changed files (use feature flags instead)
4. If API or schema changed: confirm docs are updated
5. Confirm a working demo is included (video, screenshot, or Cursor native demo)

## Verification Script

Run from project root:

```bash
.cursor/skills/pr-checklist/scripts/verify.sh
```

This runs:
- Frontend lint (`pnpm --filter frontend lint`)
- Frontend type-check (`pnpm --filter frontend exec tsc --noEmit`)
- Frontend tests (`pnpm test`)
- Control plane tests (`pytest apps/control-plane/tests/`)
- TODO scan in staged files

## PR Requirements

Every PR must include:
1. Working demo
2. Updated docs if API/schema changed
3. Tests for acceptance criteria
4. No TODOs left in code
