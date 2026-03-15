## ADDED Requirements

### Requirement: Assign and reassign skills to shrooms

The system SHALL allow the operator to assign and reassign skills to shrooms via UI. Skill overrides SHALL be persisted (DB or manifest) and SHALL take effect at runtime. The skills catalog SHALL remain the source of valid skill IDs.

#### Scenario: Assign skill to shroom

- **GIVEN** a shroom and a skill from the catalog
- **WHEN** the operator assigns the skill to the shroom via the UI
- **THEN** the shroom SHALL have access to that skill's tools at runtime

#### Scenario: Reassign (remove) skill from shroom

- **GIVEN** a shroom has an assigned skill
- **WHEN** the operator removes the skill via the UI
- **THEN** the shroom SHALL no longer have access to that skill's tools

#### Scenario: Skills merge with manifest

- **GIVEN** a shroom has skills in its manifest and optional overrides in the DB
- **WHEN** the system resolves the shroom's effective skills
- **THEN** the system SHALL merge manifest skills with overrides (overrides add or remove; no conflict with manifest base)
