# ADR-007 — Message schema: static in manifest now, runtime negotiation Phase 2

**Status:** Accepted  
**Date:** 2026-03-07  
**Deciders:** Hannes De Smet

## Context

Shrooms communicate with each other via a standard message envelope. The question: is the schema fixed, or can shrooms negotiate and evolve their schemas at runtime?

Runtime schema negotiation would be powerful — shrooms could propose new message fields to each other and reach agreement. But it requires the shroom API layer to be stable first and adds significant protocol complexity for MVP.

## Decision

**For MVP:** Message schema is declared statically in the shroom manifest, versioned with it.

The standard `ShroomEvent` envelope is fixed:

```typescript
interface ShroomEvent {
  shroom_id: string
  event: ShroomEventType
  to?: string
  topic?: string
  timestamp: string          // ISO-8601
  payload_summary: string    // human-readable one-liner
  metadata?: Record<string, unknown>
}
```

Per-shroom custom fields are declared in `spec.inbox.schema` in the manifest. Each shroom exposes a schema discovery endpoint: `GET /shrooms/{id}/schema`.

**Phase 2:** Runtime schema negotiation — shrooms proposing new fields to each other, API versioning between shrooms, schema evolution tooling.

## Consequences

- Shroom inbox schema is part of the manifest — Cursor can implement it without human input
- Schema discovery endpoint is in scope for the control plane API (MYC-22)
- The `ShroomEvent` TypeScript type and Python dataclass must stay in sync — shared via `packages/shroom-events/` (MYC-24)
- Phase 2 will require: shroom-to-shroom API versioning, proposal/acceptance protocol, schema evolution tooling
