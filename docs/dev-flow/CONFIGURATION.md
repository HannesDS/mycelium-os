# Configuration

## Environment variables

### Control plane

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NATS_URL` | Yes | NATS server URL (e.g. `nats://localhost:4222`) |
| `DEV_API_KEY` | Yes* | API key for authenticated endpoints. *Required when control plane is exposed; fail-closed without it. |
| `DEV_PRINCIPAL_ID` | No | Principal ID for dev auth (default: `dev-user`) |
| `DEMO_ENABLED` | No | Set to `true` or `1` to enable `POST /demo/trigger-escalation` (default: `false`) |
| `MYCELIUM_CONFIG` | No | Path to `mycelium.yaml` (default: `mycelium.yaml`) |
| `OLLAMA_HOST` | No | Ollama API URL (default: `http://localhost:11434`) |
| `OPENROUTER_API_KEY` | When using OpenRouter | API key from [openrouter.ai](https://openrouter.ai/settings/keys) |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `CONTROL_PLANE_URL` | No | Control plane base URL for the **proxy** (default: `http://localhost:8000`). Server-side only. |
| `CONTROL_PLANE_API_KEY` | Yes | Injected by the proxy on every forwarded request as `X-API-Key`. Must match `DEV_API_KEY` on the control plane. Fails fast on startup if missing. |
| `NEXT_PUBLIC_CONTROL_PLANE_URL` | For WebSocket | Control plane URL for **direct** WebSocket connection. Not a secret; used for `/ws/events`. |

### Infrastructure (docker compose)

| Variable | Description |
|----------|-------------|
| `POSTGRES_*` | PostgreSQL credentials |
| `NEO4J_AUTH` | Neo4j auth |
| `NATS_URL` | NATS URL |
| `MINIO_*` | MinIO credentials |
| `OLLAMA_HOST_PORT` | Ollama port mapping |

## API proxy

Authenticated control-plane calls go through the Next.js API proxy at `/api/control-plane/*`:

1. Browser calls `fetch('/api/control-plane/events')` (no API key in client code)
2. Next.js route handler reads `CONTROL_PLANE_API_KEY` from server env (fails fast if missing)
3. Proxy forwards to `CONTROL_PLANE_URL/events` with `X-API-Key: <key>` header
4. Control plane validates the key via `get_principal`

Only allowlisted paths/methods are forwarded (see `ALLOWED_PATHS` in the route handler). Client-supplied `X-API-Key` headers are stripped and replaced by the server-side value.

**Never use `NEXT_PUBLIC_*` for secrets.** Values with that prefix are embedded in the client bundle and visible to anyone.

## Local development

```bash
cp .env.example .env
```

Edit `.env`:

```
DEV_API_KEY=your-dev-key-here          # control plane validates this
CONTROL_PLANE_API_KEY=your-dev-key-here # must match DEV_API_KEY; used by frontend proxy
DEMO_ENABLED=true
CONTROL_PLANE_URL=http://localhost:8000
NEXT_PUBLIC_CONTROL_PLANE_URL=http://localhost:8000
```

Then start with `make dev` (sources `.env` automatically) or export vars manually:

```bash
set -a && . .env && set +a && pnpm dev
```

> **Note:** `make dev` now auto-sources the root `.env` so `CONTROL_PLANE_API_KEY` is
> available to Next.js. If you run `pnpm dev` directly, export the vars first.

## Production

- Set `DEV_API_KEY` (control plane) and `CONTROL_PLANE_API_KEY` (frontend proxy) to the same strong, unique value
- Set `DEMO_ENABLED=false` (or omit)
- Replace with real auth (JWT, session, OIDC) before multi-user deployment
