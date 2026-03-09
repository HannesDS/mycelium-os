## ADDED Requirements

### Requirement: Message endpoint accepts optional session_id for continuity

The control plane SHALL accept an optional `session_id` in the request body of `POST /shrooms/{shroom_id}/message`. When provided and valid, the endpoint SHALL reuse that session for the conversation. When omitted, the endpoint SHALL create a new session and return it in the response.

#### Scenario: First message creates session and returns session_id

- **GIVEN** caller is authenticated as principal `principal_123`
- **WHEN** caller sends `POST /shrooms/sales-shroom/message` with `{"message": "Hello"}` and no session_id
- **THEN** server SHALL create a new Agno session, store binding (principal_123, sales-shroom) -> session_id, and response SHALL include `session_id`

#### Scenario: Subsequent message reuses session when session_id provided and valid

- **GIVEN** caller is authenticated as principal `principal_123` and has an existing binding (principal_123, sales-shroom) -> `session_abc`
- **WHEN** caller sends `POST /shrooms/sales-shroom/message` with `{"message": "Follow up", "session_id": "session_abc"}`
- **THEN** server SHALL use session `session_abc` for the conversation and response SHALL include `session_id: "session_abc"`

#### Scenario: Reject session_id that does not belong to caller

- **GIVEN** caller is authenticated as principal `principal_123`
- **GIVEN** session `session_xyz` is bound to (principal_456, sales-shroom)
- **WHEN** caller sends `POST /shrooms/sales-shroom/message` with `{"message": "Hi", "session_id": "session_xyz"}`
- **THEN** server SHALL respond with 403 Forbidden

#### Scenario: Reject session_id for wrong shroom

- **GIVEN** caller is authenticated as principal `principal_123` and has binding (principal_123, sales-shroom) -> `session_abc`
- **WHEN** caller sends `POST /shrooms/billing-shroom/message` with `{"message": "Hi", "session_id": "session_abc"}`
- **THEN** server SHALL respond with 403 Forbidden

#### Scenario: Reject unauthenticated message when auth is required

- **GIVEN** auth is enabled
- **WHEN** unauthenticated caller sends `POST /shrooms/sales-shroom/message`
- **THEN** server SHALL respond with 401 Unauthorized

### Requirement: Session binding is stored per principal and shroom

The control plane SHALL maintain a binding from (principal_id, shroom_id) to session_id. At most one active binding per (principal_id, shroom_id). When a new session is created for that pair, the binding SHALL be updated to the new session_id.

#### Scenario: New session overwrites previous binding for same principal and shroom

- **GIVEN** binding (principal_123, sales-shroom) -> session_old exists
- **WHEN** caller principal_123 sends a message to sales-shroom without session_id (starting new conversation)
- **THEN** server SHALL create new session session_new and update binding to (principal_123, sales-shroom) -> session_new
