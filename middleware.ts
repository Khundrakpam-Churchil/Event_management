import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/src/lib/jwt";
import { checkRateLimit, AUTH_RATE_LIMIT, BOOKING_RATE_LIMIT } from "@/src/lib/rate-limit";

// Public API routes that do NOT require a JWT
const PUBLIC_API_ROUTES = [
  "/api/v1/auth/register",
  "/api/v1/auth/login",
];

// Rate-limited API routes
const AUTH_RATE_LIMITED = ["/api/v1/auth/register", "/api/v1/auth/login"];
const BOOKING_RATE_LIMITED = ["/api/v1/bookings"];

// Frontend pages that require authentication — redirect to /login if no token
const PROTECTED_PAGES = ["/dashboard", "/checkout", "/organizer", "/admin"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Protected frontend pages ─────────────────────────────────────────────
  if (PROTECTED_PAGES.some((p) => pathname.startsWith(p))) {
    // Check for a stored token via a custom cookie set by the client
    const token = req.cookies.get("auth-token")?.value;
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── API routes only below ─────────────────────────────────────────────────
  if (!pathname.startsWith("/api/v1/")) {
    return NextResponse.next();
  }

  const ip =
    req.headers.get("x-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    "unknown";

  // Rate limiting — auth endpoints
  if (AUTH_RATE_LIMITED.some((p) => pathname.startsWith(p))) {
    const rl = checkRateLimit(`mw:auth:${ip}`, AUTH_RATE_LIMIT);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests. Please try again later." } },
        { status: 429 }
      );
    }
  }

  // Rate limiting — booking endpoints
  if (BOOKING_RATE_LIMITED.some((p) => pathname.startsWith(p)) && req.method === "POST") {
    const rl = checkRateLimit(`mw:booking:${ip}`, BOOKING_RATE_LIMIT);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests. Please try again later." } },
        { status: 429 }
      );
    }
  }

  // Skip JWT for public API routes
  if (PUBLIC_API_ROUTES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // JWT verification for all other /api/v1/* routes
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication is required." } },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred." } },
      { status: 500 }
    );
  }

  try {
    const payload = verifyToken(token);
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", payload.sub);
    requestHeaders.set("x-user-email", payload.email);
    requestHeaders.set("x-user-role", payload.role);
    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Invalid or expired authentication token." } },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: [
    "/api/v1/:path*",
    "/dashboard/:path*",
    "/checkout/:path*",
    "/organizer/:path*",
    "/admin/:path*",
  ],
};
