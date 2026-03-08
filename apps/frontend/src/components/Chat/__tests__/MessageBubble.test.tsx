import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MessageBubble } from "../MessageBubble";
import type { ChatMessage } from "@/types/chat";

afterEach(cleanup);

const humanMsg: ChatMessage = {
  id: "m1",
  sender: "human",
  text: "Hello shroom",
  timestamp: "2026-03-08T10:00:00.000Z",
};

const shroomMsg: ChatMessage = {
  id: "m2",
  sender: "shroom",
  text: "Hello human",
  timestamp: "2026-03-08T10:00:05.000Z",
};

describe("MessageBubble", () => {
  it("renders message text", () => {
    render(<MessageBubble message={humanMsg} />);
    expect(screen.getByText("Hello shroom")).toBeInTheDocument();
  });

  it("renders timestamp", () => {
    render(<MessageBubble message={humanMsg} />);
    expect(screen.getByRole("time")).toBeInTheDocument();
  });

  it("aligns human messages to the right", () => {
    render(<MessageBubble message={humanMsg} />);
    const bubble = screen.getByTestId("message-bubble");
    expect(bubble.className).toContain("justify-end");
  });

  it("aligns shroom messages to the left", () => {
    render(<MessageBubble message={shroomMsg} />);
    const bubble = screen.getByTestId("message-bubble");
    expect(bubble.className).toContain("justify-start");
  });

  it("uses indigo background for human messages", () => {
    render(<MessageBubble message={humanMsg} />);
    const inner = screen.getByText("Hello shroom").closest("div");
    expect(inner?.className).toContain("bg-indigo-600");
  });

  it("uses subtle background for shroom messages", () => {
    render(<MessageBubble message={shroomMsg} />);
    const inner = screen.getByText("Hello human").closest("div");
    expect(inner?.className).toContain("bg-white/10");
  });
});
