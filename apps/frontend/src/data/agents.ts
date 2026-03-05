import type { AgentDefinition } from "@/types/constitution";

export const AGENTS: AgentDefinition[] = [
  { id: "sales-agent", role: "Sales Development", escalates_to: "ceo-agent" },
  { id: "delivery-agent", role: "Delivery Lead", escalates_to: "ceo-agent" },
  { id: "billing-agent", role: "Billing & Finance", escalates_to: "ceo-agent" },
  { id: "compliance-agent", role: "Compliance & Legal", escalates_to: "ceo-agent" },
  { id: "ceo-agent", role: "CEO / Decider", escalates_to: "human" },
];
