export type ShroomEventType =
  | "message_received"
  | "message_sent"
  | "task_started"
  | "task_completed"
  | "escalation_raised"
  | "decision_received"
  | "idle"
  | "error";

export interface ShroomEvent {
  shroom_id: string;
  event: ShroomEventType;
  to?: string;
  topic?: string;
  timestamp: string;
  payload_summary: string;
  metadata?: Record<string, unknown>;
}

export const SHROOM_EVENT_TYPES: ShroomEventType[] = [
  "message_received",
  "message_sent",
  "task_started",
  "task_completed",
  "escalation_raised",
  "decision_received",
  "idle",
  "error",
];
