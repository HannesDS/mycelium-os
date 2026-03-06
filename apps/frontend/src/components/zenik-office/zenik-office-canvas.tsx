"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Layer, Line, Stage } from "react-konva";
import type { AgentEvent } from "@/types/agent-events";
import { ZENIK_AGENTS } from "@/types/agent-events";
import { AgentNode } from "./agent-node";
import { SpeechBubble } from "./speech-bubble";
import { ThoughtBubble } from "./thought-bubble";
import {
  startMockEventLoop,
  injectEvent,
  getEventsForAgent,
  getCurrentTask,
  getCurrentStatus,
} from "@/lib/mock-event-loop";
import { AgentSidePanel } from "@/components/AgentSidePanel";
import { HumanInboxCard } from "@/components/HumanInboxCard";

const MENU_ZONE = { x: 0.78, y: 0, w: 0.22, h: 0.18 };
const OFFICE_BOUNDS = { xMin: 0.08, xMax: 0.78, yMin: 0.12, yMax: 0.92 };

const AGENT_POSITIONS: Record<string, { x: number; y: number }> = {
  "ceo-agent": { x: 0.65, y: 0.25 },
  "product-agent": { x: 0.2, y: 0.3 },
  "eng-agent": { x: 0.15, y: 0.55 },
  "design-agent": { x: 0.25, y: 0.2 },
  "sales-agent": { x: 0.68, y: 0.55 },
  "support-agent": { x: 0.45, y: 0.45 },
  "compliance-agent": { x: 0.6, y: 0.25 },
  "marketing-agent": { x: 0.55, y: 0.75 },
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
  agentId: string;
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

const ESCALATION_PAYLOAD = "New enterprise lead — Triodos Bank. Proposal ready for approval.";
const CEO_THOUGHT = "Reviewing proposal...";
const APPROVED_MESSAGE = "Proposal approved — sending to Triodos Bank";
const REJECTED_MESSAGE = "Proposal rejected — following up with CEO";

type EscalationPhase = "idle" | "escalating" | "ceo_reviewing" | "inbox_visible" | "resolved";

export function ZenikOfficeCanvas() {
  const [dimensions, setDimensions] = useState({ width: 1280, height: 720 });
  const [speechBubbles, setSpeechBubbles] = useState<ActiveSpeech[]>([]);
  const [thoughtBubbles, setThoughtBubbles] = useState<ActiveThought[]>([]);
  const [t, setT] = useState(0);
  const [drift, setDrift] = useState<Record<string, { x: number; y: number }>>({});
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [escalationPhase, setEscalationPhase] = useState<EscalationPhase>("idle");
  const [inboxVisible, setInboxVisible] = useState(false);
  const [inboxDismissing, setInboxDismissing] = useState(false);
  const bubbleIdRef = useRef(0);

  const toPx = useCallback(
    (px: number, py: number) => ({
      x: px * dimensions.width,
      y: py * dimensions.height,
    }),
    [dimensions]
  );

  useEffect(() => {
    const onResize = () => {
      const w = Math.max(320, window.innerWidth);
      const h = Math.max(240, window.innerHeight);
      setDimensions({ width: w, height: h });
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const unsub = startMockEventLoop((event: AgentEvent) => {
      if (event.event === "message_sent" && event.to) {
        const to = event.to;
        setSpeechBubbles((prev) => {
          const next = [
            ...prev,
            {
              id: `s-${++bubbleIdRef.current}`,
              from: event.agent_id,
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
              agentId: event.agent_id,
              message: event.payload_summary,
              opacity: 0,
              createdAt: Date.now(),
            },
          ];
          return next.slice(-THOUGHT_MAX);
        });
      }
    });
    return unsub;
  }, []);

  useAnimationFrame((time) => {
    setT(time);
    setDrift((prev) => {
      const next = { ...prev };
      for (const agent of ZENIK_AGENTS) {
        next[agent.id] = {
          x: DRIFT_AMOUNT * Math.sin(time * 0.001 + agent.id.length) + Math.sin(time * 0.0007) * 4,
          y: DRIFT_AMOUNT * Math.cos(time * 0.0012 + agent.id.length * 0.7) + Math.cos(time * 0.0008) * 4,
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

  const getAgentPos = useCallback(
    (agentId: string) => {
      const pos = AGENT_POSITIONS[agentId];
      if (!pos) return { x: 0, y: 0 };
      const base = toPx(pos.x, pos.y);
      const d = drift[agentId] ?? { x: 0, y: 0 };
      return clampInBounds(base.x, base.y, d.x, d.y, dimensions.width, dimensions.height);
    },
    [toPx, drift, dimensions]
  );

  const triggerEscalation = useCallback(() => {
    if (escalationPhase !== "idle") return;
    setEscalationPhase("escalating");
    injectEvent({
      agent_id: "sales-agent",
      event: "escalation_raised",
      to: "ceo-agent",
      topic: "lead_qualified",
      timestamp: new Date().toISOString(),
      payload_summary: ESCALATION_PAYLOAD,
    });
    injectEvent({
      agent_id: "sales-agent",
      event: "message_sent",
      to: "ceo-agent",
      topic: "lead_qualified",
      timestamp: new Date().toISOString(),
      payload_summary: ESCALATION_PAYLOAD,
    });
    setSpeechBubbles((prev) => [
      ...prev,
      {
        id: `s-${++bubbleIdRef.current}`,
        from: "sales-agent",
        to: "ceo-agent",
        message: ESCALATION_PAYLOAD,
        opacity: 0,
        createdAt: Date.now(),
      },
    ].slice(-SPEECH_MAX));
    setTimeout(() => {
      setEscalationPhase("ceo_reviewing");
      injectEvent({
        agent_id: "ceo-agent",
        event: "message_sent",
        to: "sales-agent",
        topic: "proposal_review",
        timestamp: new Date().toISOString(),
        payload_summary: CEO_THOUGHT,
      });
      setThoughtBubbles((prev) => [
        ...prev,
        {
          id: `t-${++bubbleIdRef.current}`,
          agentId: "ceo-agent",
          message: CEO_THOUGHT,
          opacity: 0,
          createdAt: Date.now(),
        },
      ].slice(-THOUGHT_MAX));
    }, 2000);
    setTimeout(() => {
      setInboxVisible(true);
      setEscalationPhase("inbox_visible");
    }, 4000);
  }, [escalationPhase]);

  const handleApprove = useCallback(() => {
    setInboxDismissing(true);
    injectEvent({
      agent_id: "sales-agent",
      event: "decision_received",
      topic: "proposal_approved",
      timestamp: new Date().toISOString(),
      payload_summary: APPROVED_MESSAGE,
      metadata: { approved: true },
    });
    setTimeout(() => {
      setInboxVisible(false);
      setInboxDismissing(false);
      setEscalationPhase("idle");
    }, 600);
  }, []);

  const handleReject = useCallback(() => {
    setInboxDismissing(true);
    injectEvent({
      agent_id: "sales-agent",
      event: "decision_received",
      topic: "proposal_rejected",
      timestamp: new Date().toISOString(),
      payload_summary: REJECTED_MESSAGE,
      metadata: { approved: false },
    });
    setTimeout(() => {
      setInboxVisible(false);
      setInboxDismissing(false);
      setEscalationPhase("idle");
    }, 600);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0d0d0d]">
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
            setSelectedAgentId(null);
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
            const fromPos = getAgentPos(b.from);
            const toPos = getAgentPos(b.to);
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
            const pos = getAgentPos(b.agentId);
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
          {ZENIK_AGENTS.map((agent) => {
            const pos = getAgentPos(agent.id);
            const basePos = AGENT_POSITIONS[agent.id];
            const base = basePos ? toPx(basePos.x, basePos.y) : { x: 0, y: 0 };
            const d = drift[agent.id] ?? { x: 0, y: 0 };
            const clamped = clampInBounds(
              base.x,
              base.y,
              d.x,
              d.y,
              dimensions.width,
              dimensions.height
            );
            return (
              <AgentNode
                key={agent.id}
                agent={agent}
                x={clamped.x}
                y={clamped.y}
                driftX={0}
                driftY={0}
                t={t}
                onClick={() => setSelectedAgentId(agent.id)}
              />
            );
          })}
        </Layer>
      </Stage>
      {selectedAgentId && (
        <AgentSidePanel
          agentId={selectedAgentId}
          agentName={
            ZENIK_AGENTS.find((a) => a.id === selectedAgentId)?.displayName ?? ""
          }
          agentRole={
            ZENIK_AGENTS.find((a) => a.id === selectedAgentId)?.role ?? ""
          }
          status={getCurrentStatus(selectedAgentId)}
          currentTask={getCurrentTask(selectedAgentId)}
          recentEvents={getEventsForAgent(selectedAgentId)}
          onClose={() => setSelectedAgentId(null)}
          isOpen={!!selectedAgentId}
        />
      )}
      <button
        type="button"
        className="fixed bottom-6 right-6 z-20 px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        onClick={triggerEscalation}
        disabled={escalationPhase !== "idle"}
      >
        Trigger escalation
      </button>
      <HumanInboxCard
        isVisible={inboxVisible}
        isDismissing={inboxDismissing}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
