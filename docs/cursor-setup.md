# Cursor Setup

## MCP Linear Integration

The project includes `.cursor/mcp.json` with Linear MCP preconfigured. After opening the project in Cursor:

1. Restart Cursor (or reload the window) so it picks up the config
2. Linear will prompt for OAuth authentication on first use
3. You can then reference Linear issues in chat (e.g. `@linear MYC-8`)

If the connection fails, try disabling and re-enabling the Linear MCP server in Cursor Settings (Ctrl/Cmd + Shift + J > MCP).

## Skills

All skills live in `.cursor/skills/`. This is the single canonical location — no other skill directories (`.agents/skills/`, `.claude/skills/`, etc.) are used. Those paths are gitignored.

### Dev skills (cloud agents)

Used automatically by the Orchestrator (Cursor) when implementing code.

| Skill | Source | Purpose |
|---|---|---|
| `vercel-react-best-practices` | Community (Vercel) | Next.js + React performance patterns |
| `web-design-guidelines` | Community (Vercel) | UI/UX conventions |
| `test-driven-development` | Community (obra) | TDD workflow |
| `verification-before-completion` | Community (obra) | Lint, type-check, test before finishing |
| `control-plane-endpoint` | Custom | FastAPI endpoint patterns for `apps/control-plane/` |
| `shroom-event-work` | Custom | ShroomEvent schema, NATS, audit log rules |
| `pr-checklist` | Custom | Pre-PR verification (`/pr-checklist` to invoke manually) |

### Management skills (story refinement)

Used when refining ideas into Linear tickets.

| Skill | Source | Purpose |
|---|---|---|
| `implement-ticket` | Custom | Step-by-step workflow for implementing a MYC-XX ticket |
| `refine-story` | Custom | Turn rough ideas into well-specified Linear tickets |

### Adding more community skills

Install to `.cursor/skills/` directly:

```bash
npx skills add <owner/repo> --skill <skill-name> -y
```

Then move from `.agents/skills/` to `.cursor/skills/` if the installer puts them elsewhere, and delete the scattered directories.

Browse available skills at https://skills.sh/

### How skills work

- Skills are discovered automatically on Cursor startup
- Dev skills activate when the Orchestrator determines they're relevant
- Skills with `disable-model-invocation: true` (like `pr-checklist`) are only used when you type `/skill-name` in chat
- Skills are version-controlled in the repo — every session picks them up fresh

## Rules

Always-apply rules live in `.cursor/rules/`:

| Rule | Purpose |
|---|---|
| `frontend.md` | TypeScript strict mode, Storybook, Tailwind, testing conventions |
| `shrooms.md` | Shroom IDs, event schema, mycelium.yaml as source of truth |

Rules are injected into every conversation automatically. Skills are loaded on-demand.

## Context file

`CLAUDE.md` is the project-level context file loaded every session. It contains architecture, conventions, security rules, and current codebase state.
