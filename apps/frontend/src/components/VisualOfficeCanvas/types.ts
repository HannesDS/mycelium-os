export interface AgentPosition {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  lastDriftAt: number;
}

export interface Bubble {
  id: string;
  type: "speech" | "thought";
  agentId: string;
  toAgentId?: string;
  text: string;
  createdAt: number;
}
