# ADR-004 — Three-layer memory model per shroom

**Status:** Accepted  
**Date:** 2026-03-07  
**Deciders:** Hannes De Smet

## Context

Each shroom needs memory to function intelligently. We evaluated a single vector store vs. layered memory with different purposes. A single store conflates working memory, long-term case memory, and shared knowledge — making each harder to reason about and implement correctly.

## Decision

Every shroom has three distinct memory layers:

| Layer | Purpose | Scope | Technology |
|---|---|---|---|
| **Beads** | Episodic short-term memory — where the shroom is in time. Linked timeline of recent experience. Working memory / consciousness stream. | Per-shroom | Postgres (linked list) |
| **Personal RAG** | Long-term case memory — indexed records of: message received → how I handled it → what the output was. Queryable by semantic similarity when a new message arrives needing historical context. | Per-shroom | Vector store (TBD — see open decisions) |
| **Shared Mycelium RAG** | Company knowledge base. A shroom's declared `role` determines which namespaces it can read. The constitution defines the access rules. | Shared, role-gated | Vector store (TBD) |

These are **three distinct stores with distinct purposes** — not one store with multiple views.

**Beads is preferred over rolling-window summarisation** for short-term memory. Beads preserve the episodic structure of experience rather than compressing it into a lossy summary.

If the chosen runtime (Agno) does not support Beads natively, a thin Beads adapter is built on top of Agno's memory primitives.

## Open decisions

- **Beads retention policy**: how many beads per shroom, TTL or count-based? → human decision required before implementation (MYC-23 defaults to 50, flag for review)
- **Vector store technology**: pgvector (reuse Postgres) vs. Chroma vs. Qdrant → to be resolved in MYC-17 spike

## Consequences

- Agno has built-in memory primitives — they are mapped to this three-layer model in the control plane
- Shared RAG namespaces and role access rules are defined in `mycelium.yaml`
- Personal RAG writes happen after every message handled — input, reasoning trace, output
- Each layer is independently queryable and independently evictable
- Three stores means three things to operate — complexity is justified by the architectural clarity
