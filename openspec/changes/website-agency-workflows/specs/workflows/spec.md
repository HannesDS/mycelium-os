## ADDED Requirements

### Requirement: Workflow engine for multi-shroom processes

The system SHALL support declarative workflows that orchestrate multiple shrooms. Workflows SHALL be defined in YAML or Python (Agno Workflow). Each workflow SHALL have a name, steps (shrooms or functions), and SHALL be triggerable via API or event.

#### Scenario: Workflow defined in YAML

- **GIVEN** a workflow YAML file in `workflows/`
- **WHEN** the control plane starts
- **THEN** the workflow SHALL be loaded and available by name

#### Scenario: Workflow executes steps in sequence

- **GIVEN** a workflow with steps [shroom-a, shroom-b]
- **WHEN** the workflow is triggered with input
- **THEN** the system SHALL run shroom-a, pass its output to shroom-b, and return the final result

#### Scenario: Workflow triggered via API

- **GIVEN** a workflow is loaded
- **WHEN** the client calls `POST /workflows/{name}/run` with input
- **THEN** the system SHALL execute the workflow and return the result
