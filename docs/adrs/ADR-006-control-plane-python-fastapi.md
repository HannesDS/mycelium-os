# ADR-006 — Control plane language: Python / FastAPI

**Status:** Accepted  
**Date:** 2026-03-07  
**Deciders:** Hannes De Smet

## Context

Two language options for the control plane:
- **Node.js / TypeScript** — matches the frontend, single language across the monorepo
- **Python / FastAPI** — matches the Agno runtime and the broader ML/AI ecosystem

Agno (ADR-005) is Python-native. Integrating it from Node.js would require a subprocess boundary or gRPC bridge — an unnecessary translation layer that adds complexity and debugging surface.

## Decision

Control plane is **Python / FastAPI**.

Rationale:
- Agno is Python-native. The shroom controller (which reads manifests and instantiates Agno agents) must run in the same process or at minimum the same language ecosystem
- FastAPI provides async, auto-generated OpenAPI annotations, and is production-grade
- The frontend-to-control-plane boundary is a clean REST + WebSocket API — the language on either side is irrelevant
- Python is the lingua franca of the AI/ML ecosystem — future integrations (Phoenix, vector stores, model serving) will be Python-first

## Consequences

- `apps/control-plane/` is a Python FastAPI application
- `apps/frontend/` remains TypeScript (Next.js) — no change
- The monorepo has two language ecosystems: `pnpm` manages JS/TS; `uv` manages Python
- OpenAPI spec is auto-generated from FastAPI annotations — frontend can consume it for type safety
- All inter-service communication is via REST/WebSocket — no shared code between frontend and control plane
- CI must run both `pnpm test` and `pytest` — already scaffolded in MYC-16
