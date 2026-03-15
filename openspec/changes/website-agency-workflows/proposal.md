## Why

Operators need a working, end-to-end agency that can deliver static frontend websites. Today: chat fails (model connectivity), skills cannot be assigned, there is no per-shroom overview, no workflows, and the "CEO" shroom name conflicts with the human CEO role. This change delivers a website-agency MVP with workflows, shroom management, and fixed chat.

## What Changes

- **Fix chat**: Ensure chat works with OpenRouter (cheap model) when `OPENROUTER_API_KEY` is set; fix local Ollama fallback when mistral is pulled
- **Rename CEO shroom**: Human is the CEO. Rename the head-of-shrooms shroom to "Captain" (or equivalent) across manifest, UI, and code
- **Skills assignment**: Add UI to assign and reassign skills to shrooms; persist to manifest or DB
- **Shroom overview page**: Per-shroom detail view with config, inline chat, and skills assignment
- **Workflows**: Declarative workflows between shrooms (Agno-based), defined as code or YAML, creatable via chat
- **Default workflows**: Auto-triggered workflows (e.g. when customer confirms website request)
- **Website agency shrooms**: Front-end engineer (Cursor/programming tools, repo access), QA engineer (testing best practices), Sales/marketer (email, intake, client mailbox)

## Capabilities

### New Capabilities

- `chat-fix`: Chat works with OpenRouter and local Ollama; clear errors when model unavailable
- `captain-rename`: Rename CEO shroom to Captain shroom; update manifest, nav, routes, docs
- `skills-assignment`: UI and API to assign/reassign skills to shrooms; persist to manifest or DB
- `shroom-overview`: Per-shroom detail page with config, chat, skills assignment
- `workflows`: Workflow engine (Agno-based) for multi-step processes between shrooms; code/yaml definitions
- `workflow-chat`: Create workflows via chat interface (Captain or dedicated)
- `website-agency-shrooms`: Front-end engineer, QA engineer, Sales/marketer shrooms with appropriate skills and tools
- `auto-workflows`: Default workflows triggered automatically by events (e.g. customer confirms website)

### Modified Capabilities

- (none)

## Impact

- Control plane: controller, router, manifest loading, constitution
- Frontend: nav, routes, pages (shroom detail, skills, CEO→Captain), chat component
- New: workflow engine, workflow definitions, event triggers
- Manifest schema: optional skills override (if DB-backed)
- Dependencies: Agno workflows, optional OpenRouter for chat
