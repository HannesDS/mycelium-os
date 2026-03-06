export interface Agent {
  id: string;
  role: string;
  x: number;
  y: number;
}

export const AGENTS: Agent[] = [
  { id: "sales-agent", role: "Sales Development", x: 150, y: 200 },
  { id: "delivery-agent", role: "Delivery Lead", x: 350, y: 150 },
  { id: "billing-agent", role: "Billing & Finance", x: 350, y: 250 },
  { id: "compliance-agent", role: "Compliance & Legal", x: 550, y: 150 },
  { id: "ceo-agent", role: "CEO / Decider", x: 400, y: 100 },
];
