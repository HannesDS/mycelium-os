## Context

- Current: Ollama-only models (ADR-007), no OpenRouter; CEO is a shroom but no CEO-first UI; traces (MYC-27) not implemented; skills/mcps are manifest strings with no runtime; approvals exist but no notifications; inter-shroom via NATS custom events.
- Constraints: Control vs data plane (CLAUDE.md); shrooms propose, humans decide; audit before NATS; no tokens in repo.
- Stakeholders: Founder/operator running an AI-native business; needs production-ready setup.

## Goals / Non-Goals

**Goals**

- OpenRouter as model provider; any OpenRouter model; API key via env only.
- CEO-first interface for declaring and configuring shrooms.
- Full traces: agent, query, tokens, costs, inter-agent comms.
- Skills catalog; tool allow-lists; web browser skill; MCP runtime.
- Prompt-injection hardening for email and external data.
- Approval notifications (badge, popup, or alert).
- A2A Agent Card and inter-shroom A2A where applicable.

**Non-Goals**

- Full A2A replacement of NATS (hybrid: A2A for discovery/routing, NATS for internal events is acceptable).
- Multi-tenant auth (post-MVP).
- Knowledge base implementation (TBD-3 blocks MYC-29).

## Decisions

### 1. Model provider abstraction

**Decision**: Introduce `ModelProvider` enum/registry: `ollama`, `openrouter`. Manifest `model` supports `openrouter/<model-id>` (e.g. `openrouter/anthropic/claude-3.5-sonnet`). Resolver checks prefix; if `openrouter/`, use OpenRouter client with `OPENROUTER_API_KEY`. Ollama remains default for `mistral-7b` etc.

**Alternatives**: Single OpenRouter-only (loses local dev); keep Ollama-only (doesn't meet requirement).

### 2. Token handling

**Decision**: `OPENROUTER_API_KEY` in `.env`; `.env.example` has `OPENROUTER_API_KEY=` (empty); `.gitignore` already excludes `.env`. No token in code, config, or manifests. Add to README: "Set OPENROUTER_API_KEY for OpenRouter models."

**Alternatives**: Vault/secrets manager (overkill for MVP); config file (risk of commit).

### 3. CEO interface

**Decision**: Phase 1: CEO chat as primary entry when no shrooms configured, or a "Setup" / "Declare features" mode. Chat helps: add shroom, set skills, set prompts. Phase 2: CEO-guided constitution evolution (MYC-36) with dual persistence.

**Alternatives**: Static wizard (less flexible); no CEO mode (doesn't meet requirement).

### 4. Traces schema

**Decision**: Extend `events` / audit log with `token_count`, `cost_usd`, `model`, `trace_id`. Traces viewer (MYC-27) queries this. Agno/OpenRouter responses can provide token counts; cost from OpenRouter pricing or config.

**Alternatives**: Separate traces DB (more complexity); Phoenix only (TBD-4 open).

### 5. Skills and allow-lists

**Decision**: Skills catalog = registry of skill IDs (e.g. `web_browser`, `email`, `github`, `cursor`). Manifest `skills` and `mcps` reference these. Runtime: before tool execution, check shroom's allow-list. Deny if not in list.

**Alternatives**: No allow-list (insecure); full RBAC (overkill for MVP).

### 6. Web browser skill

**Decision**: Integrate Playwright or similar as a tool. Register as skill `web_browser`; only shrooms with that skill can use it. Sandbox: headless, no persistent state by default.

**Alternatives**: Puppeteer (Node); raw requests (no JS rendering).

### 7. MCP runtime

**Decision**: Use MCP Python client to connect to MCP servers. Manifest `mcps` list server names; control plane resolves to URLs/config; inject tools into Agno agent. Allow-list: only shrooms with that MCP in manifest get those tools.

**Alternatives**: Custom tool protocol; defer MCP (blocks requirement).

### 8. Prompt-injection hardening

**Decision**: Tag all external inputs (email, web content) as `untrusted` in context. Use delimiters and clear instructions. Validate outputs before proposing actions. For email: sanitize, strip scripts, limit length.

**Alternatives**: No hardening (risky); full LLM-based filter (costly).

### 9. Approval notifications

**Decision**: Frontend: poll or WebSocket for pending count; show badge on Approvals nav; optional toast when new approval arrives. Remove or repurpose "Trigger escalation" button: either keep for demo or replace with "Create demo approval" in settings.

**Alternatives**: Email notifications (not in scope); no UI change (doesn't meet requirement).

### 10. A2A Agent Card

**Decision**: Expose `GET /.well-known/agent-card.json` per shroom (or `GET /shrooms/{id}/.well-known/agent-card.json`). Map manifest to AgentCard: name, description, url, skills (as AgentSkill). Inter-shroom: A2A client for discovery; can keep NATS for internal event fan-out. Use a2a-sdk Python.

**Alternatives**: Full A2A replace NATS (big change); no A2A (doesn't meet requirement).

## Risks / Trade-offs

- **OpenRouter cost**: Usage is billable. Mitigation: document; optional per-shroom; allow Ollama for dev.
- **Web browser complexity**: Playwright adds deps and sandboxing. Mitigation: optional skill; disable by default.
- **A2A vs NATS**: Hybrid may add complexity. Mitigation: A2A for discovery only; NATS for events.
- **CEO interface scope**: Could grow. Mitigation: Phase 1 = chat + basic config; Phase 2 = full MYC-36.

## Migration Plan

1. Add OpenRouter model provider; no breaking change to existing Ollama manifests.
2. Add CEO interface; no breaking change.
3. Extend events/audit for traces; backfill not required.
4. Add skills catalog and allow-list; existing manifests may need migration if skills change.
5. Add approval notifications; no breaking change.
6. Add A2A Agent Card; additive.

Rollback: Feature flags; revert frontend; keep Ollama as default.

## Open Questions

- Exact OpenRouter model ID format and mapping.
- A2A SDK maturity and Python support.
- Web browser sandbox limits (e.g. max pages, timeouts).
- Cost tracking: OpenRouter pricing API or static config.
