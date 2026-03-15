## ADDED Requirements

### Requirement: Skills catalog and allow-list enforcement

The system SHALL maintain a catalog of skills and capabilities. Each shroom SHALL have an allow-list of skills it can use. Before a shroom executes a tool, the control plane SHALL verify the tool is in the shroom's allow-list.

#### Scenario: Allow-list enforcement

- **GIVEN** shroom "maker" has skills `[web_browser, email]`
- **WHEN** the maker shroom attempts to use the `github` tool
- **THEN** the control plane SHALL deny the execution

#### Scenario: Skills overview UI

- **WHEN** the operator views the skills/capabilities overview
- **THEN** the UI SHALL list all available skills and which shrooms have access to each
