import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

function makeNextRequest(
  method: string,
  path: string,
  extraHeaders: Record<string, string> = {}
): NextRequest {
  const headers = new Headers(extraHeaders);
  return new NextRequest(
    `http://localhost:3000/api/control-plane/${path}`,
    { method, headers }
  );
}

describe("control-plane proxy route", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn());
    process.env.CONTROL_PLANE_URL = "http://backend:8000";
    process.env.CONTROL_PLANE_API_KEY = "server-secret";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  it("injects X-API-Key from server env on every proxied request", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 })
    );

    const { GET } = await import("../route");
    const req = makeNextRequest("GET", "shrooms");
    await GET(req, { params: { path: ["shrooms"] } });

    expect(fetch).toHaveBeenCalledOnce();
    const [_url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers["X-API-Key"]).toBe("server-secret");
  });

  it("does not forward a client-supplied X-API-Key header", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 })
    );

    const { GET } = await import("../route");
    const req = makeNextRequest("GET", "shrooms", { "X-API-Key": "client-forgery" });
    await GET(req, { params: { path: ["shrooms"] } });

    expect(fetch).toHaveBeenCalledOnce();
    const [_url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    // Server key must win; forgery must not reach backend
    expect(headers["X-API-Key"]).toBe("server-secret");
  });

  it("forwards request to the correct control-plane URL", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 })
    );

    const { GET } = await import("../route");
    const req = makeNextRequest("GET", "shrooms");
    await GET(req, { params: { path: ["shrooms"] } });

    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("http://backend:8000/shrooms");
  });

  it("returns 403 for a path not in the allow-list", async () => {
    const { GET } = await import("../route");
    const req = makeNextRequest("GET", "internal/admin");
    const res = await GET(req, { params: { path: ["internal", "admin"] } });

    expect(res.status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });
});
