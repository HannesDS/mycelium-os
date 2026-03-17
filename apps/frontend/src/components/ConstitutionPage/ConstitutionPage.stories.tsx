import { CompanyHeader } from "./CompanyHeader";
import { GraphEdgesList } from "./GraphEdgesList";
import { ShroomManifestAccordion } from "./ShroomManifestAccordion";
import type { ConstitutionData } from "@/lib/api";

const mockData: ConstitutionData = {
  company: { name: "Acme AI Co", instance: "production" },
  shrooms: [
    {
      id: "sales-shroom",
      manifest: {
        name: "Sales Development",
        model: "mistral-7b",
        skills: ["lead_qualification", "proposal_drafting"],
        escalates_to: "root-shroom",
        sla_response_minutes: 60,
        can: [
          { read: ["crm", "emails"] },
          { write: ["draft_emails", "crm_notes"] },
          { propose: ["send_email", "book_meeting"] },
        ],
        cannot: [{ execute: ["send_email", "payments"] }],
        mcps: ["crm", "email"],
      },
    },
    {
      id: "delivery-shroom",
      manifest: {
        name: "Delivery Management",
        model: "mistral-7b",
        skills: ["project_tracking", "delay_detection"],
        escalates_to: "root-shroom",
        sla_response_minutes: 120,
        can: [{ read: ["project_board", "timesheets"] }],
        cannot: [{ execute: ["payments"] }],
        mcps: ["project-mcp"],
      },
    },
    {
      id: "billing-shroom",
      manifest: {
        name: "Billing Operations",
        model: "mistral-7b",
        skills: ["invoice_tracking", "payment_follow_up"],
        escalates_to: "root-shroom",
        sla_response_minutes: 180,
        can: [
          { read: ["invoices", "payments"] },
          { propose: ["chase_email"] },
        ],
        cannot: [{ execute: ["payments", "refunds"] }],
        mcps: ["billing-mcp"],
      },
    },
    {
      id: "compliance-shroom",
      manifest: {
        name: "Compliance Officer",
        model: "mistral-7b",
        skills: ["contract_review", "renewal_tracking"],
        escalates_to: "root-shroom",
        sla_response_minutes: 240,
        can: [{ read: ["contracts", "regulations"] }],
        cannot: [{ execute: ["sign_contract"] }],
        mcps: [],
      },
    },
    {
      id: "root-shroom",
      manifest: {
        name: "CEO",
        model: "mistral-7b",
        skills: ["decision_routing"],
        escalates_to: null,
        sla_response_minutes: null,
        can: [],
        cannot: [],
        mcps: [],
      },
    },
  ],
  graph: {
    edges: [
      { from: "sales-shroom", to: "root-shroom", type: "reports-to" },
      { from: "delivery-shroom", to: "root-shroom", type: "reports-to" },
      { from: "billing-shroom", to: "root-shroom", type: "reports-to" },
      { from: "compliance-shroom", to: "root-shroom", type: "reports-to" },
    ],
  },
};

function ConstitutionPageLayout({ data }: { data: ConstitutionData }) {
  return (
    <div className="h-full bg-[#0a0a0f]">
      <div className="mx-auto max-w-4xl px-6 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-white">Constitution</h1>
          <p className="mt-1 text-sm text-neutral-400">
            The source of truth — mycelium.yaml
          </p>
        </div>
        <div className="space-y-6">
          <CompanyHeader
            name={data.company.name}
            instance={data.company.instance}
          />
          <GraphEdgesList edges={data.graph.edges} />
          <ShroomManifestAccordion shrooms={data.shrooms} />
        </div>
      </div>
    </div>
  );
}

const meta = {
  title: "Pages/ConstitutionPage",
  component: ConstitutionPageLayout,
  parameters: {
    layout: "fullscreen",
    backgrounds: {
      default: "dark",
      values: [{ name: "dark", value: "#0a0a0f" }],
    },
  },
};

export default meta;

export const Default = {
  args: { data: mockData },
};

export const DevInstance = {
  args: {
    data: {
      ...mockData,
      company: { name: "Acme AI Co", instance: "dev" },
    },
  },
};

export const StagingInstance = {
  args: {
    data: {
      ...mockData,
      company: { name: "Acme AI Co", instance: "staging" },
    },
  },
};

export const NoEdges = {
  args: {
    data: {
      ...mockData,
      graph: { edges: [] },
    },
  },
};

export const SingleShroom = {
  args: {
    data: {
      ...mockData,
      shrooms: [mockData.shrooms[4]],
      graph: { edges: [] },
    },
  },
};
