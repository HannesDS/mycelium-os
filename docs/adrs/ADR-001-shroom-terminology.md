# ADR-001: Canonical Term for Agents is "Shroom"

**Date:** 2026-03-07  
**Status:** Accepted  
**Deciders:** Hannes Desmet

---

## Context

The system needed a canonical term for the AI agents that populate Mycelium OS. The word "agent" is overloaded across the industry (LangChain agents, OpenAI agents, K8s service agents, AI coding assistants, etc.) and carries no product identity.

## Decision

The canonical term for an AI worker in Mycelium OS is **Shroom** (plural: Shrooms).

- In code: `shroom`, `shroom_id`, `ShroomManifest`, `ShroomEvent`
- In UI: "Shroom", "Shrooms"
- In docs: "Shroom"
- Never: "agent", "bot", "worker" (except in technical adapter layer where an external SDK uses those terms)

## Consequences

- All new code uses `shroom` naming
- MYC-20 covers the codebase rename from `agent` → `shroom`
- The constitution format uses `shrooms:` not `agents:`
- Event schema uses `shroom_id` not `agent_id`
- External SDK terms (e.g. Agno's `Agent` class) are wrapped — the wrapper is called `Shroom`

## Rationale

Shroom is:
- Unique and memorable — no namespace collision
- On-brand for Mycelium (mycelium is fungal network; shrooms are the fruiting bodies)
- Short enough for code (`shroom_id` vs `agent_identifier`)
- Carries the right metaphor: shrooms emerge from the mycelium, do their work, report back
