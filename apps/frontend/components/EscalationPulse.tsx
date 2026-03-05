"use client";

import { useEffect, useState } from "react";
import { Line } from "react-konva";

export interface EscalationPulseProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  active: boolean;
}

export function EscalationPulse({
  fromX,
  fromY,
  toX,
  toY,
  active,
}: EscalationPulseProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = requestAnimationFrame(function animate() {
      setPhase((p) => (p + 0.02) % 1);
      if (active) requestAnimationFrame(animate);
    });
    return () => cancelAnimationFrame(id);
  }, [active]);

  if (!active) return null;

  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  const pulseX = fromX + (toX - fromX) * phase;
  const pulseY = fromY + (toY - fromY) * phase;

  return (
    <>
      <Line
        points={[fromX, fromY, toX, toY]}
        stroke="#f59e0b"
        strokeWidth={2}
        opacity={0.3}
        dash={[8, 8]}
      />
      <Line
        points={[fromX, fromY, pulseX, pulseY]}
        stroke="#f59e0b"
        strokeWidth={3}
        lineCap="round"
      />
      <Line
        points={[midX - 4, midY - 4, midX + 4, midY + 4]}
        stroke="#f59e0b"
        strokeWidth={2}
      />
      <Line
        points={[midX + 4, midY - 4, midX - 4, midY + 4]}
        stroke="#f59e0b"
        strokeWidth={2}
      />
    </>
  );
}
