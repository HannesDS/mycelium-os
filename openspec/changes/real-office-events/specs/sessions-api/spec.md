## ADDED Requirements

### Requirement: Control plane exposes session message endpoint for task execution

The control plane SHALL provide `POST /sessions/{session_id}/messages` that accepts `{ "content": string }` and triggers shroom execution for that session. The endpoint SHALL return the assistant response and SHALL persist the message exchange in the session.

#### Scenario: Post message to session

- **GIVEN** session `sess-1` exists for `ceo-shroom`
- **WHEN** client calls `POST /sessions/sess-1/messages` with `{ "content": "Review the Triodos proposal" }`
- **THEN** the control plane SHALL add the user message to the session
- **AND** the control plane SHALL invoke the shroom (Agno) and return the assistant response
- **AND** the response SHALL include the assistant message content

#### Scenario: Invalid session returns 404

- **GIVEN** no session exists with id `bad-id`
- **WHEN** client calls `POST /sessions/bad-id/messages`
- **THEN** response SHALL be 404
