## ADDED Requirements

### Requirement: Create workflows via chat

The Captain (or dedicated workflow shroom) SHALL be able to help the operator create workflows via chat. For MVP, the shroom SHALL output a workflow YAML snippet that the operator can copy and save. Future: persist via approval flow.

#### Scenario: Captain outputs workflow YAML

- **GIVEN** the operator asks the Captain to create a workflow (e.g. "create a workflow for when a customer confirms a website")
- **WHEN** the Captain responds
- **THEN** the response SHALL include a valid workflow YAML snippet that the operator can save to `workflows/`

#### Scenario: Workflow snippet is valid

- **GIVEN** the Captain outputs a workflow snippet
- **WHEN** the operator saves it to `workflows/<name>.yaml` and restarts (or hot-reloads)
- **THEN** the workflow SHALL load without error and be triggerable
