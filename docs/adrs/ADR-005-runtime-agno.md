# ADR-005 — Runtime: Agno

**Status:** Accepted  
**Date:** 2026-03-07  
**Deciders:** Hannes De Smet

## Context

We evaluated five agentic runtime candidates against Mycelium OS requirements:
- Self-hosted EU infrastructure
- Mistral/Ollama native support (no Google/OpenAI dependency)
- Logical isolation sufficient for MVP (K8s namespace isolation deferred — see ADR-008)
- Per-shroom memory + RAG (see ADR-004)
- Pluggable, manifest-based shroom definitions (see ADR-003)
- MCP support
- No SaaS-only observability dependencies

**Candidates evaluated:** ADK (Google), Agno, ARK (McKinsey), LangChain, LangGraph

## Decision

**Agno** is the selected runtime for the Mycelium OS data plane.

### Why Agno

- Built-in multi-layer memory (maps directly to ADR-004 — episodic + RAG out of the box)
- Native Mistral/Ollama support — no adapter needed
- FastAPI per-agent maps directly to "each shroom has its own API endpoint" requirement
- MCP support out of the box
- Self-hosted, EU-friendly, Apache 2.0
- AgentOS UI provides built-in observability during development
- No Kubernetes required for MVP — logical process isolation is sufficient

### Why not the others

| Candidate | Reason eliminated |
|---|---|
| **ADK** | Optimised for Gemini/GCP; GCP gravity is a strategic risk; declarative manifest support less mature |
| **ARK** | Requires Kubernetes — we decided logical isolation is sufficient for MVP (ADR-008) |
| **LangChain** | A toolbox, not a runtime — we'd build everything ourselves |
| **LangGraph** | LangSmith observability is SaaS-only; no declarative manifest; no native Beads-style memory |

### Architecture

```
NATS event bus  ←── Shroom emits ShroomEvent after execution
      ↑
Agno agent      ←── Executes shroom logic (model call, tool use, memory read/write)
      ↑
Mycelium controller ←── Reads shroom manifest, instantiates Agno agent
```

**NATS sits above Agno as the event bus.** Agno handles shroom execution. After execution, the shroom emits a structured event to NATS. The frontend subscribes via WebSocket bridge. These are complementary, not competing.

The **declarative manifest layer** (ADR-003) is built on top of Agno — the Mycelium controller reads the manifest and instantiates the appropriate Agno agent. Agno does not know about manifests.

## Consequences

- Control plane must include an Agno adapter / shroom controller
- Agno is Python-native → control plane language is Python/FastAPI (see ADR-006)
- K8s namespace isolation is deferred to Phase 2
- Agno's AgentOS UI is available in development
- Phoenix (Arize) is the target for production LLM observability — integration TBD
