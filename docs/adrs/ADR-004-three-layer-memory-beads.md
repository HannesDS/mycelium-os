# ADR-004: Three-Layer Memory Model (Beads)

**Date:** 2026-03-07  
**Status:** Accepted  
**Deciders:** Hannes Desmet

---

## Context

AI shrooms need memory. But "memory" in LLM systems is overloaded — it can mean short-term context window, episodic recall, or long-term knowledge. We needed a clean model that the Orchestrator can implement unambiguously.

## Decision

Shrooms have three memory layers:

### Layer 1 — Working Memory (context window)
- The current conversation / task in the LLM's context window
- Managed by Agno automatically
- No persistence — lost when the session ends

### Layer 2 — Episodic Memory: Beads
- **Beads** = discrete, timestamped memory items linked in a timeline
- Each bead has: `id`, `shroom_id`, `timestamp`, `type` (`observation` | `decision` | `interaction` | `escalation`), `content`, `session_id`
- Beads are **never edited** — append-only
- Default retention: 50 beads per shroom (configurable, see TBD-2)
- Beads are **not** a rolling summary — they are a linked timeline (like a ledger)
- The Memory UI (MYC-23) renders beads as a timeline

### Layer 3 — Semantic Memory (RAG)
- **Personal RAG**: per-shroom vector store for domain-specific knowledge
- **Shared RAG**: workspace-wide knowledge base (MYC-29)
- Vector store choice: TBD (see TBD-3) — pgvector vs Chroma vs Qdrant

## Consequences

- Beads are stored in Postgres, not in a vector store
- The bead schema must have a migration path if we add fields (append-only to the table, never alter existing rows)
- Agno's built-in memory is used for working memory only — we build beads and RAG on top
- MYC-23 implements beads; MYC-29 implements shared RAG

## Rationale

- Beads are the right abstraction: immutable, auditable, human-readable
- Separating episodic (beads) from semantic (RAG) avoids conflating "what happened" with "what is known"
- Append-only beads align with the audit log philosophy of the control plane
