# ADR-007: EU-Native Open Source Models (Mistral / Ollama)

**Date:** 2026-03-07  
**Status:** Accepted  
**Deciders:** Hannes Desmet

---

## Context

Mycelium OS targets EU organisations with data sovereignty requirements. Model selection must respect: EU data residency, open source preference, cost predictability.

## Decision

Default model stack:

| Context | Model | Provider |
|---|---|---|
| MVP demo / local dev | `mistral-7b` or `llama3` | Ollama (local) |
| Staging / prod | Mistral API (EU endpoints) | Mistral AI |
| Embeddings | `nomic-embed-text` or Mistral embed | Ollama / Mistral API |

## Consequences

- Agno model config is per-shroom in the manifest (`model: mistral-7b`)
- The `Settings` page (UI) lets users configure model endpoints — this is where an org can point to their own Ollama or OpenAI-compatible endpoint
- No hardcoded model references in business logic — always read from shroom manifest
- OpenAI-compatible API is the abstraction layer (Mistral and Ollama both support it)

## Rationale

- EU-native: Mistral AI is French, data stays in EU
- Open source: models are auditable, no vendor lock-in
- Ollama: zero-cost local development, fast iteration
- OpenAI-compatible API means swapping models is a config change, not a code change

## Not decided

Specific embedding model for the RAG stack is blocked on TBD-3 (vector store selection).
