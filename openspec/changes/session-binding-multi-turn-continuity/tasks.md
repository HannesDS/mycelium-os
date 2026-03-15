## 1. Auth layer (minimal dev auth)

- [x] 1.1 Add dev auth: API key or env var for principal_id; FastAPI dependency that returns principal or raises 401
- [x] 1.2 Apply auth dependency to sessions router and message endpoint (or feature-flag for MVP)

## 2. Session binding storage

- [x] 2.1 Add Alembic migration for `session_bindings` table (principal_id, shroom_id, session_id, created_at, unique on principal_id+shroom_id)
- [x] 2.2 Add repository/service to upsert and lookup bindings

## 3. Message endpoint session binding

- [x] 3.1 Add optional `session_id` to MessageRequest; require auth
- [x] 3.2 On message without session_id: create Agno session, upsert binding, return session_id
- [x] 3.3 On message with session_id: verify binding (principal, shroom) matches; reuse or 403
- [x] 3.4 Add tests for session binding scenarios (create, reuse, reject foreign, reject wrong shroom)

## 4. Sessions API auth and filtering

- [x] 4.1 Add auth dependency to GET /sessions and GET /sessions/{id}
- [x] 4.2 Filter sessions list by principal (join with session_bindings)
- [x] 4.3 For GET /sessions/{id}: verify session is bound to caller; 403 if not
- [x] 4.4 Add tests for 401 unauthenticated, 403 unauthorized session access

## 5. Frontend session continuity

- [x] 5.1 Persist session_id from MessageResponse in chat component state
- [x] 5.2 Send session_id in subsequent message requests when available
- [x] 5.3 Handle 401/403 (show error, optionally clear session and retry as new)
