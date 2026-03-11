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
| `DEV_API_KEY` | Yes* | Same as control plane. Used by the proxy to add `X-API-Key` to forwarded requests. |
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
2. Next.js route handler reads `DEV_API_KEY` from server env
3. Proxy forwards to `CONTROL_PLANE_URL/events` with `X-API-Key` header
4. Control plane validates the key via `get_principal`

**Never use `NEXT_PUBLIC_*` for secrets.** Values with that prefix are embedded in the client bundle and visible to anyone.

## Local development

```bash
cp .env.example .env
```

Edit `.env`:

```
DEV_API_KEY=your-dev-key-here
DEMO_ENABLED=true
CONTROL_PLANE_URL=http://localhost:8000
```

For WebSocket (visual office), set in `.env.local` or `.env`:

```
NEXT_PUBLIC_CONTROL_PLANE_URL=http://localhost:8000
```

## Production

- Set `DEV_API_KEY` to a strong, unique value
- Set `DEMO_ENABLED=false` (or omit)
- Replace `DEV_API_KEY` with real auth (JWT, session, OIDC) before multi-user deployment
- Rotate `DEV_API_KEY` if it was ever exposed
