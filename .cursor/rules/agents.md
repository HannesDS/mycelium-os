# Agent conventions

## Source of truth

`mycelium.yaml` is the single source of truth for agent definitions.

## MVP agent IDs (must match mycelium.yaml exactly)

- `sales-agent` — Sales Development
- `delivery-agent` — Delivery Lead
- `billing-agent` — Billing & Finance
- `compliance-agent` — Compliance & Legal
- `ceo-agent` — CEO / Decider

## Event schema

All agent events must conform to the schema defined in `CLAUDE.md` and `@/types/agent-events.ts`:

```json
{
  "agent_id": "string",
  "event": "message_sent | task_started | task_completed | escalation_raised | decision_received | idle | error",
  "to": "string (optional)",
  "topic": "string",
  "timestamp": "ISO-8601",
  "payload_summary": "string",
  "metadata": {}
}
```

Never add, remove, or rename agent IDs without updating `mycelium.yaml` first.
