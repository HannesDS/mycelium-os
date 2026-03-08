import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "../Sidebar";
import { NAV_ITEMS } from "../nav-items";

let mockPathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

beforeEach(() => {
  mockPathname = "/";
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

describe("Sidebar", () => {
  it("renders all nav items", () => {
    render(<Sidebar />);
    for (const item of NAV_ITEMS) {
      expect(
        screen.getByTestId(`nav-item-${item.label.toLowerCase()}`)
      ).toBeInTheDocument();
    }
    cleanup();
  });

  it("renders enabled items as links", () => {
    render(<Sidebar />);
    const enabledItems = NAV_ITEMS.filter((i) => i.enabled);
    for (const item of enabledItems) {
      const el = screen.getByTestId(`nav-item-${item.label.toLowerCase()}`);
      expect(el.tagName).toBe("A");
      expect(el).toHaveAttribute("href", item.href);
    }
    cleanup();
  });

  it("renders disabled items as non-clickable spans", () => {
    render(<Sidebar />);
    const disabledItems = NAV_ITEMS.filter((i) => !i.enabled);
    for (const item of disabledItems) {
      const el = screen.getByTestId(`nav-item-${item.label.toLowerCase()}`);
      expect(el.tagName).toBe("SPAN");
      expect(el).toHaveClass("cursor-not-allowed");
      expect(el).toHaveClass("opacity-40");
    }
    cleanup();
  });

  it("highlights active route", () => {
    mockPathname = "/shrooms";
    render(<Sidebar />);
    const shroomsLink = screen.getByTestId("nav-item-shrooms");
    expect(shroomsLink.className).toContain("bg-white/10");
    const officeLink = screen.getByTestId("nav-item-office");
    expect(officeLink.className).not.toContain("bg-white/10");
    cleanup();
  });

  it("collapses and expands when toggle button is clicked", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    const sidebar = screen.getByTestId("sidebar");
    expect(sidebar).toHaveClass("w-60");

    await user.click(screen.getByTestId("sidebar-toggle"));
    expect(sidebar).toHaveClass("w-16");

    await user.click(screen.getByTestId("sidebar-toggle"));
    expect(sidebar).toHaveClass("w-60");
    cleanup();
  });

  it("shows Mycelium OS wordmark when expanded", () => {
    render(<Sidebar />);
    expect(screen.getByText("Mycelium OS")).toBeInTheDocument();
    cleanup();
  });

  it("auto-collapses on narrow viewport (matchMedia)", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    render(<Sidebar />);
    const sidebar = screen.getByTestId("sidebar");
    expect(sidebar).toHaveClass("w-16");
    cleanup();
  });
});
