# ADR-001 — Canonical term: Shroom

**Status:** Accepted  
**Date:** 2026-03-07  
**Deciders:** Hannes De Smet

## Context

The word "agent" is overloaded in the Mycelium OS project. It refers both to AI coding assistants (Cursor, Claude) and to the autonomous workers inside a Mycelium. This creates confusion in code, docs, and conversation.

## Decision

The canonical term for an autonomous worker inside a Mycelium is **Shroom**.

This applies everywhere:
- Code: `Shroom`, `ShroomEvent`, `shroom_id`
- Config: `shrooms:` keys in manifests
- Docs and UI: "Shroom" is both the human-friendly and technical term
- The word "agent" is reserved only when referencing external frameworks (e.g. "Agno agent", "ADK agent")

## Consequences

- All new code uses `Shroom` / `shroom`
- Existing frontend code using `agent` / `ZENIK_SHROOMS` / `ShroomEvent` has been migrated in MYC-20
- Community shroom definitions are called "shroom manifests" or "shroom definitions"
- The north star UI refers to workers as Shrooms throughout
