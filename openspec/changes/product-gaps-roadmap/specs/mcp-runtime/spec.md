## ADDED Requirements

### Requirement: MCP runtime wiring

The control plane SHALL wire manifest `mcps` entries to actual MCP server connections. Shrooms with an MCP in their manifest SHALL receive the corresponding tools from that MCP server.

#### Scenario: MCP tools injected for shroom

- **GIVEN** shroom manifest has `mcps: [crm-mcp]`
- **WHEN** the shroom is instantiated
- **THEN** the control plane SHALL connect to the configured CRM MCP server and inject its tools into the shroom

#### Scenario: MCP allow-list

- **GIVEN** shroom does not have `github-mcp` in its mcps
- **WHEN** the shroom attempts to use a GitHub tool
- **THEN** the control plane SHALL deny the request
