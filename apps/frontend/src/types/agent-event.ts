export type AgentEventType =
  | "message_sent"
  | "task_started"
  | "task_completed"
  | "escalation_raised"
  | "decision_received"
  | "idle"
  | "error";

export type AgentStatus = "idle" | "working" | "in conversation";

export interface AgentEvent {
  agent_id: string;
  event: AgentEventType;
  to?: string;
  topic?: string;
  timestamp: string;
  payload_summary: string;
  metadata?: Record<string, unknown>;
}

export interface AgentConfig {
  id: string;
  role: string;
  name: string;
}
