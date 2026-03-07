export type { ShroomEvent, ShroomEventType } from "@mycelium/shroom-events";

export interface ZenikShroom {
  id: string;
  role: string;
  escalatesTo: string;
  displayName: string;
}

export const ZENIK_SHROOMS: ZenikShroom[] = [
  { id: "sales-shroom", role: "Sales Development", escalatesTo: "ceo-shroom", displayName: "Sales" },
  { id: "delivery-shroom", role: "Delivery Lead", escalatesTo: "ceo-shroom", displayName: "Delivery" },
  { id: "billing-shroom", role: "Billing & Finance", escalatesTo: "ceo-shroom", displayName: "Billing" },
  { id: "compliance-shroom", role: "Compliance & Legal", escalatesTo: "ceo-shroom", displayName: "Compliance" },
  { id: "ceo-shroom", role: "CEO / Decider", escalatesTo: "human", displayName: "CEO" },
];
