import type { AgentEvent } from "@/types/agent-events";
import { ZENIK_AGENTS } from "@/types/agent-events";

const MESSAGE_SENT_PAIRS: [string, string, string][] = [
  ["product-agent", "eng-agent", "Reviewing the Q3 compliance report"],
  ["sales-agent", "ceo-agent", "Lead qualified — ready for demo booking"],
  ["design-agent", "product-agent", "Wireframes for onboarding flow ready"],
  ["support-agent", "product-agent", "Escalating NPS feedback from enterprise tier"],
  ["compliance-agent", "ceo-agent", "Contract renewal flagged for Acme Corp"],
  ["marketing-agent", "sales-agent", "New case study draft for review"],
  ["eng-agent", "product-agent", "Sprint 12 velocity report attached"],
  ["ceo-agent", "product-agent", "Prioritise the compliance dashboard"],
];

const THOUGHT_BUBBLES: [string, string][] = [
  ["product-agent", "Drafting proposal..."],
  ["eng-agent", "Running migration tests..."],
  ["design-agent", "Sketching user flows..."],
  ["sales-agent", "Qualifying leads..."],
  ["support-agent", "Triaging tickets..."],
  ["compliance-agent", "Reviewing terms..."],
  ["marketing-agent", "Writing blog post..."],
  ["ceo-agent", "Reviewing escalations..."],
];

const eventHistory: Map<string, AgentEvent[]> = new Map();
ZENIK_AGENTS.forEach((a) => eventHistory.set(a.id, []));

function storeEvent(event: AgentEvent): void {
  const history = eventHistory.get(event.agent_id) ?? [];
  history.unshift(event);
  if (history.length > 20) history.pop();
  eventHistory.set(event.agent_id, history);
}

let loopCallback: MockEventCallback | null = null;

export function injectEvent(event: AgentEvent): void {
  storeEvent(event);
  loopCallback?.(event);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function toISO(): string {
  return new Date().toISOString();
}

export function createMessageSentEvent(): AgentEvent {
  const [from, to, summary] = pickRandom(MESSAGE_SENT_PAIRS);
  return {
    agent_id: from,
    event: "message_sent",
    to,
    topic: "conversation",
    timestamp: toISO(),
    payload_summary: summary,
  };
}

export function createThoughtEvent(): AgentEvent {
  const [agentId, summary] = pickRandom(THOUGHT_BUBBLES);
  return {
    agent_id: agentId,
    event: "task_started",
    topic: "working",
    timestamp: toISO(),
    payload_summary: summary,
  };
}

export function createIdleEvent(agentId: string): AgentEvent {
  return {
    agent_id: agentId,
    event: "idle",
    topic: "idle",
    timestamp: toISO(),
    payload_summary: "At desk",
  };
}

export type MockEventCallback = (event: AgentEvent) => void;

export function startMockEventLoop(callback: MockEventCallback): () => void {
  loopCallback = callback;
  const speechInterval = 2500 + Math.random() * 2000;
  const thoughtInterval = 3000 + Math.random() * 2500;

  const emit = (event: AgentEvent) => {
    storeEvent(event);
    callback(event);
  };

  const speechTimer = setInterval(() => {
    emit(createMessageSentEvent());
  }, speechInterval);

  const thoughtTimer = setInterval(() => {
    emit(createThoughtEvent());
  }, thoughtInterval);

  return () => {
    loopCallback = null;
    clearInterval(speechTimer);
    clearInterval(thoughtTimer);
  };
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

export function getCurrentStatus(
  agentId: string
): "idle" | "working" | "in conversation" {
  const history = eventHistory.get(agentId) ?? [];
  const last = history[0];
  if (!last) return "idle";
  if (last.event === "idle") return "idle";
  if (
    last.event === "message_sent" ||
    last.event === "decision_received"
  )
    return "in conversation";
  return "working";
}
