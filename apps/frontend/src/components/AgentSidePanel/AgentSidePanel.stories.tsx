import type { Meta, StoryObj } from "@storybook/react";
import { AgentSidePanel } from "./AgentSidePanel";
import type { AgentState } from "@/lib/mockEventLoop";

const mockAgent: AgentState = {
  id: "sales-agent",
  role: "Sales Development",
  status: "thinking",
  currentTask: "Drafting proposal for Q2 engagement",
  escalatesTo: "ceo-agent",
  lastEvents: [
    {
      agent_id: "sales-agent",
      event: "message_sent",
      timestamp: "2026-03-05T14:30:00.000Z",
      payload_summary: "Lead qualified: Acme Corp, $50k ARR potential",
    },
    {
      agent_id: "sales-agent",
      event: "task_started",
      timestamp: "2026-03-05T14:25:00.000Z",
      payload_summary: "Proposal draft sent for internal review",
    },
    {
      agent_id: "sales-agent",
      event: "task_completed",
      timestamp: "2026-03-05T14:20:00.000Z",
      payload_summary: "Demo booked for Thursday 14:00",
    },
  ],
};

const meta: Meta<typeof AgentSidePanel> = {
  component: AgentSidePanel,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof AgentSidePanel>;

export const Closed: Story = {
  args: {
    agent: mockAgent,
    isOpen: false,
    onClose: () => {},
  },
};

export const Open: Story = {
  args: {
    agent: mockAgent,
    isOpen: true,
    onClose: () => {},
  },
};

export const Idle: Story = {
  args: {
    agent: { ...mockAgent, status: "idle" },
    isOpen: true,
    onClose: () => {},
  },
};

export const Messaging: Story = {
  args: {
    agent: { ...mockAgent, status: "messaging" },
    isOpen: true,
    onClose: () => {},
  },
};
