## ADDED Requirements

### Requirement: Shroom can execute a task via session message

The control plane SHALL support executing a shroom task when a message is sent to an existing session. On `POST /sessions/{session_id}/messages` with `{ "content": "..." }`, the control plane SHALL invoke the Agno runtime for the session's shroom, SHALL emit `task_started` before the LLM call, and SHALL emit `message_sent` or `escalation_raised` after completion. The control plane SHALL write each event to the audit log before emitting to NATS.

#### Scenario: Send message triggers execution

- **GIVEN** session `sess-1` exists for `sales-shroom`
- **WHEN** client calls `POST /sessions/sess-1/messages` with `{ "content": "Qualify lead Acme Corp" }`
- **THEN** the control plane SHALL emit `task_started` ShroomEvent to NATS
- **AND** the control plane SHALL run the Agno LLM for sales-shroom
- **AND** the control plane SHALL emit `message_sent` or `escalation_raised` after completion
- **AND** session state SHALL be persisted

#### Scenario: Audit log before each emit

- **WHEN** the execution pipeline emits any ShroomEvent
- **THEN** the event SHALL be written to the audit log before it is published to NATS

#### Scenario: Session not found returns 404

- **GIVEN** no session exists with id `nonexistent`
- **WHEN** client calls `POST /sessions/nonexistent/messages`
- **THEN** response SHALL be 404
