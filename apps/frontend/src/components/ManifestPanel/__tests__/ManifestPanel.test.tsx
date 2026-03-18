import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ManifestPanel } from "../ManifestPanel";
import type { ShroomDetail } from "@/lib/api";

afterEach(cleanup);

const detail: ShroomDetail = {
  id: "sales-shroom",
  name: "Sales",
  model: "mistral-7b",
  skills: ["prospecting", "outreach"],
  escalates_to: "root-shroom",
  sla_response_minutes: 60,
  can: [{ read: ["crm", "emails"] }, { write: ["draft_emails"] }],
  cannot: [{ execute: ["send_email", "payments"] }],
  mcps: ["crm-mcp"],
  status: "running",
};

describe("ManifestPanel", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <ManifestPanel detail={null} isOpen={false} isLoading={false} onClose={vi.fn()} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders loading state", () => {
    render(
      <ManifestPanel detail={null} isOpen={true} isLoading={true} onClose={vi.fn()} />
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders shroom details when loaded", () => {
    render(
      <ManifestPanel detail={detail} isOpen={true} isLoading={false} onClose={vi.fn()} />
    );
    expect(screen.getByText("sales-shroom")).toBeInTheDocument();
    expect(screen.getByText("Sales")).toBeInTheDocument();
    expect(screen.getByText("mistral-7b")).toBeInTheDocument();
    expect(screen.getByText("running")).toBeInTheDocument();
    expect(screen.getByText("root-shroom")).toBeInTheDocument();
    expect(screen.getByText("60 min")).toBeInTheDocument();
  });

  it("renders permissions on overview tab", () => {
    render(
      <ManifestPanel detail={detail} isOpen={true} isLoading={false} onClose={vi.fn()} />
    );
    expect(screen.getByText(/read/)).toBeInTheDocument();
    expect(screen.getAllByText(/crm/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows Skills & MCPs tab", () => {
    render(
      <ManifestPanel detail={detail} isOpen={true} isLoading={false} onClose={vi.fn()} />
    );
    expect(screen.getByRole("tab", { name: /Skills & MCPs/i })).toBeInTheDocument();
  });

  it("switches to skills tab and shows skills and mcps", async () => {
    render(
      <ManifestPanel detail={detail} isOpen={true} isLoading={false} onClose={vi.fn()} />
    );
    await userEvent.click(screen.getByRole("tab", { name: /Skills & MCPs/i }));
    expect(screen.getByText("prospecting")).toBeInTheDocument();
    expect(screen.getByText("outreach")).toBeInTheDocument();
    expect(screen.getByText("crm-mcp")).toBeInTheDocument();
  });

  it("resets active tab to overview when detail changes", async () => {
    const { rerender } = render(
      <ManifestPanel detail={detail} isOpen={true} isLoading={false} onClose={vi.fn()} />
    );
    const skillsTab = screen.getByRole("tab", { name: /Skills & MCPs/i });
    const overviewTab = screen.getByRole("tab", { name: /Overview/i });

    await userEvent.click(skillsTab);
    expect(skillsTab).toHaveAttribute("aria-selected", "true");

    const nextDetail = { ...detail, id: `${detail.id}-next` };
    rerender(
      <ManifestPanel detail={nextDetail} isOpen={true} isLoading={false} onClose={vi.fn()} />
    );
    expect(overviewTab).toHaveAttribute("aria-selected", "true");
    expect(skillsTab).toHaveAttribute("aria-selected", "false");
  });

  it("resets active tab to overview when panel is reopened", async () => {
    const { rerender } = render(
      <ManifestPanel detail={detail} isOpen={true} isLoading={false} onClose={vi.fn()} />
    );
    const skillsTab = screen.getByRole("tab", { name: /Skills & MCPs/i });
    const overviewTab = screen.getByRole("tab", { name: /Overview/i });

    await userEvent.click(skillsTab);
    expect(skillsTab).toHaveAttribute("aria-selected", "true");

    rerender(
      <ManifestPanel detail={detail} isOpen={false} isLoading={false} onClose={vi.fn()} />
    );
    rerender(
      <ManifestPanel detail={detail} isOpen={true} isLoading={false} onClose={vi.fn()} />
    );
    expect(overviewTab).toHaveAttribute("aria-selected", "true");
    expect(skillsTab).toHaveAttribute("aria-selected", "false");
  });

  it("shows empty state when no skills or mcps configured", async () => {
    const detailEmpty = { ...detail, skills: [], mcps: [] };
    render(
      <ManifestPanel detail={detailEmpty} isOpen={true} isLoading={false} onClose={vi.fn()} />
    );
    await userEvent.click(screen.getByRole("tab", { name: /Skills & MCPs/i }));
    expect(screen.getAllByText(/None configured/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("prospecting")).not.toBeInTheDocument();
    expect(screen.queryByText("crm-mcp")).not.toBeInTheDocument();
  });

  it("calls onClose when Close button is clicked", async () => {
    const onClose = vi.fn();
    render(
      <ManifestPanel detail={detail} isOpen={true} isLoading={false} onClose={onClose} />
    );
    await userEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose on Escape", async () => {
    const onClose = vi.fn();
    render(
      <ManifestPanel detail={detail} isOpen={true} isLoading={false} onClose={onClose} />
    );
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });
});
