import { describe, it, expect, vi } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AgentSidePanel } from "../AgentSidePanel";

describe("AgentSidePanel", () => {
  const baseProps = {
    agentId: "sales-agent",
    agentName: "Sales",
    agentRole: "Sales Development",
    status: "idle" as const,
    currentTask: null,
    recentEvents: [],
    onClose: vi.fn(),
    isOpen: false,
  };

  it("renders nothing when isOpen is false", () => {
    const { container } = render(<AgentSidePanel {...baseProps} />);
    expect(container.innerHTML).toBe("");
    cleanup();
  });

  it("renders agent name when open", () => {
    render(<AgentSidePanel {...baseProps} isOpen={true} />);
    expect(screen.getByText(/Sales — Sales Development/)).toBeInTheDocument();
    cleanup();
  });

  it("calls onClose when Close button is clicked", async () => {
    const onClose = vi.fn();
    render(<AgentSidePanel {...baseProps} isOpen={true} onClose={onClose} />);
    const dialog = screen.getByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledOnce();
    cleanup();
  });
});
