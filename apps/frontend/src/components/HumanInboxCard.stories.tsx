import type { Meta, StoryObj } from "@storybook/react";
import { HumanInboxCard } from "./HumanInboxCard";

const meta: Meta<typeof HumanInboxCard> = {
  component: HumanInboxCard,
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof HumanInboxCard>;

export const Default: Story = {
  args: {
    isVisible: true,
    isDismissing: false,
    onApprove: () => {},
    onReject: () => {},
  },
};

export const ApproveState: Story = {
  args: {
    ...Default.args,
    initialStatus: "approved",
  },
};

export const RejectState: Story = {
  args: {
    ...Default.args,
    initialStatus: "rejected",
  },
};

export const Hidden: Story = {
  args: {
    isVisible: false,
    isDismissing: false,
    onApprove: () => {},
    onReject: () => {},
  },
};
