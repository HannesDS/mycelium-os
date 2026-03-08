import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchShrooms, fetchShroom, fetchConstitution, sendMessage } from "../api";
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

describe("sendMessage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends POST and returns response", async () => {
    const mockResponse = {
      shroom_id: "ceo-shroom",
      response: "I am the CEO shroom.",
    };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await sendMessage("ceo-shroom", "What is your role?");
    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/shrooms/ceo-shroom/message",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "What is your role?" }),
      }),
    );
  });

  it("throws with backend detail on non-ok response", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      json: () =>
        Promise.resolve({
          detail:
            "Model 'mistral:latest' is not available in Ollama. Run `ollama pull mistral` to enable this shroom.",
        }),
    });

    await expect(sendMessage("ceo-shroom", "hi")).rejects.toThrow(
      "Model 'mistral:latest' is not available in Ollama",
    );
  });

  it("falls back to status text when body has no detail", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.reject(new Error("not json")),
    });

    await expect(sendMessage("ceo-shroom", "hi")).rejects.toThrow(
      "500 Internal Server Error",
    );
  });

  it("throws timeout error on abort", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new DOMException("The operation was aborted.", "AbortError"),
    );

    await expect(sendMessage("ceo-shroom", "hi")).rejects.toThrow(
      "Shroom is taking too long to respond. Try again.",
    );
  });
});
