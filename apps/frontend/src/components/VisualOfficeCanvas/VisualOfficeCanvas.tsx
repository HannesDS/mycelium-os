"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Circle, Group, Layer, Rect, Stage, Text } from "react-konva";
import type { AgentEvent } from "@/types/agent-events";
import { ZENIITH_AGENTS } from "@/types/agent-events";
import { startMockEventLoop } from "@/lib/mock-event-loop";
import { AGENT_COLORS } from "./agent-colors";
import type { AgentPosition, Bubble } from "./types";

const BUBBLE_DURATION_MS = 3000;
const DRIFT_INTERVAL_MS = 3000;
const DRIFT_SPEED = 0.4;
const AGENT_RADIUS = 28;
const BUBBLE_PADDING = 12;

function getInitialPositions(width: number, height: number): AgentPosition[] {
  const padding = 120;
  const cols = 4;
  const rows = 2;
  const cellW = (width - padding * 2) / cols;
  const cellH = (height - padding * 2) / rows;
  return ZENIITH_AGENTS.map((agent, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const baseX = padding + cellW * (col + 0.5) + (Math.random() - 0.5) * 40;
    const baseY = padding + cellH * (row + 0.5) + (Math.random() - 0.5) * 40;
    return {
      id: agent.id,
      x: baseX,
      y: baseY,
      vx: (Math.random() - 0.5) * DRIFT_SPEED,
      vy: (Math.random() - 0.5) * DRIFT_SPEED,
      lastDriftAt: Date.now(),
    };
  });
}

function applyDrift(
  positions: AgentPosition[],
  width: number,
  height: number
): AgentPosition[] {
  const padding = 80;
  const now = Date.now();
  return positions.map((p) => {
    let { x, y, vx, vy, lastDriftAt } = p;
    if (now - lastDriftAt > DRIFT_INTERVAL_MS) {
      vx = (Math.random() - 0.5) * DRIFT_SPEED * 2;
      vy = (Math.random() - 0.5) * DRIFT_SPEED * 2;
      lastDriftAt = now;
    }
    x = Math.max(padding, Math.min(width - padding, x + vx));
    y = Math.max(padding, Math.min(height - padding, y + vy));
    if (x <= padding || x >= width - padding) vx = -vx;
    if (y <= padding || y >= height - padding) vy = -vy;
    return { ...p, x, y, vx, vy, lastDriftAt };
  });
}

export function VisualOfficeCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const positionsRef = useRef<AgentPosition[]>([]);
  const [positions, setPositions] = useState<AgentPosition[]>([]);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const bubbleIdRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      setDimensions({ width, height });
      if (positionsRef.current.length === 0) {
        const initial = getInitialPositions(width, height);
        positionsRef.current = initial;
        setPositions(initial);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;
    if (positionsRef.current.length === 0) return;
    const raf = requestAnimationFrame(function tick() {
      positionsRef.current = applyDrift(
        positionsRef.current,
        dimensions.width,
        dimensions.height
      );
      setPositions([...positionsRef.current]);
      requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [dimensions.width, dimensions.height]);

  useEffect(() => {
    const handleEvent = (event: AgentEvent) => {
      const id = `bubble-${++bubbleIdRef.current}`;
      const now = Date.now();
      if (event.event === "message_sent" && event.to) {
        setBubbles((b) => [
          ...b,
          {
            id,
            type: "speech",
            agentId: event.agent_id,
            toAgentId: event.to,
            text: event.payload_summary,
            createdAt: now,
          },
        ]);
      } else if (event.event === "task_started") {
        setBubbles((b) => [
          ...b,
          {
            id,
            type: "thought",
            agentId: event.agent_id,
            text: event.payload_summary,
            createdAt: now,
          },
        ]);
      }
    };
    return startMockEventLoop(handleEvent, 2500);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setBubbles((b) => b.filter((x) => now - x.createdAt < BUBBLE_DURATION_MS));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const agentMap = useMemo(
    () => new Map(positions.map((p) => [p.id, p])),
    [positions]
  );

  const getAgentById = useCallback(
    (id: string) => ZENIITH_AGENTS.find((a) => a.id === id),
    []
  );

  if (dimensions.width === 0 || dimensions.height === 0) {
    return <div ref={containerRef} className="h-full w-full bg-slate-900" />;
  }

  return (
    <div ref={containerRef} className="h-full w-full bg-slate-900">
      <Stage width={dimensions.width} height={dimensions.height}>
        <Layer>
          <Text
            x={dimensions.width / 2 - 100}
            y={24}
            text="Zeniith Studio"
            fontSize={28}
            fontFamily="system-ui"
            fill="#f8fafc"
            width={200}
            align="center"
          />
          {positions.map((pos) => {
            const agent = getAgentById(pos.id);
            const color = AGENT_COLORS[pos.id] ?? "#64748b";
            return (
              <Group key={pos.id} x={pos.x} y={pos.y}>
                <Circle
                  radius={AGENT_RADIUS}
                  fill={color}
                  stroke="#334155"
                  strokeWidth={2}
                />
                <Circle
                  radius={AGENT_RADIUS - 6}
                  fill={color}
                  opacity={0.3}
                />
                <Text
                  y={AGENT_RADIUS + 8}
                  text={agent?.role ?? pos.id}
                  fontSize={12}
                  fontFamily="system-ui"
                  fill="#f8fafc"
                  width={AGENT_RADIUS * 2}
                  align="center"
                  offsetX={AGENT_RADIUS}
                  listening={false}
                />
              </Group>
            );
          })}
          {bubbles.map((bubble) => {
            const fromPos = agentMap.get(bubble.agentId);
            const toPos = bubble.toAgentId ? agentMap.get(bubble.toAgentId) : null;
            if (!fromPos) return null;
            const bubbleWidth = 200;
            const lineHeight = 18;
            const charPerLine = 28;
            const lineCount = Math.ceil(bubble.text.length / charPerLine) || 1;
            const bubbleHeight = lineCount * lineHeight + BUBBLE_PADDING * 2;
            let bx: number;
            let by: number;
            let tailX: number;
            let tailY: number;
            if (bubble.type === "thought") {
              bx = fromPos.x - bubbleWidth / 2;
              by = fromPos.y - AGENT_RADIUS - bubbleHeight - 16;
              tailX = fromPos.x;
              tailY = by + bubbleHeight;
            } else {
              const midX = toPos
                ? (fromPos.x + toPos.x) / 2
                : fromPos.x;
              const midY = toPos
                ? (fromPos.y + toPos.y) / 2
                : fromPos.y;
              bx = midX - bubbleWidth / 2;
              by = Math.min(fromPos.y, toPos?.y ?? fromPos.y) - bubbleHeight - 24;
              tailX = fromPos.x;
              tailY = fromPos.y - AGENT_RADIUS;
            }
            return (
              <Group key={bubble.id}>
                <Rect
                  x={bx}
                  y={by}
                  width={bubbleWidth}
                  height={bubbleHeight}
                  cornerRadius={12}
                  fill="#ffffff"
                  shadowColor="#000"
                  shadowBlur={8}
                  shadowOpacity={0.2}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                />
                <Text
                  x={bx + BUBBLE_PADDING}
                  y={by + BUBBLE_PADDING}
                  text={bubble.text}
                  fontSize={13}
                  fontFamily="system-ui"
                  fill="#1e293b"
                  width={bubbleWidth - BUBBLE_PADDING * 2}
                  wrap="word"
                  lineHeight={1.35}
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}
