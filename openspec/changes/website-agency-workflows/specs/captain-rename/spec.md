## ADDED Requirements

### Requirement: Captain shroom replaces CEO shroom

The head-of-shrooms shroom SHALL be named "Captain" (id: captain-shroom). The human operator is the CEO. All references to root-shroom in manifests, nav, routes, and documentation SHALL be updated to captain-shroom.

#### Scenario: Captain shroom in constitution

- **GIVEN** the constitution is loaded
- **WHEN** captain-shroom is declared in mycelium.yaml
- **THEN** the control plane SHALL register it and expose it for chat and escalation

#### Scenario: Nav and routes use Captain

- **GIVEN** the user views the sidebar
- **WHEN** the Captain interface is linked
- **THEN** the nav item SHALL display "Captain" and link to /captain (or equivalent)

#### Scenario: Escalation targets Captain

- **GIVEN** a shroom escalates_to is captain-shroom
- **WHEN** an escalation is raised
- **THEN** the Captain shroom SHALL receive the escalation (or human if escalates_to is human)
