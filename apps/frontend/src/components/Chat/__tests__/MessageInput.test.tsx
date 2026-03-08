import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageInput } from "../MessageInput";

afterEach(cleanup);

describe("MessageInput", () => {
  it("renders input and send button", () => {
    render(<MessageInput onSend={vi.fn()} />);
    expect(screen.getByTestId("message-input")).toBeInTheDocument();
    expect(screen.getByTestId("send-button")).toBeInTheDocument();
  });

  it("calls onSend with trimmed text on button click", async () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);

    const input = screen.getByTestId("message-input");
    await userEvent.type(input, "  hello world  ");
    await userEvent.click(screen.getByTestId("send-button"));

    expect(onSend).toHaveBeenCalledWith("hello world");
  });

  it("clears input after sending", async () => {
    render(<MessageInput onSend={vi.fn()} />);

    const input = screen.getByTestId("message-input") as HTMLTextAreaElement;
    await userEvent.type(input, "test");
    await userEvent.click(screen.getByTestId("send-button"));

    expect(input.value).toBe("");
  });

  it("sends on Enter key (without Shift)", async () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);

    const input = screen.getByTestId("message-input");
    await userEvent.type(input, "hello{Enter}");

    expect(onSend).toHaveBeenCalledWith("hello");
  });

  it("does not send on Shift+Enter", async () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);

    const input = screen.getByTestId("message-input");
    await userEvent.type(input, "hello{Shift>}{Enter}{/Shift}");

    expect(onSend).not.toHaveBeenCalled();
  });

  it("disables input and button when disabled", () => {
    render(<MessageInput onSend={vi.fn()} disabled />);
    expect(screen.getByTestId("message-input")).toBeDisabled();
  });

  it("does not send empty messages", async () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);

    await userEvent.click(screen.getByTestId("send-button"));
    expect(onSend).not.toHaveBeenCalled();
  });
});
