## MODIFIED Requirements

### Requirement: Control plane exposes sessions list endpoint

The control plane SHALL provide `GET /sessions` that returns a list of shroom sessions from Agno storage. The endpoint SHALL require authentication. The endpoint SHALL return only sessions bound to the authenticated principal. The endpoint SHALL support query parameters `status` (active|completed).

#### Scenario: List active sessions

- **GIVEN** caller is authenticated as principal `principal_123`
- **GIVEN** at least one session bound to principal_123 is active (updated within last 5 minutes)
- **WHEN** caller requests `GET /sessions?status=active`
- **THEN** response SHALL include sessions with `status: "active"` bound to principal_123 and SHALL include fields: `session_id`, `shroom_id`, `status`, `started`, `duration`, `message_count`

#### Scenario: List completed sessions

- **GIVEN** caller is authenticated as principal `principal_123`
- **GIVEN** at least one completed session bound to principal_123 exists
- **WHEN** caller requests `GET /sessions?status=completed`
- **THEN** response SHALL include up to 50 most recent completed sessions bound to principal_123 ordered by `updated_at` descending

#### Scenario: Default returns active sessions

- **GIVEN** caller is authenticated
- **WHEN** caller requests `GET /sessions` without status parameter
- **THEN** response SHALL behave as `status=active`

#### Scenario: Unauthenticated request returns 401

- **WHEN** unauthenticated caller requests `GET /sessions`
- **THEN** server SHALL respond with 401 Unauthorized

### Requirement: Control plane exposes session detail endpoint

The control plane SHALL provide `GET /sessions/{session_id}` that returns full session data including message history and metadata. The endpoint SHALL require authentication. The endpoint SHALL return the session only if it is bound to the authenticated principal.

#### Scenario: Retrieve session by ID

- **GIVEN** caller is authenticated as principal `principal_123`
- **GIVEN** session `session_123` exists and is bound to (principal_123, sales-shroom)
- **WHEN** caller requests `GET /sessions/session_123`
- **THEN** response SHALL include `session_id`, `shroom_id`, `message_history` (chronological user/assistant turns), `started`, `ended`, `model`, `token_count` (if available)

#### Scenario: Session not found returns 404

- **GIVEN** caller is authenticated
- **GIVEN** no session exists with id `nonexistent`
- **WHEN** caller requests `GET /sessions/nonexistent`
- **THEN** response SHALL be 404 with appropriate detail

#### Scenario: Session exists but not owned by caller returns 403

- **GIVEN** caller is authenticated as principal `principal_123`
- **GIVEN** session `session_xyz` exists and is bound to (principal_456, sales-shroom)
- **WHEN** caller requests `GET /sessions/session_xyz`
- **THEN** response SHALL be 403 Forbidden

#### Scenario: Unauthenticated request returns 401

- **WHEN** unauthenticated caller requests `GET /sessions/session_123`
- **THEN** server SHALL respond with 401 Unauthorized

### Requirement: Session response includes audit log linkage

The session detail response SHALL include `related_events` — ShroomEvents from the audit log where `metadata.session_id` or `details.session_id` matches the session. This requirement applies only when the caller is authorized to access the session.

#### Scenario: Session detail includes related audit events

- **GIVEN** caller is authenticated and authorized for session `session_123`
- **GIVEN** session `session_123` exists and audit log has entries with `session_id: "session_123"`
- **WHEN** caller requests `GET /sessions/session_123`
- **THEN** response SHALL include `related_events` array with those audit entries in chronological order
