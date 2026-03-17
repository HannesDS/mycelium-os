import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ChatThread } from "../ChatThread";
import type { ChatMessage } from "@/types/chat";

afterEach(cleanup);

const messages: ChatMessage[] = [
  {
    id: "m1",
    sender: "human",
    text: "What is your role?",
    timestamp: "2026-03-08T10:00:00.000Z",
  },
  {
    id: "m2",
    sender: "shroom",
    text: "I am the CEO shroom.",
    timestamp: "2026-03-08T10:00:05.000Z",
  },
];

const defaultProps = {
  shroomName: "CEO",
  shroomRole: "root-shroom",
  shroomModel: "mistral-7b",
  messages: [],
  onSend: vi.fn(),
  isLoading: false,
  error: null,
};

describe("ChatThread", () => {
  it("renders shroom header with name, role, and model", () => {
    render(<ChatThread {...defaultProps} />);
    expect(screen.getByText("CEO")).toBeInTheDocument();
    expect(screen.getByText(/root-shroom/)).toBeInTheDocument();
    expect(screen.getByText(/mistral-7b/)).toBeInTheDocument();
  });

  it("renders empty state when no messages", () => {
    render(<ChatThread {...defaultProps} />);
    expect(screen.getByText(/start a conversation/i)).toBeInTheDocument();
  });

  it("renders messages", () => {
    render(<ChatThread {...defaultProps} messages={messages} />);
    expect(screen.getByText("What is your role?")).toBeInTheDocument();
    expect(screen.getByText("I am the CEO shroom.")).toBeInTheDocument();
  });

  it("shows loading indicator when isLoading", () => {
    render(<ChatThread {...defaultProps} isLoading={true} />);
    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
    expect(screen.getByText(/CEO is thinking/)).toBeInTheDocument();
  });

  it("shows error message", () => {
    render(
      <ChatThread
        {...defaultProps}
        error="Shroom is taking too long to respond. Try again."
      />,
    );
    expect(screen.getByTestId("chat-error")).toBeInTheDocument();
    expect(
      screen.getByText(/Shroom is taking too long to respond/),
    ).toBeInTheDocument();
  });

  it("renders message input", () => {
    render(<ChatThread {...defaultProps} />);
    expect(screen.getByTestId("message-input")).toBeInTheDocument();
  });
});
