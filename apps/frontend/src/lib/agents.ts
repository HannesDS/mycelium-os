import type { AgentConfig } from "@/types/agent-event";

export const AGENTS: AgentConfig[] = [
  { id: "sales-agent", role: "Sales Development", name: "Maya" },
  { id: "delivery-agent", role: "Delivery Lead", name: "Drew" },
  { id: "billing-agent", role: "Billing & Finance", name: "Blake" },
  { id: "compliance-agent", role: "Compliance & Legal", name: "Casey" },
  { id: "ceo-agent", role: "CEO / Decider", name: "Chris" },
];

export function getAgentById(id: string): AgentConfig | undefined {
  return AGENTS.find((a) => a.id === id);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
