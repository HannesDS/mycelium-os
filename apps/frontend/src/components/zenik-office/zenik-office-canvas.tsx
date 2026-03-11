"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Layer, Line, Stage } from "react-konva";
import type { ShroomEvent } from "@/types/shroom-events";
import { ZENIK_SHROOMS } from "@/types/shroom-events";
import { ShroomNode } from "./shroom-node";
import { SpeechBubble } from "./speech-bubble";
import { ThoughtBubble } from "./thought-bubble";
import { approveProposal, rejectProposal, triggerEscalation } from "@/lib/api";
import { startEventSource } from "@/lib/event-source";
import { ShroomSidePanel } from "@/components/ShroomSidePanel";
import { HumanInboxCard } from "@/components/HumanInboxCard";

const MENU_ZONE = { x: 0.78, y: 0, w: 0.22, h: 0.18 };
const OFFICE_BOUNDS = { xMin: 0.08, xMax: 0.78, yMin: 0.12, yMax: 0.92 };

const SHROOM_POSITIONS: Record<string, { x: number; y: number }> = {
  "sales-shroom": { x: 0.2, y: 0.35 },
  "delivery-shroom": { x: 0.4, y: 0.55 },
  "billing-shroom": { x: 0.6, y: 0.55 },
  "compliance-shroom": { x: 0.25, y: 0.7 },
  "ceo-shroom": { x: 0.55, y: 0.3 },
};

const WALLS: { x1: number; y1: number; x2: number; y2: number }[] = [
  { x1: 0.15, y1: 0.15, x2: 0.78, y2: 0.15 },
  { x1: 0.15, y1: 0.15, x2: 0.15, y2: 0.85 },
  { x1: 0.15, y1: 0.85, x2: 0.78, y2: 0.85 },
  { x1: 0.78, y1: 0.15, x2: 0.78, y2: 0.85 },
  { x1: 0.4, y1: 0.15, x2: 0.4, y2: 0.5 },
  { x1: 0.4, y1: 0.5, x2: 0.78, y2: 0.5 },
];

interface ActiveSpeech {
  id: string;
  from: string;
  to: string;
  message: string;
  opacity: number;
  createdAt: number;
}

interface ActiveThought {
  id: string;
  shroomId: string;
  message: string;
  opacity: number;
  createdAt: number;
}

const BUBBLE_DURATION_MS = 7000;
const FADE_OUT_MS = 500;
const SPEECH_MAX = 4;
const THOUGHT_MAX = 3;
const DRIFT_AMOUNT = 8;

function useAnimationFrame(callback: (t: number) => void) {
  const rafRef = useRef<number>();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const tick = (t: number) => {
      callbackRef.current(t);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);
}

function clampInBounds(
  baseX: number,
  baseY: number,
  driftX: number,
  driftY: number,
  w: number,
  h: number
): { x: number; y: number } {
  const xMin = OFFICE_BOUNDS.xMin * w;
  const xMax = OFFICE_BOUNDS.xMax * w;
  const yMin = OFFICE_BOUNDS.yMin * h;
  const yMax = OFFICE_BOUNDS.yMax * h;
  const x = baseX + driftX;
  const y = baseY + driftY;
  return {
    x: Math.max(xMin, Math.min(xMax, x)),
    y: Math.max(yMin, Math.min(yMax, y)),
  };
}

type EscalationPhase = "idle" | "escalating" | "ceo_reviewing" | "inbox_visible" | "resolved";

