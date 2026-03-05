# Mycelium OS — Agent Instructions

## Cursor Cloud specific instructions

### Repo state

This is a greenfield repo. As of the initial setup, only `CLAUDE.md` (architectural spec) and `.github/` issue templates exist. No application code, dependency manifests, or infrastructure configs have been committed yet.

### Planned stack (from CLAUDE.md)

- **Frontend**: Next.js + TypeScript + canvas (Konva or D3), real-time via WebSocket
- **Control plane**: Node.js or Python FastAPI (TBD)
- **Infra**: PostgreSQL, Neo4j, NATS, MinIO, Mailhog (dev)
- **Package manager**: prefer `pnpm` per workspace conventions

### Available tooling

- Node.js (managed via nvm), pnpm, Python 3, git are pre-installed.
- When `apps/frontend/` or root `package.json` is added, run `pnpm install` to install deps.
- When Python services are added, check for `requirements.txt` or `pyproject.toml`.

### Key conventions (see CLAUDE.md for full details)

- TypeScript strict mode on frontend.
- Every component needs a Storybook story.
- Every API endpoint needs OpenAPI annotations.
- Event schema changes require migration + changelog.
- No direct DB access from frontend — always via control plane API.
