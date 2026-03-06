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
  { id: "sales-agent", role: "Sales Development", escalatesTo: "ceo-agent", displayName: "Sales" },
  { id: "delivery-agent", role: "Delivery Lead", escalatesTo: "ceo-agent", displayName: "Delivery" },
  { id: "billing-agent", role: "Billing & Finance", escalatesTo: "ceo-agent", displayName: "Billing" },
  { id: "compliance-agent", role: "Compliance & Legal", escalatesTo: "ceo-agent", displayName: "Compliance" },
  { id: "ceo-agent", role: "CEO / Decider", escalatesTo: "human", displayName: "CEO" },
];
