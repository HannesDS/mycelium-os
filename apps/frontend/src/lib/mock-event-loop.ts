import type { AgentEvent, AgentEventType } from "@/types/agent-event";
import { AGENTS } from "./agents";

const EVENT_TEMPLATES: Record<
  string,
  { event: AgentEventType; payload: string }[]
> = {
  "sales-agent": [
    { event: "task_started", payload: "Qualifying lead from Acme Corp" },
    { event: "message_sent", payload: "Draft proposal sent to client" },
    { event: "message_sent", payload: "Lead qualified: Rabobank" },
    { event: "task_completed", payload: "Proposal drafted for client" },
    { event: "escalation_raised", payload: "Escalated approval for demo booking" },
  ],
  "delivery-agent": [
    { event: "task_started", payload: "Tracking sprint progress" },
    { event: "message_sent", payload: "Status update to stakeholders" },
    { event: "task_completed", payload: "Sprint report delivered" },
    { event: "escalation_raised", payload: "Blocked: dependency on design" },
  ],
  "billing-agent": [
    { event: "task_started", payload: "Reconciling invoice #4521" },
    { event: "message_sent", payload: "Chase email drafted for overdue invoice" },
    { event: "task_completed", payload: "Invoice reconciled" },
  ],
  "compliance-agent": [
    { event: "task_started", payload: "Reviewing DORA compliance checklist for client Rabobank" },
    { event: "message_sent", payload: "Contract renewal flagged" },
    { event: "escalation_raised", payload: "Terms review needed" },
  ],
  "ceo-agent": [
    { event: "decision_received", payload: "Approved demo booking" },
    { event: "message_sent", payload: "Routed escalation to human" },
    { event: "idle", payload: "Awaiting next escalation" },
  ],
};

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createEvent(
  agentId: string,
  event: AgentEventType,
  payload: string
): AgentEvent {
  return {
    agent_id: agentId,
    event,
    timestamp: new Date().toISOString(),
    payload_summary: payload,
  };
}

export type EventListener = (event: AgentEvent) => void;

const listeners: Set<EventListener> = new Set();
const eventHistory: Map<string, AgentEvent[]> = new Map();

AGENTS.forEach((a) => eventHistory.set(a.id, []));

function emit(event: AgentEvent): void {
  const history = eventHistory.get(event.agent_id) ?? [];
  history.unshift(event);
  if (history.length > 20) history.pop();
  eventHistory.set(event.agent_id, history);
  listeners.forEach((fn) => fn(event));
}

export function subscribe(fn: EventListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getEventsForAgent(agentId: string): AgentEvent[] {
  return (eventHistory.get(agentId) ?? []).slice(0, 5);
}

export function getCurrentTask(agentId: string): string | null {
  const history = eventHistory.get(agentId) ?? [];
  const last = history[0];
  if (!last || last.event === "idle") return null;
  return last.payload_summary;
}

export function getCurrentStatus(agentId: string): "idle" | "working" | "in conversation" {
  const history = eventHistory.get(agentId) ?? [];
  const last = history[0];
  if (!last) return "idle";
  if (last.event === "idle") return "idle";
  if (last.event === "message_sent" || last.event === "decision_received") return "in conversation";
  return "working";
}

export function startMockEventLoop(intervalMs = 6000): () => void {
  let interval: ReturnType<typeof setInterval>;

  function tick() {
    const agent = randomItem(AGENTS);
    const templates = EVENT_TEMPLATES[agent.id] ?? EVENT_TEMPLATES["ceo-agent"];
    const { event, payload } = randomItem(templates);
    emit(createEvent(agent.id, event, payload));
  }

  tick();
  interval = setInterval(tick, intervalMs);

  return () => clearInterval(interval);
}
