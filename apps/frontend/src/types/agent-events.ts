export type AgentEventType =
  | "message_sent"
  | "task_started"
  | "task_completed"
  | "escalation_raised"
  | "decision_received"
  | "idle"
  | "error";

export interface AgentEvent {
  agent_id: string;
  event: AgentEventType;
  to?: string;
  topic?: string;
  timestamp: string;
  payload_summary: string;
  metadata?: Record<string, unknown>;
}

export interface AgentDefinition {
  id: string;
  role: string;
  escalates_to: string;
}

export const ZENIITH_AGENTS: AgentDefinition[] = [
  { id: "ceo-agent", role: "CEO", escalates_to: "human" },
  { id: "product-agent", role: "Product Manager", escalates_to: "ceo-agent" },
  { id: "engineer-agent", role: "Lead Engineer", escalates_to: "ceo-agent" },
  { id: "designer-agent", role: "UX Designer", escalates_to: "product-agent" },
  { id: "growth-agent", role: "Growth Manager", escalates_to: "ceo-agent" },
  { id: "support-agent", role: "Customer Support Lead", escalates_to: "product-agent" },
  { id: "finance-agent", role: "Finance Manager", escalates_to: "ceo-agent" },
  { id: "content-agent", role: "Content Strategist", escalates_to: "growth-agent" },
];
