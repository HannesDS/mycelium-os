import { describe, it, expect, vi, afterEach } from "vitest";
import {
  startMockEventLoop,
  createMessageSentEvent,
  createThoughtEvent,
  createIdleEvent,
} from "../mock-event-loop";
import { ZENIK_SHROOMS } from "@/types/shroom-events";

describe("mock-event-loop", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("createMessageSentEvent returns valid event shape", () => {
    const event = createMessageSentEvent();
    expect(event).toHaveProperty("shroom_id");
    expect(event).toHaveProperty("event", "message_sent");
    expect(event).toHaveProperty("to");
    expect(event).toHaveProperty("topic");
    expect(event).toHaveProperty("timestamp");
    expect(event).toHaveProperty("payload_summary");
    expect(new Date(event.timestamp).toISOString()).toBe(event.timestamp);
  });

  it("createThoughtEvent returns task_started event", () => {
    const event = createThoughtEvent();
    expect(event.event).toBe("task_started");
    expect(event.topic).toBe("working");
    expect(typeof event.payload_summary).toBe("string");
  });

  it("createIdleEvent returns idle event for given shroom", () => {
    const event = createIdleEvent("sales-shroom");
    expect(event.shroom_id).toBe("sales-shroom");
    expect(event.event).toBe("idle");
  });

  it("events only reference MVP shroom IDs", () => {
    const validIds = new Set(ZENIK_SHROOMS.map((a) => a.id));
    for (let i = 0; i < 50; i++) {
      const msg = createMessageSentEvent();
      expect(validIds.has(msg.shroom_id)).toBe(true);
      if (msg.to) expect(validIds.has(msg.to)).toBe(true);

      const thought = createThoughtEvent();
      expect(validIds.has(thought.shroom_id)).toBe(true);
    }
  });

  it("startMockEventLoop returns a cleanup function that stops emitting", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const cleanup = startMockEventLoop(callback);

    expect(typeof cleanup).toBe("function");

    vi.advanceTimersByTime(10000);
    const callCount = callback.mock.calls.length;
    expect(callCount).toBeGreaterThan(0);

    cleanup();
    vi.advanceTimersByTime(10000);
    expect(callback.mock.calls.length).toBe(callCount);

    vi.useRealTimers();
  });
});
