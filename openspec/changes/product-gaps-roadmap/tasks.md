## 1. OpenRouter model provider

- [x] 1.1 Add model provider abstraction (Ollama | OpenRouter) in controller
- [x] 1.2 Add OpenRouter client; resolve `openrouter/<model-id>` from manifest
- [x] 1.3 Read `OPENROUTER_API_KEY` from env; fail clearly if missing when OpenRouter model used
- [x] 1.4 Add `OPENROUTER_API_KEY=` to `.env.example`; ensure `.env` in `.gitignore`
- [x] 1.5 Update README with OpenRouter setup instructions

## 2. Approval notifications

- [x] 2.1 Add pending count to Approvals API or extend existing
- [x] 2.2 Add badge to Approvals nav item when pending > 0
- [x] 2.3 Poll or WebSocket for approval updates; refresh badge
- [ ] 2.4 Consider toast on new approval (optional)

## 3. Traces observability

- [x] 3.1 Extend events/audit schema with token_count, cost_usd, model, trace_id
- [x] 3.2 Capture token/cost from OpenRouter responses
- [x] 3.3 Implement Traces viewer page (MYC-27); query events with filters
- [x] 3.4 Display inter-shroom communications in trace view

## 4. CEO interface

- [x] 4.1 Add CEO-first landing or chat when minimal config
- [x] 4.2 CEO chat: help add shroom, set skills, set prompts
- [x] 4.3 Wire to constitution/manifest updates (read-only or MYC-36 scope)

## 5. Skills catalog and allow-list

- [x] 5.1 Define skills catalog (web_browser, email, github, etc.)
- [x] 5.2 Add allow-list check before tool execution in controller
- [x] 5.3 Add skills overview UI: list skills, which shrooms have access
- [ ] 5.4 Add UI to assign skills to shrooms (manifest update)

## 6. Web browser tool

- [x] 6.1 Add Playwright (or similar) as dependency
- [x] 6.2 Implement web_browser tool: navigate, read, limited interact
- [x] 6.3 Register as skill; sandbox (headless, no persistent state)
- [x] 6.4 Add to skills catalog; allow-list enforcement

## 7. MCP runtime

- [ ] 7.1 Add MCP client dependency
- [ ] 7.2 Resolve manifest `mcps` to MCP server config/URLs
- [ ] 7.3 Connect to MCP servers; inject tools into Agno agent
- [ ] 7.4 Allow-list: only shrooms with MCP in manifest get those tools

## 8. Prompt-injection hardening

- [x] 8.1 Tag external data (email, web) as untrusted in context
- [x] 8.2 Add delimiters and instructions for untrusted blocks
- [x] 8.3 Sanitize email: strip scripts, limit length
- [x] 8.4 Validate shroom output before proposing actions

## 9. A2A Agent Card

- [x] 9.1 Add a2a-sdk or equivalent
- [x] 9.2 Implement `GET /shrooms/{id}/.well-known/agent-card.json`
- [x] 9.3 Map manifest to AgentCard (name, description, url, skills as AgentSkill)
- [x] 9.4 Document A2A discovery for inter-shroom (optional: A2A client for routing)
