import { ChatThread } from "./ChatThread";
import type { ChatMessage } from "@/types/chat";

const meta = {
  component: ChatThread,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ height: "600px", background: "#0a0a0f" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

const sampleMessages: ChatMessage[] = [
  {
    id: "m1",
    sender: "human",
    text: "What is your role?",
    timestamp: new Date(Date.now() - 120_000).toISOString(),
  },
  {
    id: "m2",
    sender: "shroom",
    text: "I am the CEO shroom. I receive escalations from all other shrooms, route decisions, and escalate critical matters to the human owner.",
    timestamp: new Date(Date.now() - 110_000).toISOString(),
  },
  {
    id: "m3",
    sender: "human",
    text: "Are there any pending escalations?",
    timestamp: new Date(Date.now() - 60_000).toISOString(),
  },
  {
    id: "m4",
    sender: "shroom",
    text: "Yes, there is one pending escalation from the billing shroom regarding an overdue invoice for client Rabobank. The invoice is 15 days overdue and a chase email has been drafted for your approval.",
    timestamp: new Date(Date.now() - 50_000).toISOString(),
  },
];

export const Empty = {
  args: {
    shroomName: "CEO",
    shroomRole: "root-shroom",
    shroomModel: "mistral-7b",
    messages: [],
    onSend: () => {},
    isLoading: false,
    error: null,
  },
};

export const WithMessages = {
  args: {
    ...Empty.args,
    messages: sampleMessages,
  },
};

export const Loading = {
  args: {
    ...Empty.args,
    messages: [sampleMessages[0]],
    isLoading: true,
  },
};

export const WithError = {
  args: {
    ...Empty.args,
    messages: [sampleMessages[0]],
    error: "Shroom is taking too long to respond. Try again.",
  },
};
