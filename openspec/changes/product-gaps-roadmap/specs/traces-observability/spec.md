## ADDED Requirements

### Requirement: Full traces for observability

The system SHALL record full traces: which shroom performed which query, token count, cost (when available), and inter-shroom communications. Traces SHALL be queryable and viewable in the Traces UI.

#### Scenario: Trace includes token and cost

- **GIVEN** a shroom processes a message via OpenRouter
- **WHEN** the response is received
- **THEN** the event/audit record SHALL include `token_count` and `cost_usd` (or equivalent) when available

#### Scenario: Trace includes inter-shroom communication

- **GIVEN** shroom A sends a message to shroom B
- **WHEN** the message is delivered
- **THEN** the trace SHALL record the communication with source, target, and payload summary
