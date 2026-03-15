import { IngestPanel } from "./IngestPanel";

const meta = {
  component: IngestPanel,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#0a0a0f" }] },
  },
};

export default meta;

const MVP_SHROOMS = [
  "sales-shroom",
  "delivery-shroom",
  "billing-shroom",
  "compliance-shroom",
  "ceo-shroom",
];

export const TextTab = {
  args: {
    onClose: () => console.log("close"),
    onIngested: (doc: unknown) => console.log("ingested", doc),
    availableShrooms: MVP_SHROOMS,
  },
};

export const WithoutShrooms = {
  args: {
    onClose: () => console.log("close"),
    onIngested: () => {},
    availableShrooms: [],
  },
};
