# A2A Agent Discovery

Each shroom exposes an A2A-compliant Agent Card for discovery.

## Endpoint

```
GET /shrooms/{shroom_id}/.well-known/agent-card.json
```

## Example

```bash
curl http://localhost:8000/shrooms/root-shroom/.well-known/agent-card.json
```

Response includes `name`, `description`, `url`, `skills` (as AgentSkill objects), and protocol metadata.

## Base URL

Set `CONTROL_PLANE_BASE_URL` to override the default `http://localhost:8000` in the card's `url` field.
