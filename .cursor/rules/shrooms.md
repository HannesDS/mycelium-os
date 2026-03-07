# Shroom conventions

## Source of truth

`mycelium.yaml` is the single source of truth for shroom definitions.

## MVP shroom IDs (must match mycelium.yaml exactly)

- `sales-shroom` — Sales Development
- `delivery-shroom` — Delivery Lead
- `billing-shroom` — Billing & Finance
- `compliance-shroom` — Compliance & Legal
- `ceo-shroom` — CEO / Decider

## Event schema

All shroom events must conform to the schema defined in `CLAUDE.md` and `@/types/shroom-events.ts`:

```json
{
  "shroom_id": "string",
  "event": "message_sent | task_started | task_completed | escalation_raised | decision_received | idle | error",
  "to": "string (optional)",
  "topic": "string",
  "timestamp": "ISO-8601",
  "payload_summary": "string",
  "metadata": {}
}
```

Never add, remove, or rename shroom IDs without updating `mycelium.yaml` first.
