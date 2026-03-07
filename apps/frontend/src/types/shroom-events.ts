export type ShroomEventType =
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

export interface ZenikShroom {
  id: string;
  role: string;
  escalatesTo: string;
  displayName: string;
}

export const ZENIK_SHROOMS: ZenikShroom[] = [
  { id: "sales-shroom", role: "Sales Development", escalatesTo: "ceo-shroom", displayName: "Sales" },
  { id: "delivery-shroom", role: "Delivery Lead", escalatesTo: "ceo-shroom", displayName: "Delivery" },
  { id: "billing-shroom", role: "Billing & Finance", escalatesTo: "ceo-shroom", displayName: "Billing" },
  { id: "compliance-shroom", role: "Compliance & Legal", escalatesTo: "ceo-shroom", displayName: "Compliance" },
  { id: "ceo-shroom", role: "CEO / Decider", escalatesTo: "human", displayName: "CEO" },
];
