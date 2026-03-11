import type { ShroomEvent } from "@/types/shroom-events";
import { getEvents } from "./api";
import { startMockEventLoop } from "./mock-event-loop";

const WS_RECONNECT_INTERVAL = 3000;
const WS_MAX_RECONNECT_ATTEMPTS = 10;
const BACKFILL_LIMIT = 100;

function getWsUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_CONTROL_PLANE_URL;
  if (!base) return null;
  const cleaned = base.replace(/\/$/, "");
  const wsProto = cleaned.startsWith("https") ? "wss" : "ws";
  const host = cleaned.replace(/^https?:\/\//, "");
  return `${wsProto}://${host}/ws/events`;
}

function eventKey(e: ShroomEvent): string {
  return `${e.shroom_id}|${e.event}|${e.timestamp}`;
}

export type EventCallback = (event: ShroomEvent) => void;

export function startEventSource(callback: EventCallback, apiKey?: string): () => void {
  const wsUrl = getWsUrl();

  if (!wsUrl) {
    return startMockEventLoop(callback);
  }

  return startWebSocketEventLoop(wsUrl, callback, apiKey);
}

function startWebSocketEventLoop(
  url: string,
  callback: EventCallback,
  apiKey?: string
): () => void {
  let ws: WebSocket | null = null;
  let attempts = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;
  let mockCleanup: (() => void) | null = null;
  const seenKeys = new Set<string>();

  function emitDeduped(event: ShroomEvent) {
    const key = eventKey(event);
    if (seenKeys.has(key)) return;
    seenKeys.add(key);
    callback(event);
  }

  async function runBackfill() {
    try {
      const events = await getEvents({ limit: BACKFILL_LIMIT }, apiKey);
      for (const e of events) {
        if (stopped) return;
        const ev: ShroomEvent = {
          shroom_id: e.shroom_id,
          event: e.event as ShroomEvent["event"],
          to: e.to ?? undefined,
          topic: e.topic ?? undefined,
          timestamp: e.timestamp,
          payload_summary: e.payload_summary,
          metadata: e.metadata ?? undefined,
        };
        emitDeduped(ev);
      }
    } catch {
      // backfill failed, continue with live only
    }
  }

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
      runBackfill();
    };

    ws.onmessage = (msg) => {
      try {
        const event: ShroomEvent = JSON.parse(msg.data);
        emitDeduped(event);
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
