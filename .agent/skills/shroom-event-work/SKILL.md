---
name: shroom-event-work
description: Workflow for working with ShroomEvent schema, NATS subjects, or event emission in Mycelium OS. Use when implementing anything involving shroom events, NATS publishing, or the audit log.
---

# Shroom Event Work

Canonical workflow for any code that touches ShroomEvent schema, NATS event emission, or audit logging.

## When to Use

- Adding or modifying event emission from a shroom
- Working on the NATS event bus or WebSocket bridge
- Implementing audit log writes
- Creating mock shroom event sequences
- Any code that imports or references `ShroomEvent`

## Canonical Event Schema

Every event must conform to this shape exactly:

```json
{
  "shroom_id": "sales-shroom",
  "event": "message_sent",
  "to": "root-shroom",
  "topic": "lead_qualified",
  "timestamp": "2026-03-07T12:00:00Z",
  "payload_summary": "Human-readable one-liner",
  "metadata": {}
}
```

### Required fields
- `shroom_id` — must match a shroom declared in `mycelium.yaml`
- `event` — one of: `message_sent`, `task_started`, `task_completed`, `escalation_raised`, `decision_received`, `idle`, `error`
- `timestamp` — ISO-8601, UTC
- `payload_summary` — human-readable one-liner for the visual office and audit log

### Optional fields
- `to` — target shroom_id for directed events
- `topic` — domain topic (e.g. `lead_qualified`, `invoice_overdue`)
- `metadata` — arbitrary object for tool call details, model name, token count, etc.

## Security: Audit-Before-Emit Rule

Every event MUST be written to the append-only audit log **before** it is emitted to NATS. No exceptions.

For `decision_received` specifically:
1. Human submits decision in Approvals inbox
2. Control plane writes decision to audit log
3. Then emits `decision_received` ShroomEvent to NATS
4. Shroom receives and acts

Step 2 must complete before step 3.

## Mock Shroom Compliance

Mock shrooms emit the exact same event schema as real shrooms. The frontend and NATS bus cannot distinguish them. Mock shrooms must:
- Use valid `shroom_id` values from `mycelium.yaml`
- Emit all required fields
- Use realistic `payload_summary` text
- Emit events in plausible sequences (not random)

## NATS Subject (TBD-1 — unresolved)

Candidate pattern: `mycelium.events.<shroom_id>.<event_type>`

This is **not yet decided**. Check `docs/project-state/OPEN-QUESTIONS.md` TBD-1 before implementing NATS subject logic. Do not assume.

## References

- `docs/design/SHROOM-EVENT-SCHEMA.md` — full schema reference
- `apps/frontend/src/types/shroom-events.ts` — TypeScript types
- `apps/control-plane/core/models.py` — Pydantic models
- `docs/project-state/OPEN-QUESTIONS.md` — TBD-1 (NATS subjects)
