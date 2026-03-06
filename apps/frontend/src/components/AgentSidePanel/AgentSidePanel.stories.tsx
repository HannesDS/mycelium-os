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
    event: "task_started" as const,
    topic: "working",
    timestamp: new Date(Date.now() - 120000).toISOString(),
    payload_summary: "Reviewing DORA compliance checklist for client Rabobank",
  },
  {
    agent_id: "compliance-agent",
    event: "message_sent" as const,
    topic: "conversation",
    timestamp: new Date(Date.now() - 300000).toISOString(),
    payload_summary: "Contract renewal flagged for Q2",
  },
  {
    agent_id: "compliance-agent",
    event: "escalation_raised" as const,
    topic: "escalation",
    timestamp: new Date(Date.now() - 600000).toISOString(),
    payload_summary: "Terms review needed for new vendor",
  },
  {
    agent_id: "compliance-agent",
    event: "task_completed" as const,
    topic: "working",
    timestamp: new Date(Date.now() - 900000).toISOString(),
    payload_summary: "DORA checklist completed",
  },
  {
    agent_id: "compliance-agent",
    event: "idle" as const,
    topic: "idle",
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    payload_summary: "Awaiting next review",
  },
];

export const Default = {
  args: {
    agentId: "compliance-agent",
    agentName: "Compliance",
    agentRole: "Compliance Officer",
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
    agentName: "Sales",
    agentRole: "Sales Lead",
    status: "in conversation",
    currentTask: "Drafting proposal for Acme Corp",
    recentEvents: mockEvents.slice(0, 3),
  },
};

export const EmptyActivity = {
  args: {
    ...Default.args,
    agentName: "CEO",
    agentRole: "CEO",
    status: "idle",
    currentTask: null,
    recentEvents: [],
  },
};
