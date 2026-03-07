# ShroomEvent Schema — Canonical Reference

> Never deviate from this schema. All shrooms (mock and real) emit identical event shapes.

---

## Event envelope

```json
{
  "shroom_id": "sales-shroom",
  "event": "message_sent",
  "to": "ceo-shroom",
  "topic": "lead_qualified",
  "timestamp": "2026-03-07T12:00:00Z",
  "payload_summary": "Human-readable one-liner describing what happened",
  "metadata": {}
}
```

## Field reference

| Field | Type | Required | Notes |
|---|---|---|---|
| `shroom_id` | string | ✅ | Must match a shroom declared in `mycelium.yaml` |
| `event` | enum | ✅ | See event types below |
| `to` | string | ❌ | Target shroom_id for directed events |
| `topic` | string | ❌ | Domain topic (e.g. `lead_qualified`, `invoice_overdue`) |
| `timestamp` | ISO-8601 | ✅ | UTC |
| `payload_summary` | string | ✅ | Human-readable one-liner for the visual office and audit log |
| `metadata` | object | ❌ | Arbitrary — use for tool call details, model name, token count, etc. |

## Event types

| Event | When emitted |
|---|---|
| `message_sent` | Shroom sends a message to another shroom |
| `task_started` | Shroom begins working on a task |
| `task_completed` | Shroom finishes a task |
| `escalation_raised` | Shroom proposes an action requiring approval |
| `decision_received` | Shroom receives a decision (from human or ceo-shroom) |
| `idle` | Shroom has no active tasks |
| `error` | Shroom encountered an error |

## NATS subject (TBD-1)

Candidate: `mycelium.events.<shroom_id>.<event_type>`  
Example: `mycelium.events.sales-shroom.escalation_raised`

This is unresolved — see `docs/project-state/OPEN-QUESTIONS.md` TBD-1.

## Audit log requirement

Every event MUST be written to the append-only audit log **before** it is acted upon.  
For `decision_received` specifically:
1. Human submits decision in Approvals inbox
2. Control plane writes decision to audit log **first**
3. Then emits `decision_received` ShroomEvent to NATS
4. Shroom receives and acts

**Step 2 must complete before step 3. No exceptions.**

## Mock shroom compliance

Mock shrooms emit the same event schema as real shrooms. The frontend and NATS bus have no way to distinguish mock from real. Mock shrooms must:
- Use valid `shroom_id` values from `mycelium.yaml`
- Emit all required fields
- Use realistic `payload_summary` text
- Emit events in plausible sequences (not random)
