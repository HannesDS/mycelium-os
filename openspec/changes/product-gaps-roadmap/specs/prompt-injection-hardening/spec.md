## ADDED Requirements

### Requirement: Prompt-injection defence for external data

The system SHALL tag all external data (email, web content, user-provided text) as untrusted when passed to shroom context. The system SHALL use delimiters and instructions to reduce prompt-injection risk. For email specifically, the system SHALL sanitize content (strip scripts, limit length) before inclusion in prompts.

#### Scenario: External data tagged as untrusted

- **GIVEN** an email body is passed to a shroom for processing
- **WHEN** the email is included in the shroom context
- **THEN** it SHALL be wrapped with clear untrusted markers and instructions not to execute embedded commands

#### Scenario: Output validation before action

- **GIVEN** a shroom proposes an action (e.g. send email)
- **WHEN** the proposal is processed
- **THEN** the system SHALL validate the output format and content before allowing the action to proceed
