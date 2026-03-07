# ADR-008: Logical Isolation for MVP (K8s Namespaces Deferred)

**Date:** 2026-03-07  
**Status:** Accepted  
**Deciders:** Hannes Desmet

---

## Context

The architecture calls for per-shroom sandboxes. The original design had each shroom in its own Kubernetes namespace. For MVP, this is over-engineering.

## Decision

**MVP uses logical isolation**, not physical K8s namespace isolation.

Isolation in MVP:
- Each shroom runs as a separate Agno `Agent` instance (separate Python process or asyncio task)
- Shrooms cannot access each other's memory objects directly — all cross-shroom communication is via NATS events
- Shrooms have no direct DB access — only via the control plane API
- Audit log is written by the control plane, not by shrooms directly

K8s namespace per shroom is explicitly **deferred to post-MVP**.

## Consequences

- `docker compose up` starts everything in a single compose stack
- No K8s required for development or demo
- The Helm chart (`chart/`) is production-ready infrastructure but not required for MVP
- When K8s namespaces are added, the `Shroom` wrapper handles the deployment difference — business logic does not change
- Security rules (no cross-sandbox access, no direct DB) are enforced in code, not in infra, for MVP

## Rationale

- MVP goal: working demo with 5 mock shrooms and one real human approval
- K8s adds setup complexity that delays the demo
- Logical isolation is sufficient to validate the product concept
- Physical isolation is an operational concern, not a product differentiator at this stage
