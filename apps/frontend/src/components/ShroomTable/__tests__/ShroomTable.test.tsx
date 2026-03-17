import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShroomTable } from "../ShroomTable";
import type { ShroomSummary } from "@/lib/api";

afterEach(cleanup);

const shrooms: ShroomSummary[] = [
  {
    id: "sales-shroom",
    name: "Sales",
    model: "mistral-7b",
    skills: ["prospecting"],
    escalates_to: "root-shroom",
    status: "running",
  },
  {
    id: "billing-shroom",
    name: "Billing",
    model: "mistral-7b",
    skills: ["invoicing"],
    escalates_to: "root-shroom",
    status: "running",
  },
  {
    id: "root-shroom",
    name: "CEO",
    model: "mistral-7b",
    skills: ["decisions"],
    escalates_to: null,
    status: "running",
  },
];

function getRowCells() {
  return screen
    .getAllByRole("row")
    .slice(1)
    .map((r) => {
      const cells = within(r).getAllByRole("cell");
      return {
        id: cells[0].textContent,
        name: cells[1].textContent,
        model: cells[2].textContent,
        status: cells[3].textContent,
        escalatesTo: cells[4].textContent,
      };
    });
}

describe("ShroomTable", () => {
  it("renders all shrooms in a table", () => {
    render(<ShroomTable shrooms={shrooms} onViewManifest={vi.fn()} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(4);
    const ids = getRowCells().map((r) => r.id);
    expect(ids).toContain("sales-shroom");
    expect(ids).toContain("billing-shroom");
    expect(ids).toContain("root-shroom");
  });

  it("renders all required columns", () => {
    render(<ShroomTable shrooms={shrooms} onViewManifest={vi.fn()} />);
    const headers = screen.getAllByRole("columnheader");
    const headerTexts = headers.map((h) => h.textContent?.replace(/\s*$/, ""));
    expect(headerTexts).toContain("Shroom ID");
    expect(headerTexts).toContain("Name");
    expect(headerTexts).toContain("Model");
    expect(headerTexts).toContain("Status");
    expect(headerTexts).toContain("Escalates to");
    expect(headerTexts).toContain("Actions");
  });

  it("calls onViewManifest with shroom id when View manifest is clicked", async () => {
    const onView = vi.fn();
    render(<ShroomTable shrooms={shrooms} onViewManifest={onView} />);
    const buttons = screen.getAllByRole("button", { name: /view manifest/i });
    await userEvent.click(buttons[0]);
    const rows = getRowCells();
    expect(onView).toHaveBeenCalledWith(rows[0].id);
  });

  it("sorts by shroom ID when ID header is clicked", async () => {
    render(<ShroomTable shrooms={shrooms} onViewManifest={vi.fn()} />);

    expect(getRowCells()[0].id).toBe("billing-shroom");

    const headers = screen.getAllByRole("columnheader");
    await userEvent.click(headers[0]);
    expect(getRowCells()[0].id).toBe("sales-shroom");
  });

  it("sorts by status when Status header is clicked", async () => {
    const mixed: ShroomSummary[] = [
      { ...shrooms[0], status: "running" },
      { ...shrooms[1], status: "error" },
      { ...shrooms[2], status: "stopped" },
    ];
    render(<ShroomTable shrooms={mixed} onViewManifest={vi.fn()} />);

    const headers = screen.getAllByRole("columnheader");
    await userEvent.click(headers[3]);

    expect(getRowCells()[0].status).toBe("error");
  });

  it("renders empty state when no shrooms", () => {
    render(<ShroomTable shrooms={[]} onViewManifest={vi.fn()} />);
    expect(screen.getByText(/no shrooms registered/i)).toBeInTheDocument();
  });

  it("shows dash for null escalates_to", () => {
    const single: ShroomSummary[] = [
      {
        id: "root-shroom",
        name: "CEO",
        model: "mistral-7b",
        skills: [],
        escalates_to: null,
        status: "running",
      },
    ];
    render(<ShroomTable shrooms={single} onViewManifest={vi.fn()} />);
    const rows = getRowCells();
    expect(rows[0].escalatesTo).toBe("—");
  });
});
