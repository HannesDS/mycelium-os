# Contributing to Mycelium OS

## Local setup

See [README.md](README.md#quick-start) for prerequisites and quick start.

## Development workflow

1. Pick a ticket from [Linear](https://linear.app) (MYC-XX)
2. Create a branch: `git checkout -b feat/myc-XX-short-description`
3. Start the stack: `make up` (infra) + `make dev` (frontend)
4. Implement with tests
5. Verify: `make test && make lint`
6. Push and open a PR

## Branch naming

```
feat/myc-XX-description     # New feature
fix/myc-XX-description      # Bug fix
chore/myc-XX-description    # Infra, config, refactoring
spike/myc-XX-description    # Research / exploration
```

## PR requirements

Every PR must include:

- **Working demo** — screenshot, video, or live preview
- **Updated docs** — if any API or schema changed
- **Tests** — for acceptance criteria
- **No TODOs in code** — use feature flags instead

## Code conventions

### TypeScript (frontend)

- Strict mode on
- Every component gets a Storybook story
- No direct DB access — always via control plane API
- Use `shroom` everywhere, never `agent` / `bot` / `worker`

### Python (control plane)

- Type hints required on all functions
- Pydantic models for all data shapes
- Every endpoint gets an OpenAPI annotation
- Tests with pytest

### General

- ShroomEvent schema changes require a migration + changelog entry
- Feature flags for anything not ready for production
- The word "Shroom" is canonical — see [ADR-001](docs/adrs/ADR-001-shroom-terminology.md)

## Running tests

```bash
make test            # All tests
make test-frontend   # Vitest (frontend)
make test-backend    # Pytest (control plane)
make lint            # ESLint
make typecheck       # tsc --noEmit
```

## Docker services

```bash
make up              # Start everything
make down            # Stop everything
make logs            # Tail all logs
make logs-nats       # Tail specific service
make healthcheck     # Check service status
make psql            # Postgres shell
make migrate         # Run Alembic migrations
make clean           # Nuclear reset (removes volumes)
```

## Architecture reference

- [Architecture decisions](docs/adrs/)
- [ShroomEvent schema](docs/design/SHROOM-EVENT-SCHEMA.md)
- [Backlog & project state](docs/project-state/BACKLOG.md)
- [Open questions](docs/project-state/OPEN-QUESTIONS.md)

## Useful URLs (local dev)

| URL | What |
|---|---|
| http://localhost:3000 | Frontend |
| http://localhost:8000/docs | API explorer |
| http://localhost:7474 | Neo4j browser |
| http://localhost:9001 | MinIO console |
| http://localhost:8025 | Mailhog (email) |
