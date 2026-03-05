import type { AgentEvent } from "@/types/events";

export function createEvent(
  overrides: Partial<AgentEvent> & Pick<AgentEvent, "agent_id" | "event" | "payload_summary">
): AgentEvent {
  return {
    to: undefined,
    topic: undefined,
    metadata: {},
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}
