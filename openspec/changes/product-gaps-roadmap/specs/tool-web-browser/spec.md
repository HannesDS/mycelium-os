## ADDED Requirements

### Requirement: Web browser as a shroom skill

The system SHALL provide a web browser tool (e.g. Playwright) as a skill. Shrooms with the `web_browser` skill SHALL be able to navigate, read, and interact with web pages in a sandboxed environment.

#### Scenario: Web browser tool available to allowed shroom

- **GIVEN** shroom has `web_browser` in its skills
- **WHEN** the shroom requests to fetch a URL
- **THEN** the control plane SHALL execute the request in a sandboxed browser and return the result

#### Scenario: Web browser denied for shroom without skill

- **GIVEN** shroom does not have `web_browser` in its skills
- **WHEN** the shroom attempts to use the web browser tool
- **THEN** the control plane SHALL deny the request
