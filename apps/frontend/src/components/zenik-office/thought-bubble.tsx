"use client";

import { Group, Rect, Text } from "react-konva";

interface ThoughtBubbleProps {
  x: number;
  y: number;
  message: string;
  opacity: number;
}

const LINE_HEIGHT = 13;
const PADDING = 8;

export function ThoughtBubble({ x, y, message, opacity }: ThoughtBubbleProps) {
  const bubbleY = y + 22;
  const maxWidth = 160;
  const charsPerLine = 28;
  const lines = Math.min(4, Math.max(1, Math.ceil(message.length / charsPerLine)));
  const textHeight = lines * LINE_HEIGHT;
  const height = PADDING * 2 + textHeight;

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
        padding={PADDING}
        width={maxWidth - PADDING * 2}
        lineHeight={LINE_HEIGHT / 10}
        wrap="word"
        align="center"
        x={PADDING}
        y={PADDING}
        listening={false}
      />
    </Group>
  );
}
