## ADDED Requirements

### Requirement: Auto-trigger workflows on events

The system SHALL trigger workflows automatically when matching events are received. Event patterns (e.g. topic, payload) SHALL be configurable per workflow. The default "website confirmed" workflow SHALL trigger when a customer confirms they want a website built.

#### Scenario: Event triggers workflow

- **GIVEN** a workflow is configured to trigger on `topic=website_confirmed`
- **WHEN** an event with that topic is emitted to NATS
- **THEN** the system SHALL start the workflow with the event payload as input

#### Scenario: Website confirmed workflow

- **GIVEN** the sales shroom receives a customer confirmation ("yes we want a website")
- **WHEN** the system emits an event with topic=website_confirmed
- **THEN** the default website workflow SHALL be triggered (e.g. create project, notify front-end engineer)
