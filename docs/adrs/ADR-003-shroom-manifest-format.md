# ADR-003 — Shroom manifest: declarative K8s-style with pluggable controllers

**Status:** Accepted  
**Date:** 2026-03-07  
**Deciders:** Hannes De Smet

## Context

We needed to decide how a shroom is defined — YAML config, Python/TS class, or both. The answer shapes what the runtime does with a shroom definition and whether shroom definitions can be shared without code.

## Decision

Each shroom is defined by a **declarative manifest file** — a YAML resource definition modelled after Kubernetes resource definitions.

### Manifest format

```yaml
apiVersion: mycelium.io/v1
kind: Shroom
metadata:
  id: sales-shroom
  name: "Sales Development"
spec:
  model: mistral-7b
  memory:
    beads: true           # episodic short-term memory
    rag: personal         # long-term case memory
  rag_access:
    - namespace: company-wiki
      role: sales
  inbox:
    schema: ./schemas/sales-inbox.json
  skills:
    - lead_qualification
    - proposal_drafting
  mcps:
    - crm
    - email
  api:
    enabled: true
    port: auto
  can:
    - read: [crm, emails]
    - propose: [send_email, book_meeting]
  cannot:
    - execute: [send_email, payments]
  escalates_to: ceo-shroom
  sla_response_minutes: 60
```

### mycelium.yaml

`mycelium.yaml` describes the **Mycelium itself** — name, instance, graph edges, shared RAG namespaces and role access rules. Shroom manifests are separate files, composable and independently versioned.

### Controllers

Mycelium OS ships a **default controller** that knows how to instantiate any valid `Shroom` manifest. In the future, users can write **custom controllers** — same manifest contract, different runtime behaviour (e.g. a controller using a different memory backend or tool runner). This is the Kubernetes CRD + custom controller pattern applied to shrooms.

## Consequences

- No code required for most users — declare a shroom, the controller runs it
- Community shroom definitions are just manifests — shareable without code
- The manifest schema is the stable contract. The controller is pluggable underneath
- Custom controllers are a Phase 2 extension point
- `mycelium.yaml` schema must be extended to reference shroom manifest files (tracked in MYC-21)
- JSON Schema validation for manifests is tracked in MYC-21
