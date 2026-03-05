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
  const midY = (fromY + toY) / 2 - 80;
  const maxWidth = 200;
  const padding = 12;
  const lineHeight = 16;
  const lines = message.split(/\s+/).reduce<string[]>((acc, word) => {
    const last = acc[acc.length - 1] ?? "";
    const test = last ? `${last} ${word}` : word;
    if (test.length > 28) acc.push(word);
    else acc[acc.length - 1] = test;
    return acc;
  }, []);
  const textHeight = Math.min(lines.length * lineHeight, 80);
  const width = maxWidth;
  const height = textHeight + padding * 2;

  return (
    <Group opacity={opacity} listening={false} x={midX - width / 2} y={midY}>
      <Rect
        width={width}
        height={height}
        fill="rgba(30, 41, 59, 0.95)"
        stroke="#475569"
        strokeWidth={1}
        cornerRadius={8}
        shadowColor="black"
        shadowBlur={8}
        shadowOpacity={0.3}
      />
      <Text
        text={message}
        fontSize={12}
        fontFamily="system-ui"
        fill="#e2e8f0"
        padding={padding}
        width={width - padding * 2}
        wrap="word"
        align="center"
        x={padding}
        y={padding}
      />
    </Group>
  );
}
