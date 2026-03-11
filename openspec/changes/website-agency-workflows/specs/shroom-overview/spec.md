## ADDED Requirements

### Requirement: Per-shroom overview page

The system SHALL provide a per-shroom detail page at `/shrooms/[id]` that displays the shroom's config, an inline chat, and skills assignment. The page SHALL be accessible from the shrooms list and the organisation graph.

#### Scenario: View shroom config

- **GIVEN** a shroom exists
- **WHEN** the user navigates to the shroom overview page
- **THEN** the page SHALL display the shroom's manifest (model, skills, escalates_to, can/cannot)

#### Scenario: Chat inline on shroom page

- **GIVEN** the user is on the shroom overview page
- **WHEN** the user sends a message in the inline chat
- **THEN** the system SHALL send the message to that shroom and display the response

#### Scenario: Assign skills from overview

- **GIVEN** the user is on the shroom overview page
- **WHEN** the user assigns or removes a skill
- **THEN** the change SHALL persist and the shroom's effective skills SHALL update
