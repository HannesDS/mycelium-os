import { ManifestPanel } from "./ManifestPanel";
import type { ShroomDetail } from "@/lib/api";

const meta = {
  component: ManifestPanel,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#0a0a0f" }] },
  },
};

export default meta;

const salesDetail: ShroomDetail = {
  id: "sales-shroom",
  name: "Sales",
  model: "mistral-7b",
  skills: ["prospecting", "outreach", "lead-qualification"],
  escalates_to: "root-shroom",
  sla_response_minutes: 60,
  can: [
    { read: ["crm", "emails"] },
    { write: ["draft_emails", "crm_notes"] },
    { propose: ["send_email", "book_meeting"] },
  ],
  cannot: [{ execute: ["send_email", "payments"] }],
  mcps: ["crm-mcp", "email-mcp"],
  status: "running",
};

export const Default = {
  args: {
    detail: salesDetail,
    isOpen: true,
    isLoading: false,
    onClose: () => {},
  },
};

export const Loading = {
  args: {
    detail: null,
    isOpen: true,
    isLoading: true,
    onClose: () => {},
  },
};

export const Closed = {
  args: {
    detail: null,
    isOpen: false,
    isLoading: false,
    onClose: () => {},
  },
};

export const MinimalShroom = {
  args: {
    detail: {
      id: "root-shroom",
      name: "CEO",
      model: "mistral-7b",
      skills: ["decision-routing"],
      escalates_to: null,
      sla_response_minutes: null,
      can: [],
      cannot: [],
      mcps: [],
      status: "running",
    } satisfies ShroomDetail,
    isOpen: true,
    isLoading: false,
    onClose: () => {},
  },
};
