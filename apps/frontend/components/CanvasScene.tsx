"use client";

import { useState, useEffect } from "react";
import { Stage, Layer } from "react-konva";
import { AgentNode } from "./AgentNode";
import { EscalationPulse } from "./EscalationPulse";

export interface CanvasSceneProps {
  salesAgentPos: { x: number; y: number };
  ceoAgentPos: { x: number; y: number };
  escalationPulseActive: boolean;
  ceoEscalating: boolean;
  ceoThoughtBubble: string | null;
  salesSpeechBubble: string | null;
}

export default function CanvasScene({
  salesAgentPos,
  ceoAgentPos,
  escalationPulseActive,
  ceoEscalating,
  ceoThoughtBubble,
  salesSpeechBubble,
}: CanvasSceneProps) {
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });

  useEffect(() => {
    const update = () =>
      setDimensions({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <Stage width={dimensions.w} height={dimensions.h}>
      <Layer>
        <EscalationPulse
          fromX={salesAgentPos.x}
          fromY={salesAgentPos.y}
          toX={ceoAgentPos.x}
          toY={ceoAgentPos.y}
          active={escalationPulseActive}
        />
        <AgentNode
          x={salesAgentPos.x}
          y={salesAgentPos.y}
          id="sales-agent"
          label="Sales"
          speechBubble={salesSpeechBubble ?? undefined}
        />
        <AgentNode
          x={ceoAgentPos.x}
          y={ceoAgentPos.y}
          id="ceo-agent"
          label="CEO"
          isEscalating={ceoEscalating}
          thoughtBubble={ceoThoughtBubble ?? undefined}
        />
      </Layer>
    </Stage>
  );
}
