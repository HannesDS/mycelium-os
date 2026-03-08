import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchShrooms, fetchShroom, fetchConstitution } from "../api";
import type { ShroomSummary, ShroomDetail, ConstitutionData } from "../api";

const mockSummary: ShroomSummary = {
  id: "sales-shroom",
  name: "Sales",
  model: "mistral-7b",
  skills: ["prospecting"],
  escalates_to: "ceo-shroom",
  status: "running",
};

const mockDetail: ShroomDetail = {
  id: "sales-shroom",
  name: "Sales",
  model: "mistral-7b",
  skills: ["prospecting"],
  escalates_to: "ceo-shroom",
  sla_response_minutes: 60,
  can: [{ read: ["crm", "emails"] }],
  cannot: [{ execute: ["send_email"] }],
  mcps: [],
  status: "running",
};

describe("fetchShrooms", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns shroom list on success", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockSummary]),
    });

    const result = await fetchShrooms();
    expect(result).toEqual([mockSummary]);
    expect(fetch).toHaveBeenCalledWith("http://localhost:8000/shrooms");
  });

  it("throws on non-ok response", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    });

    await expect(fetchShrooms()).rejects.toThrow("Failed to fetch shrooms: 503");
  });
});

describe("fetchShroom", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns shroom detail on success", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDetail),
    });

    const result = await fetchShroom("sales-shroom");
    expect(result).toEqual(mockDetail);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/shrooms/sales-shroom"
    );
  });

  it("throws on 404", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    await expect(fetchShroom("nonexistent")).rejects.toThrow(
      "Failed to fetch shroom nonexistent: 404"
    );
  });
});

const mockConstitution: ConstitutionData = {
  company: { name: "Test Co", instance: "dev" },
  shrooms: [
    {
      id: "sales-shroom",
      manifest: {
        name: "Sales",
        model: "mistral-7b",
        skills: ["prospecting"],
        escalates_to: "ceo-shroom",
        sla_response_minutes: 60,
        can: [{ read: ["crm"] }],
        cannot: [],
        mcps: [],
      },
    },
  ],
  graph: {
    edges: [{ from: "sales-shroom", to: "ceo-shroom", type: "reports-to" }],
  },
};

describe("fetchConstitution", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns constitution data on success", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockConstitution),
    });

    const result = await fetchConstitution();
    expect(result).toEqual(mockConstitution);
    expect(fetch).toHaveBeenCalledWith("http://localhost:8000/constitution");
  });

  it("throws on non-ok response", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    });

    await expect(fetchConstitution()).rejects.toThrow(
      "Failed to fetch constitution: 503 Service Unavailable"
    );
  });
});
