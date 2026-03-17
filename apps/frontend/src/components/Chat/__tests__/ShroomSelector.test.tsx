import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShroomSelector } from "../ShroomSelector";
import type { ShroomSummary } from "@/lib/api";

afterEach(cleanup);

const shrooms: ShroomSummary[] = [
  {
    id: "sales-shroom",
    name: "Sales",
    model: "mistral-7b",
    skills: [],
    escalates_to: "root-shroom",
    status: "running",
  },
  {
    id: "root-shroom",
    name: "CEO",
    model: "mistral-7b",
    skills: [],
    escalates_to: null,
    status: "stopped",
  },
];

describe("ShroomSelector", () => {
  it("renders all shrooms", () => {
    render(
      <ShroomSelector
        shrooms={shrooms}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("Sales")).toBeInTheDocument();
    expect(screen.getByText("CEO")).toBeInTheDocument();
  });

  it("calls onSelect when a shroom is clicked", async () => {
    const onSelect = vi.fn();
    render(
      <ShroomSelector
        shrooms={shrooms}
        selectedId={null}
        onSelect={onSelect}
      />,
    );

    await userEvent.click(
      screen.getByTestId("shroom-option-sales-shroom"),
    );
    expect(onSelect).toHaveBeenCalledWith("sales-shroom");
  });

  it("highlights selected shroom", () => {
    render(
      <ShroomSelector
        shrooms={shrooms}
        selectedId="root-shroom"
        onSelect={vi.fn()}
      />,
    );

    const selected = screen.getByTestId("shroom-option-root-shroom");
    expect(selected.className).toContain("bg-white/10");

    const unselected = screen.getByTestId("shroom-option-sales-shroom");
    expect(unselected.className).not.toContain("bg-white/10");
  });

  it("shows shroom ids", () => {
    render(
      <ShroomSelector
        shrooms={shrooms}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("sales-shroom")).toBeInTheDocument();
    expect(screen.getByText("root-shroom")).toBeInTheDocument();
  });
});
