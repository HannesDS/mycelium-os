import { AgentSidePanel } from "./AgentSidePanel";

const meta = {
  component: AgentSidePanel,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

const mockEvents = [
  {
    agent_id: "compliance-agent",
    event: "task_started",
    timestamp: new Date(Date.now() - 120000).toISOString(),
    payload_summary: "Reviewing DORA compliance checklist for client Rabobank",
  },
  {
    agent_id: "compliance-agent",
    event: "message_sent",
    timestamp: new Date(Date.now() - 300000).toISOString(),
    payload_summary: "Contract renewal flagged for Q2",
  },
  {
    agent_id: "compliance-agent",
    event: "escalation_raised",
    timestamp: new Date(Date.now() - 600000).toISOString(),
    payload_summary: "Terms review needed for new vendor",
  },
  {
    agent_id: "compliance-agent",
    event: "task_completed",
    timestamp: new Date(Date.now() - 900000).toISOString(),
    payload_summary: "DORA checklist completed",
  },
  {
    agent_id: "compliance-agent",
    event: "idle",
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    payload_summary: "Awaiting next review",
  },
];

export const Default = {
  args: {
    agentId: "compliance-agent",
    agentName: "Casey",
    agentRole: "Compliance & Legal",
    status: "working",
    currentTask: "Reviewing DORA compliance checklist for client Rabobank",
    recentEvents: mockEvents,
    onClose: () => {},
    isOpen: true,
  },
};

export const Idle = {
  args: {
    ...Default.args,
    status: "idle",
    currentTask: null,
    recentEvents: mockEvents.slice(1),
  },
};

export const InConversation = {
  args: {
    ...Default.args,
    agentName: "Maya",
    agentRole: "Sales Development",
    status: "in conversation",
    currentTask: "Drafting proposal for Acme Corp",
    recentEvents: mockEvents.slice(0, 3),
  },
};

export const EmptyActivity = {
  args: {
    ...Default.args,
    agentName: "Chris",
    agentRole: "CEO / Decider",
    status: "idle",
    currentTask: null,
    recentEvents: [],
  },
};
