# ADR-002 — Primitives-first: no pre-built shrooms in the platform

**Status:** Accepted  
**Date:** 2026-03-07  
**Deciders:** Hannes De Smet

## Context

We needed to decide whether Mycelium OS ships with pre-defined shroom roles (CEO, sales, delivery, etc.) or provides only the building blocks for users to define their own.

Pre-built shrooms would make onboarding faster but would constrain what a Mycelium can be and pollute the core platform with opinionated defaults.

## Decision

Mycelium OS provides **primitives only** — the manifest format, runtime contract, and governance layer. It does NOT ship pre-built shrooms.

Each Mycelium is unique, defined by its creator. Pre-built shrooms (e.g. a "sales-shroom", "legal-shroom") are a **community layer** — open source, shareable, versioned definitions that anyone can publish and reuse. This is a Phase 2 ecosystem play, not a platform feature.

## Consequences

- The platform is infinitely flexible — no opinionated defaults about what roles exist
- The MVP 5 shrooms (sales, delivery, billing, compliance, ceo) are **example definitions**, not platform defaults. They live in `examples/shrooms/` not in platform code
- Enables a community shroom registry in the future
- A future "starter kit" of shroom manifests can be added as optional scaffolding without polluting the core primitives
- Onboarding requires more upfront work from users — mitigated by good docs and examples
