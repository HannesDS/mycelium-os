import { SessionDetail } from "./SessionDetail";
import type { SessionDetail as SessionDetailType } from "@/lib/api";

const meta = {
  component: SessionDetail,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#0a0a0f" }] },
  },
};

export default meta;

const mockSession: SessionDetailType = {
  session_id: "sess-abc-123",
  shroom_id: "sales-shroom",
  message_history: [
    { role: "user", content: "What leads do we have for Acme Corp?" },
    {
      role: "assistant",
      content:
        "I found 3 leads for Acme Corp. The primary contact is John Smith (CTO). Should I draft a proposal?",
    },
    { role: "user", content: "Yes, draft a proposal." },
    {
      role: "assistant",
      content:
        "I've drafted a proposal. It's ready for your review. I've escalated it to the CEO shroom for approval.",
    },
  ],
  started: "2026-03-09T10:00:00Z",
  ended: "2026-03-09T10:15:00Z",
  model: "mistral:latest",
  token_count: 450,
  related_events: [
    {
      id: "evt-1",
      action: "escalation_raised",
      actor: "sales-shroom",
      created_at: "2026-03-09T10:14:00Z",
    },
  ],
};

export const Default = {
  args: {
    session: mockSession,
    isLoading: false,
    onClose: () => console.log("Close"),
    isOpen: true,
  },
};

export const Loading = {
  args: {
    session: null,
    isLoading: true,
    onClose: () => console.log("Close"),
    isOpen: true,
  },
};

export const EmptyHistory = {
  args: {
    session: {
      ...mockSession,
      message_history: [],
      token_count: null,
    },
    isLoading: false,
    onClose: () => console.log("Close"),
    isOpen: true,
  },
};
