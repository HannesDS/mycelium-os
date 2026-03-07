import type { ShroomEvent } from "@/types/shroom-events";

export function createEvent(
  overrides: Partial<ShroomEvent> & Pick<ShroomEvent, "shroom_id" | "event" | "payload_summary">
): ShroomEvent {
  return {
    to: undefined,
    topic: undefined,
    metadata: {},
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}
