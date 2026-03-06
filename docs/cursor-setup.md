# Cursor Setup

## MCP Linear Integration

The project includes `.cursor/mcp.json` with Linear MCP preconfigured. After opening the project in Cursor:

1. Restart Cursor (or reload the window) so it picks up the config
2. Linear will prompt for OAuth authentication on first use
3. You can then reference Linear issues in chat (e.g. `@linear MYC-8`)

If the connection fails, try disabling and re-enabling the Linear MCP server in Cursor Settings (Ctrl/Cmd + Shift + J → MCP).

## Persisting Skills in Cursor Cloud Agents

Cursor Cloud Agents do **not** persist project knowledge or learned patterns between sessions. Each session starts fresh.

To persist skills across sessions:

1. **SKILL.md files** — Define reusable workflows in `SKILL.md` manifests. Agents discover and apply these dynamically. Place in project root or `docs/skills/`. Example:

   ```markdown
   # Skill: Escalation Flow
   When implementing escalation flows, follow CLAUDE.md event schema...
   ```

2. **Project rules (CLAUDE.md)** — Already in use. These are loaded every session and provide constitutional context.

3. **Cursor Rules / .cursorrules** — Project-level instructions that persist in the repo.

4. **Memory workarounds** — No built-in persistent memory exists. Some teams use:
   - `MEMORY.md` or `docs/context.md` that agents update during sessions (manual sync)
   - External knowledge bases via MCP
   - Detailed PR descriptions and commit messages as session artifacts

For Cloud Agents specifically: skills define *what to do* but cannot learn from doing. To "persist" expertise, encode it in SKILL.md, CLAUDE.md, or documentation the agent reads each run.
