from __future__ import annotations

MCP_CATALOG: dict[str, dict[str, str]] = {
    "crm": {
        "name": "CRM",
        "description": "Read and write CRM records and pipeline data",
    },
    "email": {
        "name": "Email",
        "description": "Send, receive, and manage email via SMTP/IMAP",
    },
    "calendar": {
        "name": "Calendar",
        "description": "Read and write calendar events and availability",
    },
    "slack": {
        "name": "Slack",
        "description": "Post and read messages in Slack channels",
    },
    "github": {
        "name": "GitHub",
        "description": "Access repositories, issues, and pull requests via GitHub API",
    },
    "postgres": {
        "name": "Postgres",
        "description": "Query and mutate a Postgres database",
    },
    "web": {
        "name": "Web Browser",
        "description": "Fetch and parse arbitrary web pages",
    },
}

SKILLS_CATALOG: dict[str, dict[str, str]] = {
    "web_browser": {
        "name": "Web Browser",
        "description": "Navigate, read, and interact with web pages",
    },
    "email": {
        "name": "Email",
        "description": "Send and read emails",
    },
    "github": {
        "name": "GitHub",
        "description": "Access repositories, issues, and pull requests",
    },
    "crm": {
        "name": "CRM",
        "description": "Read and write CRM data",
    },
    "lead_qualification": {
        "name": "Lead Qualification",
        "description": "Qualify and score leads",
    },
    "proposal_drafting": {
        "name": "Proposal Drafting",
        "description": "Draft proposals and quotes",
    },
    "decision_routing": {
        "name": "Decision Routing",
        "description": "Route escalations and decisions",
    },
    "escalation_triage": {
        "name": "Escalation Triage",
        "description": "Triage and prioritize escalations",
    },
    "knowledge_base": {
        "name": "Knowledge Base",
        "description": "Query company knowledge base documents via semantic search",
    },
}


def get_mcp_info(mcp_id: str) -> dict[str, str] | None:
    return MCP_CATALOG.get(mcp_id)


def get_skill_info(skill_id: str) -> dict[str, str] | None:
    return SKILLS_CATALOG.get(skill_id)


def tool_skill_allowed(tool_skill: str, manifest_skills: list[str]) -> bool:
    return tool_skill in manifest_skills
