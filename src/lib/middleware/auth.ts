import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { errorResponse } from "@/src/lib/api/response";

export interface UserContext {
  id: string;
  email: string;
  role: "USER" | "ORGANIZER" | "ADMIN";
}

// Extend NextRequest to carry the authenticated user context
export interface AuthenticatedRequest extends NextRequest {
  user: UserContext;
}

type AuthHandler = (
  req: AuthenticatedRequest,
  context: { params: Record<string, string> }
) => Promise<NextResponse> | NextResponse;

/**
 * Higher-order function that extracts and verifies the user context.
 *
 * It first checks for pre-verified user headers injected by the Next.js
 * middleware (x-user-id, x-user-email, x-user-role). If those are not
 * present it falls back to verifying the Bearer JWT directly — this supports
 * both the full middleware stack and direct handler calls (e.g. in tests).
 *
 * Returns HTTP 401 if no valid auth is found.
 */
export function withAuth(handler: AuthHandler) {
  return async (
    req: NextRequest,
    context: { params: Record<string, string> }
  ): Promise<NextResponse> => {
    // Try pre-verified headers first (set by middleware.ts)
    const userId = req.headers.get("x-user-id");
    const userEmail = req.headers.get("x-user-email");
    const userRole = req.headers.get("x-user-role") as UserContext["role"] | null;

    if (userId && userEmail && userRole) {
      const authenticatedReq = Object.assign(req, {
        user: { id: userId, email: userEmail, role: userRole },
      }) as AuthenticatedRequest;
      return handler(authenticatedReq, context);
    }

    // Fall back to direct Bearer token verification
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse("UNAUTHORIZED", "Authentication is required.", 401);
    }

    const token = authHeader.slice(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET environment variable is not set.");
      return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
    }

    try {
      const decoded = jwt.verify(token, secret) as UserContext & { iat?: number; exp?: number };
      const authenticatedReq = Object.assign(req, { user: decoded }) as AuthenticatedRequest;
      return handler(authenticatedReq, context);
    } catch {
      return errorResponse("UNAUTHORIZED", "Invalid or expired authentication token.", 401);
    }
  };
}

/**
 * Extracts user context from an already-verified request (for use after withAuth).
 * Throws if user context is not present (should not happen in guarded handlers).
 */
export function getUserContext(req: NextRequest): UserContext {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    throw new Error("User context is missing — ensure withAuth middleware is applied.");
  }
  return user;
}
