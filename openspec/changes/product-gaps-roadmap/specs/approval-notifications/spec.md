## ADDED Requirements

### Requirement: Visible approval notifications

The frontend SHALL display a visible indicator when pending approvals exist. Options include: badge on Approvals nav item, toast/popup when a new approval arrives, or both. The user SHALL be able to see at a glance that action is required.

#### Scenario: Badge on Approvals nav

- **GIVEN** at least one approval has status pending
- **WHEN** the user views the sidebar/navigation
- **THEN** the Approvals nav item SHALL show a badge with the count of pending approvals

#### Scenario: Real-time notification

- **GIVEN** the user has the app open
- **WHEN** a new approval is created (e.g. via trigger-escalation or real escalation)
- **THEN** the frontend SHALL update the badge or show a toast within a reasonable time (poll or WebSocket)
