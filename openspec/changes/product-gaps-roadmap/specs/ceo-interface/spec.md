## ADDED Requirements

### Requirement: CEO-first interface for declaring and configuring shrooms

The system SHALL provide a CEO-first interface (chat or landing) that allows the operator to declare new business features and configure shrooms. When the system has no or minimal shrooms configured, the interface SHALL guide the user to add shrooms, set skills, and configure prompts.

#### Scenario: First-time setup

- **GIVEN** the system has no shrooms or only default config
- **WHEN** the operator opens the app
- **THEN** the interface SHALL present a CEO or "Setup" flow to declare features and configure shrooms

#### Scenario: Configure shroom via CEO chat

- **GIVEN** the CEO interface is active
- **WHEN** the operator asks to add a shroom with specific skills
- **THEN** the system SHALL support creating or updating shroom configuration (skills, prompts, knowledge)
