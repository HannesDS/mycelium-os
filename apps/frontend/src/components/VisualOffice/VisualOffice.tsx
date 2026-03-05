"use client";

import { useEffect, useState, useCallback } from "react";
import { Stage, Layer } from "react-konva";
import { AgentNode } from "./AgentNode";
import { AgentSidePanel } from "@/components/AgentSidePanel";
import { AGENTS } from "@/data/agents";
import {
  type AgentState,
  createMockAgentStates,
  runMockEventLoop,
} from "@/lib/mockEventLoop";

const POSITIONS: Record<string, [number, number]> = {
  "sales-agent": [120, 100],
  "delivery-agent": [120, 200],
  "billing-agent": [120, 300],
  "compliance-agent": [120, 400],
  "ceo-agent": [320, 250],
};

export function VisualOffice() {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [agentStates, setAgentStates] = useState<AgentState[]>(() =>
    createMockAgentStates(AGENTS, new Map())
  );
  const [selectedAgent, setSelectedAgent] = useState<AgentState | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const update = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const history = new Map<string, import("@/types/events").AgentEvent[]>();
    return runMockEventLoop(AGENTS, history, setAgentStates);
  }, []);

  const handleAgentClick = useCallback((agent: AgentState) => {
    setSelectedAgent(agent);
    setPanelOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setPanelOpen(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  return (
    <div className="relative w-full h-screen bg-slate-100">
      <Stage width={dimensions.width} height={dimensions.height}>
        <Layer>
          {agentStates.map((agent) => {
            const [x, y] = POSITIONS[agent.id] ?? [0, 0];
            return (
              <AgentNode
                key={agent.id}
                agent={agent}
                x={x}
                y={y}
                onClick={() => handleAgentClick(agent)}
              />
            );
          })}
        </Layer>
      </Stage>
      <AgentSidePanel
        agent={selectedAgent}
        isOpen={panelOpen}
        onClose={handleClose}
      />
    </div>
  );
}
