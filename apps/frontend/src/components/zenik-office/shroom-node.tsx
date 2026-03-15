"use client";

import { Group, Line, Rect, Text } from "react-konva";
import type { ZenikShroom } from "@/types/shroom-events";

interface ShroomNodeProps {
  shroom: ZenikShroom;
  x: number;
  y: number;
  driftX: number;
  driftY: number;
  t: number;
  onClick?: () => void;
}

const BLOB_RADIUS = 10;
const BLOB_POINTS = 12;

function getBlobPoints(t: number, seed: number): number[] {
  const points: number[] = [];
  for (let i = 0; i < BLOB_POINTS; i++) {
    const angle = (i / BLOB_POINTS) * Math.PI * 2 + t * 0.001;
    const noise = 1 + 0.25 * Math.sin(t * 0.003 + seed + i * 1.2) + 0.15 * Math.sin(t * 0.005 + i * 0.8);
    const r = BLOB_RADIUS * noise;
    points.push(r * Math.cos(angle), r * Math.sin(angle));
  }
  return points;
}

export function ShroomNode({ shroom, x, y, driftX, driftY, t, onClick }: ShroomNodeProps) {
  const cx = x + driftX;
  const cy = y + driftY;
  const seed = shroom.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const points = getBlobPoints(t, seed);

  const hitW = 80;
  const hitH = BLOB_RADIUS * 2 + 20;

  return (
    <Group x={cx} y={cy} onClick={onClick} onTap={onClick} listening={!!onClick}>
      <Rect
        x={-hitW / 2}
        y={-BLOB_RADIUS}
        width={hitW}
        height={hitH}
        fill="transparent"
        listening={!!onClick}
      />
      <Line
        points={points}
        tension={0.5}
        closed
        fill="#ffffff"
        stroke="#333333"
        strokeWidth={1}
        listening={false}
      />
      <Text
        text={shroom.role}
        fontSize={9}
        fontFamily="system-ui"
        fill="#999999"
        align="center"
        y={BLOB_RADIUS + 2}
        width={80}
        offsetX={40}
        x={-40}
        wrap="none"
        ellipsis
        listening={false}
      />
    </Group>
  );
}
