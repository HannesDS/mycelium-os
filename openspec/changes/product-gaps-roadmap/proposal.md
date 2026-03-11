## Why

Mycelium OS is built for AI-native businesses. The current MVP has a demo flow but lacks production readiness: model choice is Ollama-only (no OpenRouter), no CEO-first onboarding, no full traces/observability, no real tool integrations (web, email, MCP), weak approval visibility, and agent-to-agent communication uses custom NATS events instead of a standard protocol. A founder spinning up Mycelium to run their business needs: (1) any model via OpenRouter with secure token handling, (2) a CEO interface to declare and configure shrooms, (3) full traceability for audit and cost, (4) real skills and tool allow-lists per shroom, (5) airtight prompt-injection defence, (6) visible approval notifications, and (7) A2A-compliant inter-shroom communication.

## Backlog / Spec Gap Analysis

| Backlog item | Status | Gap |
|--------------|--------|-----|
| MYC-27 Traces viewer | Spec'd | Not implemented; needs tokens, costs, inter-agent comms |
| MYC-29 Knowledge base | Blocked TBD-3 | No spec; not yet designed |
| MYC-31 Evaluation dashboard | Phase 2 | No spec |
| MYC-32 Scheduler | Phase 2 | No spec |
| MYC-36 CEO-guided constitution | Post-V1 | No spec; CEO interface not designed |
| Settings (Models, MCP) | Nav only | No spec; no OpenRouter, no model selection UI |
| MCP / tools | Manifest fields only | No runtime wiring; no web browser, no allow-list enforcement |
| Skills / capabilities | Manifest strings | No catalog, no assign UI, no A2A Agent Card |
| Approval notifications | Not in backlog | No badge, no popup, no real-time alert |
| A2A protocol | Not in backlog | Inter-shroom uses NATS; no Agent Card, no `.well-known` |

## What Changes

- **Model provider**: Add OpenRouter as a provider; support any OpenRouter model via `model: openrouter/<model-id>`; token from `OPENROUTER_API_KEY` env (never in repo). Keep Ollama for local dev.
- **CEO-first interface**: Add CEO chat or landing flow that helps configure shrooms, skills, prompts, knowledge. On first spin-up, CEO or a clear "declare features" UI is the entry point.
- **Traces**: Implement MYC-27 with full observability: agent, queries, tokens, costs, inter-agent comms. Extend event log with token/cost metadata.
- **Tools & skills**: Add web browser as a skill/tool; MCP runtime wiring; skills/capabilities catalog; UI to assign skills to shrooms; allow-list enforcement (e.g. maker: web, email; developer: claude, github).
- **Security**: Harden prompt-injection defence for email and other external data; tag untrusted content; validate output before actions.
- **Approval visibility**: Add badge, notification, or popup when new approvals pending; remove or replace "Trigger escalation" with real approval flow.
- **A2A**: Expose Agent Card at `.well-known/agent-card.json` per shroom; use A2A for inter-shroom communication where applicable; map skills to AgentSkill.

## Capabilities

### New Capabilities

- `openrouter-models`: Model provider abstraction; OpenRouter support; env-based API key; no tokens in repo
- `ceo-interface`: CEO-first chat or landing; declare features; configure shrooms, skills, prompts, knowledge
- `traces-observability`: Full traces: agent, queries, tokens, costs, inter-agent comms. Extend events/audit.
- `skills-catalog`: Catalog of skills and capabilities; assign to shrooms; allow-list enforcement
- `tool-web-browser`: Web browser as a skill/tool for shrooms
- `mcp-runtime`: MCP connector runtime; wire manifest `mcps` to actual tools
- `prompt-injection-hardening`: Tag untrusted content; validate outputs; email-specific hardening
- `approval-notifications`: Badge, popup, or real-time alert for pending approvals
- `a2a-agent-card`: Expose Agent Card at `.well-known/agent-card.json`; A2A-compliant inter-shroom comms

### Modified Capabilities

- `sessions-api`: Extend with token/cost metadata for traces
- `sessions-ui`: Extend for traces linkage

## Impact

- **Control plane**: New model provider layer; OpenRouter client; A2A server; Agent Card endpoint; MCP runtime; traces schema
- **Frontend**: CEO interface; settings for model selection; approval notifications; skills catalog UI
- **Manifest**: Extend `model` to support `openrouter/...`; `skills`/`mcps` remain; allow-list semantics
- **Constitution**: CEO-guided evolution (MYC-36) design
- **Dependencies**: OpenRouter SDK or HTTP client; A2A SDK (a2a-sdk); MCP server/client
- **Security**: `.env` and `.env.example` template for `OPENROUTER_API_KEY`; no token in repo