export function ZenikOfficeCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1280, height: 720 });
  const [speechBubbles, setSpeechBubbles] = useState<ActiveSpeech[]>([]);
  const [thoughtBubbles, setThoughtBubbles] = useState<ActiveThought[]>([]);
  const [t, setT] = useState(0);
  const [drift, setDrift] = useState<Record<string, { x: number; y: number }>>({});
  const [selectedShroomId, setSelectedShroomId] = useState<string | null>(null);
  const [escalationPhase, setEscalationPhase] = useState<EscalationPhase>("idle");
  const [inboxVisible, setInboxVisible] = useState(false);
  const [inboxDismissing, setInboxDismissing] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<{
    approvalId: string;
    summary: string;
  } | null>(null);
  const [shroomEventHistory, setShroomEventHistory] = useState<
    Record<string, ShroomEvent[]>
  >({});
  const bubbleIdRef = useRef(0);

  const getEventsForShroom = useCallback(
    (shroomId: string) =>
      (shroomEventHistory[shroomId] ?? []).slice(0, 5),
    [shroomEventHistory],
  );
  const getCurrentTask = useCallback(
    (shroomId: string) => {
      const history = shroomEventHistory[shroomId] ?? [];
      const last = history[0];
      if (!last || last.event === "idle") return null;
      return last.payload_summary;
    },
    [shroomEventHistory],
  );
  const getCurrentStatus = useCallback(
    (
      shroomId: string,
    ): "idle" | "working" | "in conversation" => {
      const history = shroomEventHistory[shroomId] ?? [];
      const last = history[0];
      if (!last) return "idle";
      if (last.event === "idle") return "idle";
      if (
        last.event === "message_sent" ||
        last.event === "decision_received"
      )
        return "in conversation";
      return "working";
    },
    [shroomEventHistory],
  );

  const toPx = useCallback(
    (px: number, py: number) => ({
      x: px * dimensions.width,
      y: py * dimensions.height,
    }),
    [dimensions]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const w = Math.max(320, el.clientWidth);
      const h = Math.max(240, el.clientHeight);
      setDimensions({ width: w, height: h });
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const apiKey = process.env.NEXT_PUBLIC_DEV_API_KEY;

  useEffect(() => {
    const unsub = startEventSource(
      (event: ShroomEvent) => {
        setShroomEventHistory((prev) => {
        const history = prev[event.shroom_id] ?? [];
        const next = [event, ...history].slice(0, 20);
        return { ...prev, [event.shroom_id]: next };
      });
      if (event.event === "message_sent" && event.to) {
        const to = event.to;
        setSpeechBubbles((prev) => {
          const next = [
            ...prev,
            {
              id: `s-${++bubbleIdRef.current}`,
              from: event.shroom_id,
              to,
              message: event.payload_summary,
              opacity: 0,
              createdAt: Date.now(),
            },
          ];
          return next.slice(-SPEECH_MAX);
        });
      }
      if (event.event === "task_started") {
        setThoughtBubbles((prev) => {
          const next = [
            ...prev,
            {
              id: `t-${++bubbleIdRef.current}`,
              shroomId: event.shroom_id,
              message: event.payload_summary,
              opacity: 0,
              createdAt: Date.now(),
            },
          ];
          return next.slice(-THOUGHT_MAX);
        });
      }
    },
      apiKey
    );
    return unsub;
  }, [apiKey]);

  useAnimationFrame((time) => {
    setT(time);
    setDrift((prev) => {
      const next = { ...prev };
      for (const shroom of ZENIK_SHROOMS) {
        next[shroom.id] = {
          x: DRIFT_AMOUNT * Math.sin(time * 0.001 + shroom.id.length) + Math.sin(time * 0.0007) * 4,
          y: DRIFT_AMOUNT * Math.cos(time * 0.0012 + shroom.id.length * 0.7) + Math.cos(time * 0.0008) * 4,
        };
      }
      return next;
    });

    const now = Date.now();
    setSpeechBubbles((prev) =>
      prev
        .map((b) => {
          const age = now - b.createdAt;
          if (age > BUBBLE_DURATION_MS) return null;
          const fadeOutStart = BUBBLE_DURATION_MS - FADE_OUT_MS;
          let opacity = 1;
          if (age < 300) opacity = age / 300;
          else if (age > fadeOutStart) opacity = (BUBBLE_DURATION_MS - age) / FADE_OUT_MS;
          return { ...b, opacity };
        })
        .filter((b): b is ActiveSpeech => b !== null)
    );
    setThoughtBubbles((prev) =>
      prev
        .map((b) => {
          const age = now - b.createdAt;
          if (age > BUBBLE_DURATION_MS) return null;
          const fadeOutStart = BUBBLE_DURATION_MS - FADE_OUT_MS;
          let opacity = 1;
          if (age < 300) opacity = age / 300;
          else if (age > fadeOutStart) opacity = (BUBBLE_DURATION_MS - age) / FADE_OUT_MS;
          return { ...b, opacity };
        })
        .filter((b): b is ActiveThought => b !== null)
    );
  });

  const getShroomPos = useCallback(
    (shroomId: string) => {
      const pos = SHROOM_POSITIONS[shroomId];
      if (!pos) return { x: 0, y: 0 };
      const base = toPx(pos.x, pos.y);
      const d = drift[shroomId] ?? { x: 0, y: 0 };
      return clampInBounds(base.x, base.y, d.x, d.y, dimensions.width, dimensions.height);
    },
    [toPx, drift, dimensions]
  );

  const notifyBadgeRefresh = useCallback(() => {
    window.dispatchEvent(new CustomEvent("approvals-updated"));
  }, []);

  const onTriggerEscalation = useCallback(async () => {
    if (escalationPhase !== "idle") return;
    setEscalationPhase("escalating");
    try {
      const { approval_id, summary } = await triggerEscalation(apiKey);
      setPendingApproval({ approvalId: approval_id, summary });
      setInboxVisible(true);
      setEscalationPhase("inbox_visible");
      notifyBadgeRefresh();
    } catch {
      setEscalationPhase("idle");
    }
  }, [escalationPhase, notifyBadgeRefresh, apiKey]);

  const handleApprove = useCallback(async () => {
    if (!pendingApproval) return;
    setInboxDismissing(true);
    try {
      await approveProposal(pendingApproval.approvalId);
      notifyBadgeRefresh();
    } finally {
      setInboxVisible(false);
      setInboxDismissing(false);
      setEscalationPhase("idle");
      setPendingApproval(null);
    }
  }, [pendingApproval, notifyBadgeRefresh]);

  const handleReject = useCallback(async () => {
    if (!pendingApproval) return;
    setInboxDismissing(true);
    try {
      await rejectProposal(pendingApproval.approvalId);
      notifyBadgeRefresh();
    } finally {
      setInboxVisible(false);
      setInboxDismissing(false);
      setEscalationPhase("idle");
      setPendingApproval(null);
    }
  }, [pendingApproval, notifyBadgeRefresh]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-[#0d0d0d]">
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute top-6 left-8 z-10">
        <h1 className="text-xl font-medium text-white tracking-tight">Zenik</h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          AI-native compliance for European fintechs
        </p>
      </div>
      <div className="absolute top-6 right-8 z-10 w-24 h-8 border border-neutral-600 rounded flex items-center justify-center text-neutral-500 text-xs">
        Menu
      </div>
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0"
        onClick={(e) => {
          if (e.target === e.target.getStage()) {
            setSelectedShroomId(null);
          }
        }}
      >
        <Layer>
          {WALLS.map((wall, i) => (
            <Line
              key={i}
              points={[
                wall.x1 * dimensions.width,
                wall.y1 * dimensions.height,
                wall.x2 * dimensions.width,
                wall.y2 * dimensions.height,
              ]}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={1}
              listening={false}
            />
          ))}
          {speechBubbles.map((b) => {
            const fromPos = getShroomPos(b.from);
            const toPos = getShroomPos(b.to);
            return (
              <SpeechBubble
                key={b.id}
                fromX={fromPos.x}
                fromY={fromPos.y}
                toX={toPos.x}
                toY={toPos.y}
                message={b.message}
                opacity={b.opacity}
              />
            );
          })}
          {thoughtBubbles.map((b) => {
            const pos = getShroomPos(b.shroomId);
            return (
              <ThoughtBubble
                key={b.id}
                x={pos.x}
                y={pos.y}
                message={b.message}
                opacity={b.opacity}
              />
            );
          })}
          {ZENIK_SHROOMS.map((shroom) => {
            const pos = getShroomPos(shroom.id);
            const basePos = SHROOM_POSITIONS[shroom.id];
            const base = basePos ? toPx(basePos.x, basePos.y) : { x: 0, y: 0 };
            const d = drift[shroom.id] ?? { x: 0, y: 0 };
            const clamped = clampInBounds(
              base.x,
              base.y,
              d.x,
              d.y,
              dimensions.width,
              dimensions.height
            );
            return (
              <ShroomNode
                key={shroom.id}
                shroom={shroom}
                x={clamped.x}
                y={clamped.y}
                driftX={0}
                driftY={0}
                t={t}
                onClick={() => setSelectedShroomId(shroom.id)}
              />
            );
          })}
        </Layer>
      </Stage>
      {selectedShroomId && (
        <ShroomSidePanel
          shroomId={selectedShroomId}
          shroomName={
            ZENIK_SHROOMS.find((a) => a.id === selectedShroomId)?.displayName ?? ""
          }
          shroomRole={
            ZENIK_SHROOMS.find((a) => a.id === selectedShroomId)?.role ?? ""
          }
          status={getCurrentStatus(selectedShroomId)}
          currentTask={getCurrentTask(selectedShroomId)}
          recentEvents={getEventsForShroom(selectedShroomId)}
          onClose={() => setSelectedShroomId(null)}
          isOpen={!!selectedShroomId}
        />
      )}
      <button
        type="button"
        className="absolute bottom-6 right-6 z-20 px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        onClick={onTriggerEscalation}
        disabled={escalationPhase !== "idle"}
      >
        Trigger escalation
      </button>
      <HumanInboxCard
        isVisible={inboxVisible}
        isDismissing={inboxDismissing}
        title="Decision required"
        from="Sales Shroom"
        summary={pendingApproval?.summary ?? ""}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
