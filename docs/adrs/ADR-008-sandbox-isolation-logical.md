# ADR-008 — Sandbox isolation: logical isolation for MVP, K8s namespaces deferred

**Status:** Accepted  
**Date:** 2026-03-07  
**Deciders:** Hannes De Smet

## Context

`CLAUDE.md` security rule: "each agent sandbox has NO access to other sandboxes or the control plane DB directly." This implies strong isolation. K8s namespace isolation would enforce this at the infrastructure level, but requires ARK or custom K8s work and contradicts our Docker Compose MVP infrastructure.

## Decision

**For MVP:** Logical isolation is sufficient. Each shroom runs as an isolated Agno agent process. Access control is enforced at the API/control-plane layer, not at the infrastructure layer.

Inter-shroom communication goes **exclusively via the NATS event bus**. Shrooms cannot directly call each other's APIs — all messages go through the bus. The control plane enforces this at the routing layer.

The `CLAUDE.md` security rule is met at the application level for MVP.

**Phase 2:** K8s namespace isolation — when the platform moves to production or when security requirements harden beyond what application-level isolation can provide.

## Security rules preserved

| Rule | How enforced at MVP |
|---|---|
| No agent executes financial/external actions directly | `cannot: execute` in manifest, enforced by control plane before any tool call |
| Inter-agent messages are signed | NATS subject-level message signing (TBD in MYC-17 spike) |
| No direct DB access from shroom | Shroom has no DB credentials — all persistence via control plane API |
| All actions written to audit log before execution | Control plane appends to audit log before forwarding to Agno |

## Consequences

- No K8s required for MVP — Docker Compose is sufficient
- NATS is the only inter-shroom communication channel — enforceable without K8s
- **This decision must be re-evaluated before any production deployment with real user data**
- Phase 2 upgrade path: wrap each shroom in a K8s namespace, use ARK or custom controller, same manifest contract
