import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/src/lib/api/response";
import { type AuthenticatedRequest, type UserContext } from "@/src/lib/middleware/auth";

type Role = UserContext["role"];

type AuthHandler = (
  req: AuthenticatedRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse> | NextResponse;

/**
 * Higher-order function that checks the authenticated user has at least one of
 * the required roles.
 *
 * MUST be composed inside `withAuth` so that `req.user` is already populated:
 *
 * ```ts
 * export const POST = withAuth(withRoles(["ADMIN"], handler));
 * ```
 *
 * Returns HTTP 403 if the user's role is not in the allowed list.
 */
export function withRoles(allowedRoles: Role[], handler: AuthHandler): AuthHandler {
  return async (
    req: AuthenticatedRequest,
    context: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    const { role } = req.user;

    if (!allowedRoles.includes(role)) {
      return errorResponse(
        "FORBIDDEN",
        "You do not have permission to perform this action.",
        403
      );
    }

    return handler(req, context);
  };
}

/**
 * Convenience wrapper: combines withAuth + withRoles into a single call.
 * Import from auth.ts to avoid circular dependencies.
 */
export function requireRoles(allowedRoles: Role[]) {
  return (handler: AuthHandler): ((req: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<NextResponse>) => {
    // We return a plain NextRequest handler; the caller must also apply withAuth
    return async (req: NextRequest, context: { params: Promise<Record<string, string>> }) => {
      const user = (req as AuthenticatedRequest).user;

      if (!user) {
        return errorResponse("UNAUTHORIZED", "Authentication is required.", 401);
      }

      if (!allowedRoles.includes(user.role)) {
        return errorResponse(
          "FORBIDDEN",
          "You do not have permission to perform this action.",
          403
        );
      }

      return handler(req as AuthenticatedRequest, context);
    };
  };
}
