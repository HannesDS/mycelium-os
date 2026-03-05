import type { AgentEvent } from "@/types/agent-events";
import { ZENIITH_AGENTS } from "@/types/agent-events";

const MESSAGE_SENT_TEMPLATES: Array<{ topic: string; summary: (to: string) => string }> = [
  { topic: "proposal_review", summary: (to) => `Draft proposal sent to ${to}` },
  { topic: "status_update", summary: (to) => `Status update shared with ${to}` },
  { topic: "design_feedback", summary: (to) => `Design feedback sent to ${to}` },
  { topic: "budget_approval", summary: (to) => `Budget request forwarded to ${to}` },
  { topic: "content_review", summary: (to) => `Content draft ready for ${to}` },
  { topic: "blocker_escalation", summary: (to) => `Blocker flagged to ${to}` },
  { topic: "sprint_sync", summary: (to) => `Sprint summary sent to ${to}` },
  { topic: "lead_qualified", summary: (to) => `Lead qualified, notifying ${to}` },
];

const TASK_STARTED_TEMPLATES: Array<{ topic: string; summary: string }> = [
  { topic: "churn_analysis", summary: "Analysing Q3 churn data…" },
  { topic: "design_system", summary: "Updating design system tokens…" },
  { topic: "invoice_reconciliation", summary: "Reconciling overdue invoices…" },
  { topic: "backlog_prioritisation", summary: "Prioritising backlog for next sprint…" },
  { topic: "content_calendar", summary: "Planning content calendar…" },
  { topic: "incident_triage", summary: "Triaging support tickets…" },
  { topic: "infra_health", summary: "Checking infrastructure health…" },
  { topic: "contract_review", summary: "Reviewing contract renewals…" },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomAgentId(exclude?: string): string {
  const candidates = ZENIITH_AGENTS.filter((a) => a.id !== exclude).map((a) => a.id);
  return pick(candidates);
}

export function createMockMessageSentEvent(): AgentEvent {
  const from = pick(ZENIITH_AGENTS).id;
  const to = getRandomAgentId(from);
  const template = pick(MESSAGE_SENT_TEMPLATES);
  return {
    agent_id: from,
    event: "message_sent",
    to,
    topic: template.topic,
    timestamp: new Date().toISOString(),
    payload_summary: template.summary(to),
  };
}

export function createMockTaskStartedEvent(): AgentEvent {
  const agent_id = pick(ZENIITH_AGENTS).id;
  const template = pick(TASK_STARTED_TEMPLATES);
  return {
    agent_id,
    event: "task_started",
    topic: template.topic,
    timestamp: new Date().toISOString(),
    payload_summary: template.summary,
  };
}

export type MockEventCallback = (event: AgentEvent) => void;

export function startMockEventLoop(callback: MockEventCallback, intervalMs = 2500): () => void {
  const emit = () => {
    const roll = Math.random();
    const event = roll < 0.5 ? createMockMessageSentEvent() : createMockTaskStartedEvent();
    callback(event);
  };

  const id = setInterval(emit, intervalMs);
  emit();

  return () => clearInterval(id);
}
