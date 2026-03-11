import { NextRequest, NextResponse } from "next/server";

const CONTROL_PLANE_URL =
  process.env.CONTROL_PLANE_URL || "http://localhost:8000";
const DEV_API_KEY = process.env.DEV_API_KEY;

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
  const search = request.nextUrl.search;
  const url = `${CONTROL_PLANE_URL.replace(/\/$/, "")}/${path}${search}`;

  const headers: Record<string, string> = {};
  request.headers.forEach((v, k) => {
    const lower = k.toLowerCase();
    if (lower !== "host" && lower !== "connection" && lower !== "content-length") {
      headers[k] = v;
    }
  });
  if (DEV_API_KEY) {
    headers["X-API-Key"] = DEV_API_KEY;
  }

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
