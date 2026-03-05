import { fn } from "@storybook/test";
import { HumanInboxCard } from "./HumanInboxCard";

export default {
  component: HumanInboxCard,
  parameters: { layout: "centered" },
};

export const Default = {
  args: {
    from: "sales-agent",
    to: "ceo-agent",
    proposalSummary: "Approve sending proposal to Acme Corp?",
    onApprove: fn(),
    onReject: fn(),
  },
};
