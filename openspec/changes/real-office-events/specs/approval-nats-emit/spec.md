## ADDED Requirements

### Requirement: Approvals API emits decision_received to NATS after human decision

When a human approves or rejects a proposal via `POST /approvals/{id}/approve` or `POST /approvals/{id}/reject`, the control plane SHALL write the decision to the audit log first, then SHALL emit a `decision_received` ShroomEvent to NATS (subject `shroom.{shroom_id}.events` and `mycelium.events`). The event SHALL include `metadata.approved` (boolean) and `metadata.approval_id` (UUID).

#### Scenario: Approve emits decision_received

- **GIVEN** approval `abc-123` exists for `sales-shroom` with status pending
- **WHEN** client calls `POST /approvals/abc-123/approve`
- **THEN** the control plane SHALL write an audit log entry before emitting
- **AND** the control plane SHALL publish a ShroomEvent with `event: "decision_received"`, `shroom_id: "sales-shroom"`, `metadata.approved: true`, `metadata.approval_id: "abc-123"` to NATS

#### Scenario: Reject emits decision_received

- **GIVEN** approval `abc-123` exists for `sales-shroom` with status pending
- **WHEN** client calls `POST /approvals/abc-123/reject`
- **THEN** the control plane SHALL write an audit log entry before emitting
- **AND** the control plane SHALL publish a ShroomEvent with `event: "decision_received"`, `shroom_id: "sales-shroom"`, `metadata.approved: false` to NATS

#### Scenario: Audit log before NATS

- **WHEN** approve or reject is processed
- **THEN** the audit log write SHALL complete before the NATS publish is attempted (per SHROOM-EVENT-SCHEMA audit log requirement)
