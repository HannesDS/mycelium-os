## ADDED Requirements

### Requirement: Control plane exposes demo trigger escalation endpoint

The control plane SHALL provide `POST /demo/trigger-escalation` that creates a new Approval in the database and emits `escalation_raised` and `message_sent` ShroomEvents to NATS. The endpoint SHALL return the created approval ID and summary.

#### Scenario: Trigger creates approval and emits events

- **GIVEN** the control plane is running with NATS connected
- **WHEN** client calls `POST /demo/trigger-escalation`
- **THEN** the control plane SHALL create a new Approval record with `shroom_id: "sales-shroom"`, `event_type: "escalation_raised"`, status pending
- **AND** the control plane SHALL emit `escalation_raised` ShroomEvent to NATS
- **AND** the control plane SHALL emit `message_sent` ShroomEvent (sales-shroom → root-shroom) to NATS
- **AND** the response SHALL include `approval_id` and `summary`

#### Scenario: Request body optional

- **WHEN** client calls `POST /demo/trigger-escalation` without body (or with empty body)
- **THEN** the control plane SHALL use default demo payload (e.g. "New enterprise lead — Triodos Bank. Proposal ready for approval.")

#### Scenario: Idempotency not required

- **WHEN** client calls `POST /demo/trigger-escalation` multiple times
- **THEN** each call SHALL create a new Approval (no idempotency key for MVP)
