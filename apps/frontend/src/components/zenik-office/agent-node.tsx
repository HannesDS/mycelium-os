"use client";

import { Circle, Group, Text } from "react-konva";
import type { ZenikAgent } from "@/types/agent-events";

interface AgentNodeProps {
  agent: ZenikAgent;
  x: number;
  y: number;
  pulseScale: number;
  driftX: number;
  driftY: number;
  color: string;
}

const INITIAL_COLORS: Record<string, string> = {
  "ceo-agent": "#6366f1",
  "product-agent": "#8b5cf6",
  "eng-agent": "#06b6d4",
  "design-agent": "#ec4899",
  "sales-agent": "#f59e0b",
  "support-agent": "#10b981",
  "compliance-agent": "#3b82f6",
  "marketing-agent": "#84cc16",
};

export function AgentNode({
  agent,
  x,
  y,
  pulseScale,
  driftX,
  driftY,
  color,
}: AgentNodeProps) {
  const initials = agent.displayName.slice(0, 2).toUpperCase();
  const cx = x + driftX;
  const cy = y + driftY;
  const radius = 24;

  return (
    <Group x={cx} y={cy} scaleX={pulseScale} scaleY={pulseScale} offsetX={radius} offsetY={radius}>
      <Circle radius={radius} fill={color} stroke="#374151" strokeWidth={2} />
      <Text
        text={initials}
        fontSize={14}
        fontFamily="system-ui"
        fill="white"
        align="center"
        verticalAlign="middle"
        width={radius * 2}
        height={radius * 2}
        offsetX={radius}
        offsetY={radius}
        x={-radius}
        y={-radius}
        listening={false}
      />
      <Text
        text={agent.role}
        fontSize={11}
        fontFamily="system-ui"
        fill="#9ca3af"
        align="center"
        y={radius + 4}
        width={radius * 2}
        offsetX={radius}
        x={-radius}
        listening={false}
      />
    </Group>
  );
}

export function getAgentColor(agentId: string): string {
  return INITIAL_COLORS[agentId] ?? "#6b7280";
}
