import type { AgentEvent } from "@/types/events";
import type { AgentDefinition } from "@/types/constitution";

const TASK_DESCRIPTIONS: Record<string, string[]> = {
  "sales-agent": [
    "Qualifying lead from Acme Corp",
    "Drafting proposal for Q2 engagement",
    "Booking demo with engineering team",
  ],
  "delivery-agent": [
    "Tracking sprint 12 velocity",
    "Flagging blocker on auth migration",
    "Preparing status report for stakeholder",
  ],
  "billing-agent": [
    "Detecting overdue invoice #1042",
    "Proposing chase email to client",
    "Reconciling March expenses",
  ],
  "compliance-agent": [
    "Flagging contract renewal in 30 days",
    "Reviewing NDA terms",
    "Auditing data retention policy",
  ],
  "ceo-agent": [
    "Reviewing escalation from sales",
    "Routing decision to human",
    "Approving proposal for Acme Corp",
  ],
};

const EVENT_SUMMARIES: Record<string, string[]> = {
  "sales-agent": [
    "Lead qualified: Acme Corp, $50k ARR potential",
    "Proposal draft sent for internal review",
    "Demo booked for Thursday 14:00",
  ],
  "delivery-agent": [
    "Sprint 12: 78% velocity, 2 blockers",
    "Escalated auth migration to engineering",
    "Status report published to Slack",
  ],
  "billing-agent": [
    "Invoice #1042 overdue by 14 days",
    "Chase email drafted, awaiting approval",
    "March reconciliation complete",
  ],
  "compliance-agent": [
    "Contract XYZ renews 2026-04-05",
    "NDA review complete, no changes",
    "Retention audit passed",
  ],
  "ceo-agent": [
    "Approved proposal escalation",
    "Decision routed to human inbox",
    "Proposal approved for send",
  ],
};

export type AgentStatus = "idle" | "thinking" | "messaging";

export interface AgentState {
  id: string;
  role: string;
  status: AgentStatus;
  currentTask: string;
  escalatesTo: string | null;
  lastEvents: AgentEvent[];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createEvent(
  agentId: string,
  eventType: AgentEvent["event"],
  summary: string
): AgentEvent {
  return {
    agent_id: agentId,
    event: eventType,
    timestamp: new Date().toISOString(),
    payload_summary: summary,
  };
}

export function createMockAgentStates(
  agents: AgentDefinition[],
  eventHistory: Map<string, AgentEvent[]>
): AgentState[] {
  return agents.map((agent) => {
    const tasks = TASK_DESCRIPTIONS[agent.id] ?? ["Processing"];
    const summaries = EVENT_SUMMARIES[agent.id] ?? ["Activity logged"];
    const statuses: AgentStatus[] = ["idle", "thinking", "messaging"];
    const status = pick(statuses);
    const currentTask = pick(tasks);

    const newEvent = createEvent(
      agent.id,
      status === "messaging" ? "message_sent" : status === "thinking" ? "task_started" : "idle",
      pick(summaries)
    );

    const history = eventHistory.get(agent.id) ?? [];
    const updated = [newEvent, ...history].slice(0, 10);
    eventHistory.set(agent.id, updated);

    return {
      id: agent.id,
      role: agent.role,
      status,
      currentTask,
      escalatesTo: agent.escalates_to ?? null,
      lastEvents: updated.slice(0, 3),
    };
  });
}

export function runMockEventLoop(
  agents: AgentDefinition[],
  eventHistory: Map<string, AgentEvent[]>,
  onTick: (states: AgentState[]) => void
): () => void {
  const interval = setInterval(() => {
    const states = createMockAgentStates(agents, eventHistory);
    onTick(states);
  }, 3000);
  return () => clearInterval(interval);
}
