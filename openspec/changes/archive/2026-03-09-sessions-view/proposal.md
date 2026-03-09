## Why

Agno manages sessions natively — each shroom conversation has a session ID, history, and state stored in the database. Without a sessions view, there's no way to see what's running, what completed, or debug why a shroom behaved a certain way. This is the operational view of shroom execution.

**Linear:** [MYC-28](https://linear.app/mycellium-os/issue/MYC-28/feature-sessions-view-active-and-completed-shroom-sessions)

## What Changes

- New `/sessions` page in the frontend with Active and Completed tabs
- Control plane endpoints: `GET /sessions` and `GET /sessions/{id}` proxying Agno session storage
- Session list: session ID, shroom ID, status (active/completed/error), started, duration, message count
- Session detail: full message history, metadata (shroom ID, model, start/end, token count), linked ShroomEvents from audit log
- Active sessions auto-refresh every 10s
- Storybook stories for SessionList and SessionDetail

## Capabilities

### New Capabilities

- `sessions-api`: Control plane REST API for listing and retrieving shroom sessions from Agno storage
- `sessions-ui`: Frontend sessions page with list view, detail view, and audit log linkage

### Modified Capabilities

- (none)

## Impact

- **control-plane**: New sessions router, Agno session storage integration (Postgres for docker-compose per OPEN-QUESTIONS.md recommendation)
- **frontend**: New `/sessions` route, SessionList, SessionDetail components
- **ShroomEvent schema**: `metadata.session_id` used to link events to sessions (already supported per docs/design/SHROOM-EVENT-SCHEMA.md)
- **Dependencies**: MYC-22 (control plane + Agno runtime) — sessions are created by Agno
