"use client";

import { Group, Rect, Text } from "react-konva";

interface ThoughtBubbleProps {
  x: number;
  y: number;
  message: string;
  opacity: number;
}

export function ThoughtBubble({ x, y, message, opacity }: ThoughtBubbleProps) {
  const bubbleY = y - 75;
  const maxWidth = 160;
  const padding = 10;

  return (
    <Group opacity={opacity} listening={false} x={x - maxWidth / 2} y={bubbleY}>
      <Rect
        width={maxWidth}
        height={44}
        fill="rgba(51, 65, 85, 0.95)"
        stroke="#64748b"
        strokeWidth={1}
        cornerRadius={12}
        shadowColor="black"
        shadowBlur={6}
        shadowOpacity={0.2}
      />
      <Text
        text={message}
        fontSize={11}
        fontFamily="system-ui"
        fill="#cbd5e1"
        padding={padding}
        width={maxWidth - padding * 2}
        wrap="word"
        align="center"
        x={padding}
        y={padding}
      />
    </Group>
  );
}
