"use client";

import { useState } from "react";
import { Circle, Ellipse, Group, Line, Rect, Text } from "react-konva";
import type { ZenikShroom } from "@/types/shroom-events";
import { SHROOM_COLORS } from "@/types/shroom-colors";

interface ShroomNodeProps {
  shroom: ZenikShroom;
  x: number;
  y: number;
  driftX: number;
  driftY: number;
  t: number;
  onClick?: () => void;
}

interface MushroomDesign {
  capRx: number;
  capRy: number;
  stemW: number;
  stemH: number;
  dots: Array<{ x: number; y: number; r: number }>;
  hasCrown: boolean;
}

const DESIGNS: Record<string, MushroomDesign> = {
  "sales-shroom": {
    capRx: 14,
    capRy: 9,
    stemW: 8,
    stemH: 18,
    dots: [
      { x: -5, y: -2, r: 1.8 },
      { x: 3, y: -5, r: 2.2 },
      { x: 8, y: -1, r: 1.5 },
    ],
    hasCrown: false,
  },
  "delivery-shroom": {
    capRx: 18,
    capRy: 7,
    stemW: 10,
    stemH: 16,
    dots: [
      { x: -8, y: -1, r: 2.5 },
      { x: 5, y: -3, r: 2 },
    ],
    hasCrown: false,
  },
  "billing-shroom": {
    capRx: 13,
    capRy: 9,
    stemW: 7,
    stemH: 18,
    dots: [
      { x: -4, y: -3, r: 1.8 },
      { x: 4, y: -2, r: 1.8 },
    ],
    hasCrown: false,
  },
  "compliance-shroom": {
    capRx: 12,
    capRy: 9,
    stemW: 7,
    stemH: 20,
    dots: [],
    hasCrown: false,
  },
  "ceo-shroom": {
    capRx: 19,
    capRy: 11,
    stemW: 10,
    stemH: 20,
    dots: [
      { x: -10, y: -1, r: 2 },
      { x: -3, y: -5, r: 2.5 },
      { x: 5, y: -4, r: 2 },
      { x: 11, y: -1, r: 2 },
    ],
    hasCrown: true,
  },
};

const DEFAULT_DESIGN: MushroomDesign = {
  capRx: 13,
  capRy: 9,
  stemW: 8,
  stemH: 18,
  dots: [],
  hasCrown: false,
};

function lighten(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const c = (v: number) => Math.round(Math.max(0, Math.min(255, v)));
  return `#${[c(r + (255 - r) * amount), c(g + (255 - g) * amount), c(b + (255 - b) * amount)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

function darken(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const c = (v: number) => Math.round(Math.max(0, Math.min(255, v)));
  return `#${[c(r * (1 - amount)), c(g * (1 - amount)), c(b * (1 - amount))]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

function getCrownPoints(capRx: number, topY: number): number[] {
  const h = 5;
  const w = capRx * 0.7;
  const base = topY + 1;
  const tip = topY - h;
  return [
    -w, base,
    -w * 0.55, tip,
    -w * 0.15, base,
    0, tip + 1,
    w * 0.15, base,
    w * 0.55, tip,
    w, base,
  ];
}

export function ShroomNode({ shroom, x, y, driftX, driftY, t, onClick }: ShroomNodeProps) {
  const [hovered, setHovered] = useState(false);
  const cx = x + driftX;
  const cy = y + driftY;
  const seed = shroom.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const color = SHROOM_COLORS[shroom.id] ?? "#888888";
  const design = DESIGNS[shroom.id] ?? DEFAULT_DESIGN;

  const wobble = Math.sin(t * 0.002 + seed) * 1.5;
  const breathe = 1 + 0.025 * Math.sin(t * 0.003 + seed * 0.5);

  const totalH = design.capRy + design.stemH;
  const capCenterY = -(totalH / 2) + design.capRy;
  const labelY = totalH / 2 + 4;

  const stemColor = lighten(color, 0.75);
  const capStroke = darken(color, 0.3);
  const dotColor = lighten(color, 0.45);

  return (
    <Group
      x={cx}
      y={cy}
      onClick={onClick}
      onTap={onClick}
      listening={!!onClick}
      onMouseEnter={(e) => {
        setHovered(true);
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = "pointer";
      }}
      onMouseLeave={(e) => {
        setHovered(false);
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = "default";
      }}
    >
      <Rect
        x={-design.capRx}
        y={-totalH / 2}
        width={design.capRx * 2}
        height={totalH + 18}
        fill="#000"
        opacity={0}
      />
      <Rect
        x={-design.stemW / 2}
        y={capCenterY}
        width={design.stemW}
        height={design.stemH}
        fill={stemColor}
        stroke={darken(stemColor, 0.15)}
        strokeWidth={0.5}
        cornerRadius={[0, 0, design.stemW * 0.3, design.stemW * 0.3]}
        listening={false}
      />
      <Ellipse
        x={0}
        y={capCenterY}
        radiusX={design.capRx * breathe}
        radiusY={design.capRy * breathe}
        fill={color}
        stroke={capStroke}
        strokeWidth={1}
        rotation={wobble}
        shadowColor={color}
        shadowBlur={hovered ? 12 : 0}
        shadowOpacity={hovered ? 0.6 : 0}
        listening={false}
      />
      {design.dots.map((dot, i) => (
        <Circle
          key={i}
          x={dot.x}
          y={capCenterY + dot.y}
          radius={dot.r}
          fill={dotColor}
          opacity={0.7}
          listening={false}
        />
      ))}
      {design.hasCrown && (
        <Line
          points={getCrownPoints(design.capRx, capCenterY - design.capRy * breathe)}
          fill="#fbbf24"
          stroke="#f59e0b"
          strokeWidth={0.5}
          closed
          listening={false}
        />
      )}
      <Text
        text={shroom.role}
        fontSize={9}
        fontFamily="system-ui"
        fill="#999999"
        align="center"
        y={labelY}
        width={80}
        offsetX={40}
        wrap="none"
        ellipsis
        listening={false}
      />
    </Group>
  );
}
