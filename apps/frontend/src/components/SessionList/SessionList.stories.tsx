import { SessionList } from "./SessionList";
import type { SessionListItem } from "@/lib/api";

const meta = {
  component: SessionList,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#0a0a0f" }] },
  },
};

export default meta;

const mockSessions: SessionListItem[] = [
  {
    session_id: "sess-abc-123",
    shroom_id: "sales-shroom",
    status: "active",
    started: "2026-03-09T10:00:00Z",
    duration: "2m",
    message_count: 4,
  },
  {
    session_id: "sess-def-456",
    shroom_id: "billing-shroom",
    status: "active",
    started: "2026-03-09T09:55:00Z",
    duration: "5m",
    message_count: 2,
  },
  {
    session_id: "sess-ghi-789",
    shroom_id: "ceo-shroom",
    status: "completed",
    started: "2026-03-09T09:00:00Z",
    duration: "1h",
    message_count: 12,
  },
];

export const Active = {
  args: {
    status: "active" as const,
    sessions: mockSessions.filter((s) => s.status === "active"),
    loading: false,
    error: null,
    onLoad: async () => {},
    onSelectSession: (id: string) => console.log("Select:", id),
    autoRefresh: true,
  },
};

export const Completed = {
  args: {
    status: "completed" as const,
    sessions: mockSessions.filter((s) => s.status === "completed"),
    loading: false,
    error: null,
    onLoad: async () => {},
    onSelectSession: (id: string) => console.log("Select:", id),
    autoRefresh: false,
  },
};

export const Empty = {
  args: {
    status: "active" as const,
    sessions: [],
    loading: false,
    error: null,
    onLoad: async () => {},
    onSelectSession: () => {},
    autoRefresh: false,
  },
};

export const Loading = {
  args: {
    status: "active" as const,
    sessions: [],
    loading: true,
    error: null,
    onLoad: async () => {},
    onSelectSession: () => {},
    autoRefresh: false,
  },
};
