"use client";

import { Group, Circle, Text } from "react-konva";
import type { AgentState } from "@/lib/mockEventLoop";

interface AgentNodeProps {
  agent: AgentState;
  x: number;
  y: number;
  onClick: () => void;
}

export function AgentNode({ agent, x, y, onClick }: AgentNodeProps) {
  const radius = 28;
  const fill =
    agent.status === "idle"
      ? "#94a3b8"
      : agent.status === "thinking"
        ? "#f59e0b"
        : "#3b82f6";

  return (
    <Group x={x} y={y} onClick={onClick} onTap={onClick}>
      <Circle
        radius={radius}
        fill={fill}
        stroke="#1e293b"
        strokeWidth={2}
        listening
      />
      <Text
        text={agent.id.replace(/-agent$/, "")}
        fontSize={10}
        fontFamily="sans-serif"
        fill="white"
        width={radius * 2}
        align="center"
        verticalAlign="middle"
        offsetX={radius}
        offsetY={8}
        listening={false}
      />
    </Group>
  );
}
