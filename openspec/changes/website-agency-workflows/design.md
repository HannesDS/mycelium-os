## Context

Mycelium OS control plane uses Agno for shroom execution. Chat fails when Ollama model is unavailable or misconfigured; OpenRouter is supported but chat may not be wired correctly. Skills are defined in manifest only; no assignment UI. CEO shroom name conflicts with human CEO. No workflow engine; no per-shroom overview page.

## Goals / Non-Goals

**Goals:**
- Chat works with OpenRouter (cheap model) and local Ollama
- Captain shroom (renamed from CEO) as head-of-shrooms
- Skills assignment UI and persistence
- Per-shroom overview: config, chat, skills
- Workflows (Agno-based) between shrooms; YAML/code definitions; chat-created
- Auto-triggered workflows on events
- Website agency shrooms: front-end engineer, QA, sales/marketer

**Non-Goals:**
- Full Cursor IDE integration (defer to MCP or tool)
- Production email delivery (Mailhog for dev; real SMTP later)
- Git repo write access (read-first; write via proposals)

## Decisions

### Chat model resolution
- **Choice**: Prefer OpenRouter when `OPENROUTER_API_KEY` is set; fallback to Ollama. Default model for chat: `openrouter/openai/gpt-4o-mini` or `mistral:latest` (Ollama).
- **Rationale**: User wants cheap model; OpenRouter offers pay-per-use. Local Ollama for offline.
- **Alternative**: Single provider only — rejected; flexibility needed.

### Captain rename
- **Choice**: Rename `root-shroom` → `captain-shroom` in manifest, nav, routes, controller. Display name "Captain".
- **Rationale**: Human is CEO; shroom is operational head.
- **Alternative**: "Coordinator", "Lead" — Captain is concise and implies leadership of shrooms.

### Skills persistence
- **Choice**: DB table `shroom_skill_overrides (shroom_id, skill_id, enabled)`; merge with manifest skills at runtime. Manifest remains source of truth for new shrooms.
- **Rationale**: Manifest is version-controlled; overrides allow runtime changes without editing YAML.
- **Alternative**: Edit manifest via API — rejected for MVP; file write is risky.

### Shroom overview page
- **Choice**: `/shrooms/[id]` detail page with tabs/sections: Config (read-only manifest), Chat (inline), Skills (assign/reassign).
- **Rationale**: Single place for all shroom management.

### Workflow engine
- **Choice**: Use Agno `Workflow` with shrooms as steps. Workflow definitions in YAML under `workflows/`; load at startup. Trigger by NATS event or API.
- **Rationale**: Agno workflows align with existing stack; YAML is declarative.
- **Alternative**: Custom DAG — rejected; Agno provides orchestration.

### Workflow creation via chat
- **Choice**: Captain (or dedicated workflow-shroom) can propose workflow YAML; human approves; system persists to `workflows/`. MVP: manual YAML add; chat outputs snippet for copy-paste.
- **Rationale**: Full chat-to-persist requires approval flow; snippet is simpler for MVP.

### Auto-workflows
- **Choice**: Event listener on NATS `mycelium.events`; match patterns (e.g. `topic=website_confirmed`); start workflow by name.
- **Rationale**: Event-driven; no polling.

## Risks / Trade-offs

- **[Risk]** Agno Workflow API may differ from docs → Mitigation: Spike early; fallback to sequential Python if needed
- **[Risk]** Skills overrides add complexity → Mitigation: Keep merge logic simple; document override precedence
- **[Risk]** Captain rename touches many files → Mitigation: Grep for root-shroom; batch replace; test constitution load

## Migration Plan

1. Add `shroom_skill_overrides` migration
2. Rename root-shroom → captain-shroom (manifest, examples, nav, routes)
3. Add workflow loader; register workflows
4. Add NATS event listener for auto-workflows
5. Deploy; verify chat with OpenRouter and Ollama

## Open Questions

- Exact Agno Workflow API for multi-shroom steps
- Cursor/programming tool: MCP server or custom tool?
