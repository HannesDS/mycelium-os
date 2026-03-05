"use client";

import { Group, Circle, Text, Rect } from "react-konva";

export interface AgentNodeProps {
  x: number;
  y: number;
  id: string;
  label: string;
  isEscalating?: boolean;
  speechBubble?: string;
  thoughtBubble?: string;
}

const NODE_RADIUS = 40;
const BUBBLE_WIDTH = 160;
const BUBBLE_PADDING = 10;

export function AgentNode({
  x,
  y,
  id,
  label,
  isEscalating = false,
  speechBubble,
  thoughtBubble,
}: AgentNodeProps) {
  const bubble = speechBubble ?? thoughtBubble;

  return (
    <Group x={x} y={y}>
      <Circle
        radius={NODE_RADIUS}
        fill={isEscalating ? "#fef3c7" : "#e0e7ff"}
        stroke={isEscalating ? "#f59e0b" : "#6366f1"}
        strokeWidth={isEscalating ? 4 : 2}
        shadowColor={isEscalating ? "#f59e0b" : "black"}
        shadowBlur={isEscalating ? 15 : 0}
        shadowOpacity={isEscalating ? 0.5 : 0}
      />
      <Text
        text={label}
        fontSize={12}
        fontFamily="system-ui"
        fill="#374151"
        width={NODE_RADIUS * 2}
        align="center"
        offsetX={NODE_RADIUS}
        offsetY={-8}
        y={NODE_RADIUS - 8}
      />
      {bubble && (
        <Group y={-NODE_RADIUS - 80}>
          <Rect
            x={-BUBBLE_WIDTH / 2}
            y={0}
            width={BUBBLE_WIDTH}
            height={60}
            fill="white"
            stroke="#e5e7eb"
            strokeWidth={1}
            cornerRadius={8}
            shadowColor="black"
            shadowBlur={4}
            shadowOpacity={0.1}
          />
          <Text
            text={bubble}
            fontSize={11}
            fontFamily="system-ui"
            fill="#1f2937"
            width={BUBBLE_WIDTH - BUBBLE_PADDING * 2}
            align="center"
            x={-BUBBLE_WIDTH / 2 + BUBBLE_PADDING}
            y={BUBBLE_PADDING}
            wrap="word"
            lineHeight={1.3}
          />
        </Group>
      )}
    </Group>
  );
}
