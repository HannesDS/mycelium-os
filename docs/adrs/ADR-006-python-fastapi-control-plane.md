# ADR-006: Python / FastAPI for the Control Plane

**Date:** 2026-03-07  
**Status:** Accepted  
**Deciders:** Hannes Desmet

---

## Context

The control plane needs to: parse `mycelium.yaml`, manage shroom lifecycle, emit events to NATS, write the audit log, serve the human decision inbox API, and run Agno shrooms. The frontend is Next.js (TypeScript). The question was whether the control plane should also be TypeScript or Python.

## Decision

**Python / FastAPI** for `apps/control-plane/`.

## Consequences

- The repo has two languages: TypeScript (frontend) and Python (control plane + agents)
- Shared types between frontend and control plane are expressed as OpenAPI specs (auto-generated from FastAPI), not shared TS types
- Every API endpoint has an OpenAPI annotation (enforced in PR checklist)
- Pydantic models are the source of truth for data shapes in the control plane
- The `shrooms/` directory is also Python

## Rationale

- Agno is Python-first — a TypeScript control plane would require a subprocess bridge to run shrooms
- The ML/AI ecosystem is Python-native (model clients, embedding libs, vector stores)
- FastAPI + Pydantic gives automatic OpenAPI docs with zero extra work
- Python's async support (asyncio + NATS.py) is mature

## API contract

The frontend communicates with the control plane **only** via the REST API (and WebSocket for events). Direct DB access from frontend is forbidden (see security rules in CLAUDE.md).
