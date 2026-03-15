## ADDED Requirements

### Requirement: Chat works with OpenRouter and Ollama

The chat interface SHALL successfully send messages and receive responses when either OpenRouter or Ollama is configured. When OpenRouter is used, the system SHALL use `OPENROUTER_API_KEY` and a configurable default model. When Ollama is used, the system SHALL use the shroom's manifest model (e.g. mistral:latest) and SHALL return a clear, actionable error when the model is not available.

#### Scenario: Chat succeeds with OpenRouter

- **GIVEN** `OPENROUTER_API_KEY` is set and shroom uses `openrouter/<model-id>`
- **WHEN** user sends a message via chat
- **THEN** the system SHALL call OpenRouter and return the shroom response

#### Scenario: Chat succeeds with local Ollama

- **GIVEN** Ollama is running and the shroom's model (e.g. mistral:latest) is pulled
- **WHEN** user sends a message via chat
- **THEN** the system SHALL return the shroom response

#### Scenario: Model not available returns actionable error

- **GIVEN** shroom uses Ollama and the model is not pulled or Ollama is unreachable
- **WHEN** user sends a message
- **THEN** the system SHALL return an error indicating the model must be pulled or Ollama started, with the exact command (e.g. `ollama pull mistral`)
