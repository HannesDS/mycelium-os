import { NextRequest, NextResponse } from "next/server";

const CONTROL_PLANE_URL =
  process.env.CONTROL_PLANE_URL || "http://localhost:8000";
const _rawApiKey = process.env.CONTROL_PLANE_API_KEY;
if (!_rawApiKey) {
  throw new Error(
    "CONTROL_PLANE_API_KEY is not set. All proxied requests will be unauthenticated. " +
      "Set CONTROL_PLANE_API_KEY in your environment before starting the server."
  );
}
const CONTROL_PLANE_API_KEY: string = _rawApiKey;

const ALLOWED_PATHS: { method: string; pattern: RegExp }[] = [
  { method: "GET", pattern: /^shrooms$/ },
  { method: "GET", pattern: /^shrooms\/[^/]+$/ },
  { method: "GET", pattern: /^constitution$/ },
  { method: "GET", pattern: /^skills$/ },
  { method: "GET", pattern: /^org\/graph$/ },
  { method: "GET", pattern: /^approvals\/pending-count$/ },
  { method: "GET", pattern: /^approvals$/ },
  { method: "POST", pattern: /^approvals\/[^/]+\/approve$/ },
  { method: "POST", pattern: /^approvals\/[^/]+\/reject$/ },
  { method: "GET", pattern: /^events$/ },
  { method: "GET", pattern: /^sessions$/ },
  { method: "GET", pattern: /^sessions\/[^/]+$/ },
  { method: "POST", pattern: /^shrooms\/[^/]+\/message$/ },
  { method: "POST", pattern: /^demo\/trigger-escalation$/ },
  { method: "GET", pattern: /^knowledge$/ },
  { method: "POST", pattern: /^knowledge$/ },
  { method: "GET", pattern: /^knowledge\/[^/]+\/download$/ },
  { method: "DELETE", pattern: /^knowledge\/[^/]+$/ },
];

function isAllowed(method: string, path: string): boolean {
  return ALLOWED_PATHS.some(
    (p) => p.method === method && p.pattern.test(path)
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  return proxy(request, params.path || []);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  return proxy(request, params.path || []);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  return proxy(request, params.path || []);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  return proxy(request, params.path || []);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  return proxy(request, params.path || []);
}

async function proxy(request: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join("/");
  if (!isAllowed(request.method, path)) {
    return new NextResponse(
      JSON.stringify({ detail: "Method or path not allowed" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  const search = request.nextUrl.search;
  const url = `${CONTROL_PLANE_URL.replace(/\/$/, "")}/${path}${search}`;

  const headers: Record<string, string> = {};
  request.headers.forEach((v, k) => {
    const lower = k.toLowerCase();
    if (lower !== "host" && lower !== "connection" && lower !== "content-length" && lower !== "x-api-key") {
      headers[k] = v;
    }
  });
  headers["X-API-Key"] = CONTROL_PLANE_API_KEY;

  let body: string | undefined;
  try {
    body = await request.text();
  } catch {
    body = undefined;
  }

  const res = await fetch(url, {
    method: request.method,
    headers: Object.keys(headers).length ? headers : undefined,
    body: body || undefined,
  });

  const responseHeaders = new Headers();
  res.headers.forEach((v, k) => {
    if (
      k.toLowerCase() !== "transfer-encoding" &&
      k.toLowerCase() !== "connection"
    ) {
      responseHeaders.set(k, v);
    }
  });

  return new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
  });
}
