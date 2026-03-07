import type { ShroomEvent } from "@/types/shroom-events";
import { startMockEventLoop, type MockEventCallback } from "./mock-event-loop";

const WS_RECONNECT_INTERVAL = 3000;
const WS_MAX_RECONNECT_ATTEMPTS = 10;

function getWsUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_CONTROL_PLANE_URL;
  if (!base) return null;
  const cleaned = base.replace(/\/$/, "");
  const wsProto = cleaned.startsWith("https") ? "wss" : "ws";
  const host = cleaned.replace(/^https?:\/\//, "");
  return `${wsProto}://${host}/ws/events`;
}

export type EventCallback = (event: ShroomEvent) => void;

export function startEventSource(callback: EventCallback): () => void {
  const wsUrl = getWsUrl();

  if (!wsUrl) {
    return startMockEventLoop(callback);
  }

  return startWebSocketEventLoop(wsUrl, callback);
}

function startWebSocketEventLoop(
  url: string,
  callback: EventCallback
): () => void {
  let ws: WebSocket | null = null;
  let attempts = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;
  let mockCleanup: (() => void) | null = null;

  function connect() {
    if (stopped) return;

    try {
      ws = new WebSocket(url);
    } catch {
      fallbackToMock();
      return;
    }

    ws.onopen = () => {
      attempts = 0;
      if (mockCleanup) {
        mockCleanup();
        mockCleanup = null;
      }
    };

    ws.onmessage = (msg) => {
      try {
        const event: ShroomEvent = JSON.parse(msg.data);
        callback(event);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (stopped) return;
      scheduleReconnect();
    };

    ws.onerror = () => {
      ws?.close();
    };
  }

  function scheduleReconnect() {
    if (stopped) return;
    attempts++;
    if (attempts > WS_MAX_RECONNECT_ATTEMPTS) {
      fallbackToMock();
      return;
    }
    reconnectTimer = setTimeout(connect, WS_RECONNECT_INTERVAL);
  }

  function fallbackToMock() {
    if (!mockCleanup && !stopped) {
      mockCleanup = startMockEventLoop(callback);
    }
  }

  connect();

  return () => {
    stopped = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (ws) {
      ws.onclose = null;
      ws.close();
    }
    if (mockCleanup) mockCleanup();
  };
}
