"use client";

import { Group, Line, Text } from "react-konva";
import type { ZenikAgent } from "@/types/agent-events";

interface AgentNodeProps {
  agent: ZenikAgent;
  x: number;
  y: number;
  driftX: number;
  driftY: number;
  t: number;
}

const BLOB_RADIUS = 10;
const BLOB_POINTS = 12;

function getBlobPoints(t: number, seed: number): number[] {
  const points: number[] = [];
  for (let i = 0; i < BLOB_POINTS; i++) {
    const angle = (i / BLOB_POINTS) * Math.PI * 2 + t * 0.001;
    const noise = 1 + 0.25 * Math.sin(t * 0.003 + seed + i * 1.2) + 0.15 * Math.sin(t * 0.005 + i * 0.8);
    const r = BLOB_RADIUS * noise;
    points.push(r * Math.cos(angle), r * Math.sin(angle));
  }
  return points;
}

export function AgentNode({ agent, x, y, driftX, driftY, t }: AgentNodeProps) {
  const cx = x + driftX;
  const cy = y + driftY;
  const seed = agent.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const points = getBlobPoints(t, seed);

  return (
    <Group x={cx} y={cy}>
      <Line
        points={points}
        tension={0.5}
        closed
        fill="#ffffff"
        stroke="#333333"
        strokeWidth={1}
        listening={false}
      />
      <Text
        text={agent.role}
        fontSize={9}
        fontFamily="system-ui"
        fill="#999999"
        align="center"
        y={BLOB_RADIUS + 2}
        width={BLOB_RADIUS * 2}
        offsetX={BLOB_RADIUS}
        x={-BLOB_RADIUS}
        listening={false}
      />
    </Group>
  );
}
