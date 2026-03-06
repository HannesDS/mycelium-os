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

const LINE_HEIGHT = 14;
const PADDING = 10;

export function SpeechBubble({ fromX, fromY, toX, toY, message, opacity }: SpeechBubbleProps) {
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2 + 30;
  const maxWidth = 200;
  const charsPerLine = 32;
  const lines = Math.min(5, Math.max(1, Math.ceil(message.length / charsPerLine)));
  const textHeight = lines * LINE_HEIGHT;
  const height = PADDING * 2 + textHeight;

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
        padding={PADDING}
        width={maxWidth - PADDING * 2}
        lineHeight={LINE_HEIGHT / 11}
        wrap="word"
        align="center"
        x={PADDING}
        y={PADDING}
        listening={false}
      />
    </Group>
  );
}
