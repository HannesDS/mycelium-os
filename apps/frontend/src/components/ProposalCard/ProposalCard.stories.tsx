import type { Meta, StoryObj } from "@storybook/react";
import { ProposalCard } from "./ProposalCard";
import type { ApprovalItem } from "@/lib/api";

const pendingApproval: ApprovalItem = {
  id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  shroom_id: "sales-shroom",
  event_type: "escalation_raised",
  summary: "Send proposal email to Acme Corp lead",
  payload: {
    lead: "Acme Corp",
    action: "send_email",
    template: "enterprise_proposal_v2",
  },
  status: "pending",
  created_at: new Date(Date.now() - 15 * 60_000).toISOString(),
  resolved_at: null,
  resolved_by: null,
};

const approvedApproval: ApprovalItem = {
  ...pendingApproval,
  id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  shroom_id: "billing-shroom",
  summary: "Send overdue invoice reminder to client X",
  status: "approved",
  resolved_at: new Date(Date.now() - 5 * 60_000).toISOString(),
  resolved_by: "human",
};

const rejectedApproval: ApprovalItem = {
  ...pendingApproval,
  id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
  shroom_id: "compliance-shroom",
  summary: "Flag contract renewal for Acme Corp",
  status: "rejected",
  resolved_at: new Date(Date.now() - 2 * 60_000).toISOString(),
  resolved_by: "human",
};

const noop = async () => {};

const meta: Meta<typeof ProposalCard> = {
  component: ProposalCard,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#0a0a0f" }] },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 600, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof ProposalCard>;

export const Pending: Story = {
  args: {
    approval: pendingApproval,
    onApprove: noop,
    onReject: noop,
  },
};

export const Approved: Story = {
  args: {
    approval: approvedApproval,
    onApprove: noop,
    onReject: noop,
  },
};

export const Rejected: Story = {
  args: {
    approval: rejectedApproval,
    onApprove: noop,
    onReject: noop,
  },
};

export const WithError: Story = {
  args: {
    approval: pendingApproval,
    onApprove: async () => {
      throw new Error("Approval already approved");
    },
    onReject: noop,
  },
};

export const NoPayload: Story = {
  args: {
    approval: { ...pendingApproval, payload: null },
    onApprove: noop,
    onReject: noop,
  },
};
