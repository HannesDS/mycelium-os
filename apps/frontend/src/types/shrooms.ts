export interface Shroom {
  id: string;
  role: string;
  x: number;
  y: number;
}

export const SHROOMS: Shroom[] = [
  { id: "sales-shroom", role: "Sales Development", x: 150, y: 200 },
  { id: "delivery-shroom", role: "Delivery Lead", x: 350, y: 150 },
  { id: "billing-shroom", role: "Billing & Finance", x: 350, y: 250 },
  { id: "compliance-shroom", role: "Compliance & Legal", x: 550, y: 150 },
  { id: "root-shroom", role: "CEO / Decider", x: 400, y: 100 },
];
