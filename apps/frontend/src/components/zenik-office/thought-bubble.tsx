"use client";

import { Group, Rect, Text } from "react-konva";

interface ThoughtBubbleProps {
  x: number;
  y: number;
  message: string;
  opacity: number;
}

export function ThoughtBubble({ x, y, message, opacity }: ThoughtBubbleProps) {
  const bubbleY = y + 22;
  const maxWidth = 140;
  const padding = 8;
  const height = 36;

  return (
    <Group opacity={opacity} listening={false} x={x - maxWidth / 2} y={bubbleY}>
      <Rect
        width={maxWidth}
        height={height}
        fill="#1a1a1a"
        stroke="#666666"
        strokeWidth={1}
        cornerRadius={4}
      />
      <Text
        text={message}
        fontSize={10}
        fontFamily="system-ui"
        fill="#e0e0e0"
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
