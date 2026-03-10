## 1. Auth layer (minimal dev auth)

- [ ] 1.1 Add dev auth: API key or env var for principal_id; FastAPI dependency that returns principal or raises 401
- [ ] 1.2 Apply auth dependency to sessions router and message endpoint (or feature-flag for MVP)

## 2. Session binding storage

- [ ] 2.1 Add Alembic migration for `session_bindings` table (principal_id, shroom_id, session_id, created_at, unique on principal_id+shroom_id)
- [ ] 2.2 Add repository/service to upsert and lookup bindings

## 3. Message endpoint session binding

- [ ] 3.1 Add optional `session_id` to MessageRequest; require auth
- [ ] 3.2 On message without session_id: create Agno session, upsert binding, return session_id
- [ ] 3.3 On message with session_id: verify binding (principal, shroom) matches; reuse or 403
- [ ] 3.4 Add tests for session binding scenarios (create, reuse, reject foreign, reject wrong shroom)

## 4. Sessions API auth and filtering

- [ ] 4.1 Add auth dependency to GET /sessions and GET /sessions/{id}
- [ ] 4.2 Filter sessions list by principal (join with session_bindings)
- [ ] 4.3 For GET /sessions/{id}: verify session is bound to caller; 403 if not
- [ ] 4.4 Add tests for 401 unauthenticated, 403 unauthorized session access

## 5. Frontend session continuity

- [ ] 5.1 Persist session_id from MessageResponse in chat component state
- [ ] 5.2 Send session_id in subsequent message requests when available
- [ ] 5.3 Handle 401/403 (show error, optionally clear session and retry as new)
