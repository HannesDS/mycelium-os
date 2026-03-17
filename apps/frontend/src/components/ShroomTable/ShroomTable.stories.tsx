import { ShroomTable } from "./ShroomTable";
import type { ShroomSummary } from "@/lib/api";

const meta = {
  component: ShroomTable,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#0a0a0f" }] },
  },
};

export default meta;

const mvpShrooms: ShroomSummary[] = [
  {
    id: "sales-shroom",
    name: "Sales",
    model: "mistral-7b",
    skills: ["prospecting", "outreach"],
    escalates_to: "root-shroom",
    status: "running",
  },
  {
    id: "delivery-shroom",
    name: "Delivery",
    model: "mistral-7b",
    skills: ["project-tracking"],
    escalates_to: "root-shroom",
    status: "running",
  },
  {
    id: "billing-shroom",
    name: "Billing",
    model: "mistral-7b",
    skills: ["invoicing"],
    escalates_to: "root-shroom",
    status: "running",
  },
  {
    id: "compliance-shroom",
    name: "Compliance",
    model: "mistral-7b",
    skills: ["contract-review"],
    escalates_to: "root-shroom",
    status: "running",
  },
  {
    id: "root-shroom",
    name: "CEO",
    model: "mistral-7b",
    skills: ["decision-routing"],
    escalates_to: null,
    status: "running",
  },
];

export const Default = {
  args: {
    shrooms: mvpShrooms,
    onViewManifest: (id: string) => console.log("View manifest:", id),
  },
};

export const MixedStatus = {
  args: {
    shrooms: [
      { ...mvpShrooms[0], status: "running" },
      { ...mvpShrooms[1], status: "stopped" },
      { ...mvpShrooms[2], status: "error" },
      { ...mvpShrooms[3], status: "running" },
      { ...mvpShrooms[4], status: "running" },
    ],
    onViewManifest: (id: string) => console.log("View manifest:", id),
  },
};

export const Empty = {
  args: {
    shrooms: [],
    onViewManifest: () => {},
  },
};

export const SingleShroom = {
  args: {
    shrooms: [mvpShrooms[0]],
    onViewManifest: (id: string) => console.log("View manifest:", id),
  },
};
