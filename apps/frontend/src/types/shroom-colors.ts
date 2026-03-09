export type ShroomId =
  | "sales-shroom"
  | "delivery-shroom"
  | "billing-shroom"
  | "compliance-shroom"
  | "ceo-shroom";

export const SHROOM_COLORS: Record<ShroomId, string> = {
  "sales-shroom": "#6366f1",
  "delivery-shroom": "#f59e0b",
  "billing-shroom": "#10b981",
  "compliance-shroom": "#ef4444",
  "ceo-shroom": "#8b5cf6",
};
