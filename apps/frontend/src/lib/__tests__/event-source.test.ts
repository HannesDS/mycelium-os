import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { startEventSource } from "../event-source";

vi.mock("../mock-event-loop", () => ({
  startMockEventLoop: vi.fn((cb) => {
    return vi.fn();
  }),
}));

describe("event-source", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("falls back to mock event loop when NEXT_PUBLIC_CONTROL_PLANE_URL is not set", async () => {
    delete process.env.NEXT_PUBLIC_CONTROL_PLANE_URL;

    const { startMockEventLoop } = await import("../mock-event-loop");
    const { startEventSource: freshStart } = await import("../event-source");

    const callback = vi.fn();
    freshStart(callback);
    expect(startMockEventLoop).toHaveBeenCalledWith(callback);
  });

  it("returns a cleanup function", () => {
    delete process.env.NEXT_PUBLIC_CONTROL_PLANE_URL;
    const callback = vi.fn();
    const cleanup = startEventSource(callback);
    expect(typeof cleanup).toBe("function");
  });
});
