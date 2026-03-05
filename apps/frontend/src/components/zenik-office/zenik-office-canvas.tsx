"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Layer, Stage } from "react-konva";
import type { AgentEvent } from "@/types/agent-events";
import { ZENIK_AGENTS } from "@/types/agent-events";
import { getAgentColor } from "./agent-node";
import { AgentNode } from "./agent-node";
import { SpeechBubble } from "./speech-bubble";
import { ThoughtBubble } from "./thought-bubble";
import { startMockEventLoop } from "@/lib/mock-event-loop";

const AGENT_POSITIONS: Record<string, { x: number; y: number }> = {
  "ceo-agent": { x: 0.88, y: 0.12 },
  "product-agent": { x: 0.18, y: 0.22 },
  "eng-agent": { x: 0.12, y: 0.5 },
  "design-agent": { x: 0.22, y: 0.1 },
  "sales-agent": { x: 0.88, y: 0.48 },
  "support-agent": { x: 0.5, y: 0.38 },
  "compliance-agent": { x: 0.82, y: 0.12 },
  "marketing-agent": { x: 0.78, y: 0.78 },
};

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

export function ZenikOfficeCanvas() {
  const [dimensions, setDimensions] = useState({ width: 1280, height: 720 });
  const [speechBubbles, setSpeechBubbles] = useState<ActiveSpeech[]>([]);
  const [thoughtBubbles, setThoughtBubbles] = useState<ActiveThought[]>([]);
  const [pulse, setPulse] = useState(0);
  const [drift, setDrift] = useState<Record<string, { x: number; y: number }>>({});
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

  useAnimationFrame((t) => {
    setPulse(1 + 0.03 * Math.sin(t * 0.002));
    setDrift((prev) => {
      const next = { ...prev };
      for (const agent of ZENIK_AGENTS) {
        const d = next[agent.id] ?? { x: 0, y: 0 };
        next[agent.id] = {
          x: 2 * Math.sin(t * 0.001 + agent.id.length) + Math.sin(t * 0.0007) * 1.5,
          y: 2 * Math.cos(t * 0.0012 + agent.id.length * 0.7) + Math.cos(t * 0.0008) * 1.5,
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
      return toPx(pos.x, pos.y);
    },
    [toPx]
  );

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0a0a0f]">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute top-6 left-8 z-10">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Zenik</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          AI-native compliance for European fintechs
        </p>
      </div>
      <Stage width={dimensions.width} height={dimensions.height} className="absolute inset-0">
        <Layer>
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
            const d = drift[agent.id] ?? { x: 0, y: 0 };
            return (
              <AgentNode
                key={agent.id}
                agent={agent}
                x={pos.x}
                y={pos.y}
                pulseScale={pulse}
                driftX={d.x}
                driftY={d.y}
                color={getAgentColor(agent.id)}
              />
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}
