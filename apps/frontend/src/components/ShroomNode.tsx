"use client";

import { Group, Circle, Text, Rect } from "react-konva";
import type { Shroom } from "@/types/shrooms";

interface ShroomNodeProps {
  shroom: Shroom;
  speechBubble?: string | null;
  pulse?: boolean | "green" | "red" | "none";
}

export function ShroomNode({ shroom, speechBubble, pulse = "none" }: ShroomNodeProps) {
  const isPulsing = pulse === true || pulse === "green" || pulse === "red";
  const pulseColor =
    pulse === "green" ? "#22c55e" : pulse === "red" ? "#ef4444" : "#6366f1";

  return (
    <Group x={shroom.x} y={shroom.y}>
      {speechBubble && (
        <Group y={-50} x={0}>
          <Rect
            x={-100}
            y={0}
            width={200}
            height={36}
            cornerRadius={8}
            fill="#1a1a2e"
            stroke="#2d2d44"
            listening={false}
          />
          <Rect
            x={-8}
            y={32}
            width={16}
            height={10}
            fill="#1a1a2e"
            listening={false}
          />
          <Text
            x={-90}
            y={8}
            width={180}
            height={20}
            text={speechBubble}
            fontSize={11}
            fill="#cbd5e1"
            align="center"
            wrap="word"
            ellipsis
            listening={false}
          />
        </Group>
      )}
      <Circle
        radius={isPulsing ? 28 : 24}
        fill={isPulsing ? pulseColor : "transparent"}
        opacity={isPulsing ? 0.3 : 0}
        listening={false}
      />
      <Circle radius={22} fill="#2d2d44" stroke="#6366f1" strokeWidth={2} />
      <Text
        x={-40}
        y={-8}
        width={80}
        text={shroom.id.replace("-shroom", "")}
        fontSize={10}
        fill="#94a3b8"
        align="center"
        listening={false}
      />
    </Group>
  );
}
