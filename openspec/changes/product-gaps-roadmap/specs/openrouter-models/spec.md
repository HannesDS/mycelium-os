## ADDED Requirements

### Requirement: Support OpenRouter as model provider

The control plane SHALL support OpenRouter as a model provider. When a shroom manifest specifies `model: openrouter/<model-id>`, the control plane SHALL use the OpenRouter API with the API key from `OPENROUTER_API_KEY` environment variable. The API key SHALL never be stored in code, config files, or version control.

#### Scenario: OpenRouter model resolution

- **GIVEN** shroom manifest has `model: openrouter/anthropic/claude-3.5-sonnet`
- **WHEN** the shroom processes a message
- **THEN** the control plane SHALL call OpenRouter API with that model ID and `OPENROUTER_API_KEY` from env

#### Scenario: Missing API key

- **GIVEN** shroom uses OpenRouter model and `OPENROUTER_API_KEY` is not set
- **WHEN** the shroom processes a message
- **THEN** the control plane SHALL return a clear error indicating the key must be set

### Requirement: No tokens in repository

The project SHALL NOT contain API keys, tokens, or secrets in code or committed config. `.env.example` MAY include `OPENROUTER_API_KEY=` (empty); `.env` SHALL be gitignored.

#### Scenario: Env example has placeholder only

- **WHEN** inspecting `.env.example`
- **THEN** it SHALL NOT contain any real API key or token value
