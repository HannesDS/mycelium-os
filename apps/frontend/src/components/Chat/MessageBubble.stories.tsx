import { MessageBubble } from "./MessageBubble";

const meta = {
  component: MessageBubble,
  parameters: { layout: "centered" },
};

export default meta;

export const HumanMessage = {
  args: {
    message: {
      id: "m1",
      sender: "human" as const,
      text: "What is your role in the organisation?",
      timestamp: new Date().toISOString(),
    },
  },
};

export const ShroomMessage = {
  args: {
    message: {
      id: "m2",
      sender: "shroom" as const,
      text: "I am the CEO shroom. I receive escalations from all other shrooms, route decisions, and escalate critical matters to the human owner when needed.",
      timestamp: new Date().toISOString(),
    },
  },
};

export const LongMessage = {
  args: {
    message: {
      id: "m3",
      sender: "shroom" as const,
      text: "Here is a detailed breakdown of my responsibilities:\n\n1. Receive and triage escalations from sales, delivery, billing, and compliance shrooms\n2. Make routing decisions for cross-functional issues\n3. Escalate financial approvals and contract decisions to the human owner\n4. Maintain overview of all active projects and their status\n5. Coordinate between shrooms when collaboration is needed",
      timestamp: new Date().toISOString(),
    },
  },
};
