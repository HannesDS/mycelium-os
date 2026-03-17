import type { ShroomEvent } from "@/types/shroom-events";
import { ZENIK_SHROOMS } from "@/types/shroom-events";

const MESSAGE_SENT_PAIRS: [string, string, string][] = [
  ["sales-shroom", "root-shroom", "Lead qualified — ready for demo booking"],
  ["delivery-shroom", "root-shroom", "Sprint 12 velocity report attached"],
  ["billing-shroom", "root-shroom", "Overdue invoice flagged for Acme Corp"],
  ["compliance-shroom", "root-shroom", "Contract renewal flagged for Acme Corp"],
  ["root-shroom", "delivery-shroom", "Prioritise the compliance dashboard"],
  ["root-shroom", "sales-shroom", "Approve outreach to Triodos Bank"],
  ["delivery-shroom", "billing-shroom", "Project milestone reached — invoice ready"],
  ["sales-shroom", "billing-shroom", "New deal closed — generate invoice"],
];

const THOUGHT_BUBBLES: [string, string][] = [
  ["sales-shroom", "Qualifying leads..."],
  ["delivery-shroom", "Tracking milestones..."],
  ["billing-shroom", "Reconciling invoices..."],
  ["compliance-shroom", "Reviewing terms..."],
  ["root-shroom", "Reviewing escalations..."],
];

const eventHistory: Map<string, ShroomEvent[]> = new Map();
ZENIK_SHROOMS.forEach((a) => eventHistory.set(a.id, []));

function storeEvent(event: ShroomEvent): void {
  const history = eventHistory.get(event.shroom_id) ?? [];
  history.unshift(event);
  if (history.length > 20) history.pop();
  eventHistory.set(event.shroom_id, history);
}

let loopCallback: MockEventCallback | null = null;

export function injectEvent(event: ShroomEvent): void {
  storeEvent(event);
  loopCallback?.(event);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function toISO(): string {
  return new Date().toISOString();
}

export function createMessageSentEvent(): ShroomEvent {
  const [from, to, summary] = pickRandom(MESSAGE_SENT_PAIRS);
  return {
    shroom_id: from,
    event: "message_sent",
    to,
    topic: "conversation",
    timestamp: toISO(),
    payload_summary: summary,
  };
}

export function createThoughtEvent(): ShroomEvent {
  const [shroomId, summary] = pickRandom(THOUGHT_BUBBLES);
  return {
    shroom_id: shroomId,
    event: "task_started",
    topic: "working",
    timestamp: toISO(),
    payload_summary: summary,
  };
}

export function createIdleEvent(shroomId: string): ShroomEvent {
  return {
    shroom_id: shroomId,
    event: "idle",
    topic: "idle",
    timestamp: toISO(),
    payload_summary: "At desk",
  };
}

export type MockEventCallback = (event: ShroomEvent) => void;

export function startMockEventLoop(callback: MockEventCallback): () => void {
  loopCallback = callback;
  const speechInterval = 2500 + Math.random() * 2000;
  const thoughtInterval = 3000 + Math.random() * 2500;

  const emit = (event: ShroomEvent) => {
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

export function getEventsForShroom(shroomId: string): ShroomEvent[] {
  return (eventHistory.get(shroomId) ?? []).slice(0, 5);
}

export function getCurrentTask(shroomId: string): string | null {
  const history = eventHistory.get(shroomId) ?? [];
  const last = history[0];
  if (!last || last.event === "idle") return null;
  return last.payload_summary;
}

export function getCurrentStatus(
  shroomId: string
): "idle" | "working" | "in conversation" {
  const history = eventHistory.get(shroomId) ?? [];
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
