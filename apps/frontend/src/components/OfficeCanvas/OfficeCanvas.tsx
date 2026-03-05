"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Stage, Layer, Circle, Text, Group } from "react-konva";
import Konva from "konva";
import { AGENTS, getInitials } from "@/lib/agents";
import {
  subscribe,
  startMockEventLoop,
  getEventsForAgent,
  getCurrentTask,
  getCurrentStatus,
} from "@/lib/mock-event-loop";
import { AgentSidePanel } from "@/components/AgentSidePanel";
import { getAgentById } from "@/lib/agents";

const NODE_RADIUS = 28;
const PADDING = 60;

function getNodePosition(index: number, total: number): { x: number; y: number } {
  const cols = Math.ceil(Math.sqrt(total));
  const row = Math.floor(index / cols);
  const col = index % cols;
  return {
    x: PADDING + col * 100 + NODE_RADIUS,
    y: PADDING + row * 90 + NODE_RADIUS,
  };
}

interface AgentNodeProps {
  agentId: string;
  name: string;
  x: number;
  y: number;
  onClick: () => void;
}

function AgentNode({ agentId, name, x, y, onClick }: AgentNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const circleRef = useRef<Konva.Circle>(null);

  return (
    <Group x={x} y={y} onClick={onClick} onTap={onClick}>
      <Circle
        ref={circleRef}
        radius={NODE_RADIUS}
        fill={isHovered ? "#94a3b8" : "#cbd5e1"}
        stroke="#64748b"
        strokeWidth={2}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        listening
      />
      <Text
        text={getInitials(name)}
        fontSize={14}
        fontStyle="bold"
        fill="#334155"
        align="center"
        verticalAlign="middle"
        width={NODE_RADIUS * 2}
        height={NODE_RADIUS * 2}
        offsetX={NODE_RADIUS}
        offsetY={NODE_RADIUS}
        x={0}
        y={0}
        listening={false}
      />
    </Group>
  );
}

export function OfficeCanvas() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [events, setEvents] = useState<Record<string, ReturnType<typeof getEventsForAgent>>>({});
  const [tasks, setTasks] = useState<Record<string, string | null>>({});
  const [statuses, setStatuses] = useState<Record<string, ReturnType<typeof getCurrentStatus>>>({});
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const stageRef = useRef<Konva.Stage>(null);

  useEffect(() => {
    const update = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const refreshAgentData = useCallback(() => {
    AGENTS.forEach((a) => {
      setEvents((prev) => ({ ...prev, [a.id]: getEventsForAgent(a.id) }));
      setTasks((prev) => ({ ...prev, [a.id]: getCurrentTask(a.id) }));
      setStatuses((prev) => ({ ...prev, [a.id]: getCurrentStatus(a.id) }));
    });
  }, []);

  useEffect(() => {
    refreshAgentData();
    const unsub = subscribe(refreshAgentData);
    const stop = startMockEventLoop(6000);
    return () => {
      unsub();
      stop();
    };
  }, [refreshAgentData]);

  const handleAgentClick = useCallback((agentId: string) => {
    setSelectedAgentId(agentId);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedAgentId(null);
  }, []);

  const selectedAgent = selectedAgentId ? getAgentById(selectedAgentId) : null;

  return (
    <div className="relative h-screen w-full">
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        className="bg-slate-100"
        onClick={(e) => {
          if (e.target === e.target.getStage()) {
            setSelectedAgentId(null);
          }
        }}
      >
        <Layer>
          {AGENTS.map((agent, i) => {
            const pos = getNodePosition(i, AGENTS.length);
            return (
              <AgentNode
                key={agent.id}
                agentId={agent.id}
                name={agent.name}
                x={pos.x}
                y={pos.y}
                onClick={() => handleAgentClick(agent.id)}
              />
            );
          })}
        </Layer>
      </Stage>

      <AgentSidePanel
        agentId={selectedAgentId ?? ""}
        agentName={selectedAgent?.name ?? ""}
        agentRole={selectedAgent?.role ?? ""}
        status={selectedAgentId ? (statuses[selectedAgentId] ?? "idle") : "idle"}
        currentTask={selectedAgentId ? (tasks[selectedAgentId] ?? null) : null}
        recentEvents={selectedAgentId ? (events[selectedAgentId] ?? []) : []}
        onClose={handleClosePanel}
        isOpen={!!selectedAgentId}
      />
    </div>
  );
}
