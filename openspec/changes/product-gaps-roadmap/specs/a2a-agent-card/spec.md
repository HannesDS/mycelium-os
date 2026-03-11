## ADDED Requirements

### Requirement: A2A Agent Card per shroom

The control plane SHALL expose an Agent Card at `GET /.well-known/agent-card.json` or `GET /shrooms/{shroom_id}/.well-known/agent-card.json` for each shroom. The Agent Card SHALL conform to A2A protocol and include name, description, url, and skills (as AgentSkill objects).

#### Scenario: Agent Card returned for shroom

- **GIVEN** shroom `ceo-shroom` exists
- **WHEN** client requests `GET /shrooms/ceo-shroom/.well-known/agent-card.json`
- **THEN** the response SHALL be valid A2A AgentCard JSON with name, description, url, and skills derived from manifest

#### Scenario: Skills mapped to AgentSkill

- **GIVEN** shroom has `skills: [decision_routing, escalation_triage]`
- **WHEN** the Agent Card is generated
- **THEN** each skill SHALL appear as an AgentSkill with id, name, description
