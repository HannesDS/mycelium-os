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
  topic: string;
  timestamp: string;
  payload_summary: string;
  metadata?: Record<string, unknown>;
}

export interface ZenikAgent {
  id: string;
  role: string;
  escalatesTo: string;
  displayName: string;
}

export const ZENIK_AGENTS: ZenikAgent[] = [
  { id: "ceo-agent", role: "CEO", escalatesTo: "human", displayName: "CEO" },
  { id: "product-agent", role: "Product Manager", escalatesTo: "ceo-agent", displayName: "Product" },
  { id: "eng-agent", role: "Lead Engineer", escalatesTo: "ceo-agent", displayName: "Engineering" },
  { id: "design-agent", role: "UX Designer", escalatesTo: "product-agent", displayName: "Design" },
  { id: "sales-agent", role: "Sales Lead", escalatesTo: "ceo-agent", displayName: "Sales" },
  { id: "support-agent", role: "Customer Support", escalatesTo: "product-agent", displayName: "Support" },
  { id: "compliance-agent", role: "Compliance Officer", escalatesTo: "ceo-agent", displayName: "Compliance" },
  { id: "marketing-agent", role: "Content & Growth", escalatesTo: "sales-agent", displayName: "Marketing" },
];
