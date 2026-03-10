## 1. Control Plane — Agno Session Storage

- [x] 1.1 Add PostgresDb to Agent creation in controller (use DATABASE_URL, session_table agno_sessions)
- [x] 1.2 Verify agno_sessions table is created on first agent run (or add migration if needed)

## 2. Control Plane — Sessions API

- [x] 2.1 Create routers/sessions.py with GET /sessions (status=active|completed, aggregate across shrooms)
- [x] 2.2 Implement GET /sessions/{session_id} returning message history and metadata
- [x] 2.3 Add related_events to session detail (query audit log by session_id in details)
- [x] 2.4 Register sessions router in main.py
- [x] 2.5 Add Pydantic response models for session list and detail

## 3. Frontend — Sessions Page

- [x] 3.1 Create /sessions route and SessionsPage component
- [x] 3.2 Implement SessionList component with Active/Completed tabs
- [x] 3.3 Implement SessionDetail component with message history and metadata
- [x] 3.4 Add 10s auto-refresh for Active tab (client-side fetch)
- [x] 3.5 Enable Sessions in nav-items.ts (enabled: true)

## 4. Frontend — API Integration

- [x] 4.1 Add sessions API client (fetch from control plane /sessions and /sessions/{id})
- [x] 4.2 Wire SessionList to GET /sessions with status param
- [x] 4.3 Wire SessionDetail to GET /sessions/{id} and display related_events links

## 5. Storybook & Tests

- [x] 5.1 Add SessionList Storybook story with mock data
- [x] 5.2 Add SessionDetail Storybook story with mock message history
- [x] 5.3 Add control plane tests for GET /sessions and GET /sessions/{id}
