import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";

const COOKIE_NAME = "mycelium_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function getSessionToken(): string {
  const secret = process.env.DEV_API_KEY || process.env.SESSION_COOKIE_SECRET;
  if (!secret) return "";
  return crypto.createHmac("sha256", secret).update("mycelium-session").digest("hex");
}

function hasValidSession(request: NextRequest): boolean {
  const token = getSessionToken();
  if (!token) return true;
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  return cookie === token;
}

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/control-plane/")) {
    if (!hasValidSession(request)) {
      return new NextResponse(JSON.stringify({ detail: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return NextResponse.next();
  }

  const token = getSessionToken();
  if (token && !request.cookies.get(COOKIE_NAME)) {
    const res = NextResponse.next();
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/control-plane/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
