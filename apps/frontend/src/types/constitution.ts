export interface AgentDefinition {
  id: string;
  role: string;
  model?: string;
  can?: unknown[];
  cannot?: unknown[];
  escalates_to?: string;
  sla_response_minutes?: number;
}

export interface Constitution {
  company: { name: string; instance: string };
  agents: AgentDefinition[];
  graph?: { edges: { from: string; to: string; type: string }[] };
}
