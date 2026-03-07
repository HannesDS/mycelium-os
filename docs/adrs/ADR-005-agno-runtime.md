# ADR-005: Agno as the Shroom Execution Runtime

**Date:** 2026-03-07  
**Status:** Accepted  
**Deciders:** Hannes Desmet

---

## Context

We needed a shroom execution runtime — the layer that actually runs an LLM call with tools and memory. Candidates evaluated: LangGraph, CrewAI, AutoGen, AgentOS (ARK), Agno.

## Decision

**Agno** (formerly Phidata) is the shroom execution primitive.

- Each shroom is an Agno `Agent` instance, wrapped in a `Shroom` class
- Agno handles: model calls, tool registration, session storage, built-in memory
- We build on top of Agno: NATS event emission, bead recording, escalation hooks, manifest-driven config

## What Agno gives us
- Clean Python API: `Agent(model=..., tools=[...], memory=...)`
- Built-in session storage (SQLite dev / Postgres prod)
- Structured tool use
- Multi-agent workflows (team mode) — useful for escalation chains

## What we build on top
- `Shroom` wrapper class that reads from manifest and emits `ShroomEvent` to NATS
- Bead recording hooks on every tool call and model response
- Escalation protocol (proposal → human inbox)
- Audit log write-before-execute

## Consequences

- The control plane is **Python / FastAPI** (ADR-006), not Node.js — Agno is Python-first
- Agno session storage: SQLite in dev (default), Postgres in prod — must confirm which docker-compose targets (see TBD-5 / MYC-28 open question)
- Agno's `Agent` class is internal — external code always uses `Shroom`
- If Agno changes its API, the `Shroom` wrapper is the only thing that needs updating

## Alternatives rejected
- **LangGraph**: Too graph-centric, overhead for simple shroom patterns
- **CrewAI**: Opinionated multi-agent framework, harder to control event emission
- **AgentOS / ARK**: Explored in MYC-14 spike; superseded. Too much infra lock-in.
- **AutoGen**: Microsoft-backed, different philosophy on conversation patterns
