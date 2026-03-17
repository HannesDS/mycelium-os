export type { ShroomEvent, ShroomEventType } from "@mycelium/shroom-events";

export interface ZenikShroom {
  id: string;
  role: string;
  escalatesTo: string;
  displayName: string;
}

export const ZENIK_SHROOMS: ZenikShroom[] = [
  { id: "sales-shroom", role: "Sales Development", escalatesTo: "root-shroom", displayName: "Sales" },
  { id: "delivery-shroom", role: "Delivery Lead", escalatesTo: "root-shroom", displayName: "Delivery" },
  { id: "billing-shroom", role: "Billing & Finance", escalatesTo: "root-shroom", displayName: "Billing" },
  { id: "compliance-shroom", role: "Compliance & Legal", escalatesTo: "root-shroom", displayName: "Compliance" },
  { id: "root-shroom", role: "CEO / Decider", escalatesTo: "human", displayName: "CEO" },
];
