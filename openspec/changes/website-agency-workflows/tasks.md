## 1. Chat fix

- [ ] 1.1 Verify OpenRouter path: ensure chat uses openrouter model when OPENROUTER_API_KEY set; add default model config
- [ ] 1.2 Fix Ollama model resolution: ensure mistral:latest works when pulled; improve error message with exact ollama pull command
- [ ] 1.3 Add chat connectivity check on frontend: show clear error when control plane unreachable

## 2. Captain rename

- [ ] 2.1 Rename root-shroom to captain-shroom in examples/shrooms/ and mycelium.yaml
- [ ] 2.2 Update graph edges in mycelium.yaml: escalates_to captain-shroom
- [ ] 2.3 Rename /ceo route to /captain; update nav item label to "Captain"
- [ ] 2.4 Update controller system prompt: captain-shroom gets setup instructions (not root-shroom)
- [ ] 2.5 Update all code references: root-shroom → captain-shroom (routers, tests, frontend)

## 3. Skills assignment

- [ ] 3.1 Add Alembic migration for shroom_skill_overrides (shroom_id, skill_id, enabled)
- [ ] 3.2 Add repository/service for skill overrides: upsert, list, delete
- [ ] 3.3 Merge manifest skills with overrides in controller; use merged list for tool filtering
- [ ] 3.4 Add PATCH /shrooms/{id}/skills API: body { add: [], remove: [] }
- [ ] 3.5 Add skills assignment UI to Skills page: checkboxes or toggle per shroom per skill
- [ ] 3.6 Add skills section to shroom overview page with assign/remove

## 4. Shroom overview page

- [ ] 4.1 Create /shrooms/[id] dynamic route
- [ ] 4.2 Add Config section: display manifest (model, skills, escalates_to, can/cannot)
- [ ] 4.3 Add inline Chat section: reuse ChatThread, send to this shroom
- [ ] 4.4 Add Skills section: assign/remove skills (from task 3.6)
- [ ] 4.5 Add link from Shrooms list and Organisation graph to shroom overview

## 5. Workflows

- [ ] 5.1 Spike Agno Workflow API: verify multi-shroom step support
- [ ] 5.2 Add workflows/ directory; define workflow YAML schema
- [ ] 5.3 Add workflow loader: load YAML at startup, register workflows
- [ ] 5.4 Add POST /workflows/{name}/run endpoint; execute workflow, return result
- [ ] 5.5 Wire Agno Workflow to shroom agents (map shroom_id to Agent)

## 6. Workflow chat

- [ ] 6.1 Add workflow-creation instructions to Captain system prompt
- [ ] 6.2 Captain outputs valid workflow YAML snippet when asked; document save path

## 7. Website agency shrooms

- [ ] 7.1 Create front-end-engineer-shroom manifest: web_browser, code execution or MCP, repo read
- [ ] 7.2 Create qa-engineer-shroom manifest: testing skills
- [ ] 7.3 Create sales-marketer-shroom manifest: email, intake, mailbox config
- [ ] 7.4 Add manifests to mycelium.yaml; add graph edges

## 8. Auto-workflows

- [ ] 8.1 Add NATS event listener for workflow triggers; match topic/payload patterns
- [ ] 8.2 Add workflow trigger config: topic → workflow name mapping
- [ ] 8.3 Implement website_confirmed workflow: trigger when topic=website_confirmed
- [ ] 8.4 Wire sales shroom to emit website_confirmed when customer confirms
