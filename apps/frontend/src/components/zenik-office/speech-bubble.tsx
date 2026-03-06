"use client";

import { Group, Rect, Text } from "react-konva";

interface SpeechBubbleProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  message: string;
  opacity: number;
}

export function SpeechBubble({ fromX, fromY, toX, toY, message, opacity }: SpeechBubbleProps) {
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2 + 30;
  const maxWidth = 180;
  const padding = 10;
  const height = 36;

  return (
    <Group opacity={opacity} listening={false} x={midX - maxWidth / 2} y={midY}>
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
        fontSize={11}
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
