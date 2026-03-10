## ADDED Requirements

### Requirement: Control plane exposes sessions list endpoint

The control plane SHALL provide `GET /sessions` that returns a list of shroom sessions from Agno storage. The endpoint SHALL support query parameters `status` (active|completed) and SHALL return sessions for all registered shrooms.

#### Scenario: List active sessions

- **GIVEN** at least one shroom has an active session (updated within last 5 minutes)
- **WHEN** client requests `GET /sessions?status=active`
- **THEN** response SHALL include sessions with `status: "active"` and SHALL include fields: `session_id`, `shroom_id`, `status`, `started`, `duration`, `message_count`

#### Scenario: List completed sessions

- **GIVEN** at least one completed shroom session exists
- **WHEN** client requests `GET /sessions?status=completed`
- **THEN** response SHALL include up to 50 most recent completed sessions ordered by `updated_at` descending

#### Scenario: Default returns active sessions

- **WHEN** client requests `GET /sessions` without status parameter
- **THEN** response SHALL behave as `status=active`

### Requirement: Control plane exposes session detail endpoint

The control plane SHALL provide `GET /sessions/{session_id}` that returns full session data including message history and metadata.

#### Scenario: Retrieve session by ID

- **GIVEN** a session exists with id `session_123`
- **WHEN** client requests `GET /sessions/session_123`
- **THEN** response SHALL include `session_id`, `shroom_id`, `message_history` (chronological user/assistant turns), `started`, `ended`, `model`, `token_count` (if available)

#### Scenario: Session not found returns 404

- **GIVEN** no session exists with id `nonexistent`
- **WHEN** client requests `GET /sessions/nonexistent`
- **THEN** response SHALL be 404 with appropriate detail

### Requirement: Session response includes audit log linkage

The session detail response SHALL include `related_events` — ShroomEvents from the audit log where `metadata.session_id` or `details.session_id` matches the session.

#### Scenario: Session detail includes related audit events

- **GIVEN** session `session_123` exists and audit log has entries with `session_id: "session_123"`
- **WHEN** client requests `GET /sessions/session_123`
- **THEN** response SHALL include `related_events` array with those audit entries in chronological order
