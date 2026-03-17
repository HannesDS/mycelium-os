# ADR-003: Shroom Manifest Format (mycelium.yaml)

**Date:** 2026-03-07  
**Status:** Accepted  
**Deciders:** Hannes Desmet

---

## Context

We needed a human-readable, version-controllable format for defining shrooms — their identity, permissions, escalation paths, and SLAs. This is the "constitution" of the org.

## Decision

Shrooms are declared in `mycelium.yaml` using the following schema:

```yaml
company:
  name: "Acme AI Co"
  instance: production  # dev | staging | production

shrooms:
  - id: sales-shroom
    role: "Sales Development"
    model: mistral-7b
    can:
      - read: [crm, emails]
      - write: [draft_emails, crm_notes]
      - propose: [send_email, book_meeting]
    cannot:
      - execute: [send_email, payments]
    escalates_to: root-shroom
    sla_response_minutes: 60

graph:
  edges:
    - from: sales-shroom
      to: root-shroom
      type: reports-to
      # types: reports-to | requests-from | monitors | triggers | collaborates-with
```

## Consequences

- `mycelium.yaml` is the single source of truth. No shroom exists that is not declared here.
- The control plane parses this file on startup and on change (hot reload in dev, rolling restart in prod)
- The constitution viewer (MYC-30) renders this file in the UI
- Schema v1 is formalised in MYC-21 (JSON Schema / Pydantic model)
- **Never** use `agents:` key — always `shrooms:`

## Rationale

- YAML is human-readable and diff-friendly for version control
- Explicit `can` / `cannot` makes the permission model visible without reading code
- `escalates_to` is a first-class field — escalation is not an afterthought
- The `graph.edges` section separates topology from capabilities
