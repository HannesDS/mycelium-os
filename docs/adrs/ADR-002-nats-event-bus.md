# ADR-002: NATS as the Event Bus

**Date:** 2026-03-07  
**Status:** Accepted  
**Deciders:** Hannes Desmet

---

## Context

The visual office needs a real-time event stream. Every shroom emits structured events. The frontend must consume them live. We needed a lightweight, Kubernetes-native message broker that could handle the fan-out pattern (many shrooms → one WebSocket bridge → one frontend).

## Decision

**NATS** (core NATS for MVP, JetStream for persistence later) is the event bus.

- Shrooms publish to NATS subjects
- A WebSocket bridge service subscribes to NATS and forwards to the Next.js frontend
- The frontend never connects to NATS directly

Subject naming is TBD (MYC-17 spike). Candidate pattern: `mycelium.events.<shroom_id>.<event_type>`

## Consequences

- NATS is included in the Helm chart (`chart/`) as a bundled dependency
- Mock shrooms and real shrooms publish identical event schemas to NATS — the frontend is unaware of the difference
- JetStream (persistence, replay) is explicitly deferred to post-MVP
- The WebSocket bridge is its own service in `apps/control-plane/` or a dedicated `apps/ws-bridge/`

## Rationale

- Lighter than Kafka for the MVP scale
- Cloud-native, K8s-native
- JetStream gives a clear upgrade path to durable messaging without changing the subject API
- Agno (the shroom runtime) does not prescribe an event bus — NATS sits cleanly above it
