import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/src/lib/api/response";
import { withAuth, type AuthenticatedRequest } from "@/src/lib/middleware/auth";
import { withRoles } from "@/src/lib/middleware/rbac";
import { CreateEventInputSchema, EventFiltersSchema } from "@/src/lib/schemas/event.schema";
import { listEvents, createEvent } from "@/src/lib/services/event.service";
import { AppError } from "@/src/lib/errors";

// GET /api/v1/events — public (filtered) or Admin (all)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const rawFilters = Object.fromEntries(searchParams.entries());

    const filtersResult = EventFiltersSchema.safeParse(rawFilters);
    if (!filtersResult.success) {
      const message = filtersResult.error.issues
        .map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
        .join("; ");
      return errorResponse("VALIDATION_ERROR", message, 422);
    }

    // Determine role from forwarded header (set by middleware)
    const role = req.headers.get("x-user-role") as "USER" | "ORGANIZER" | "ADMIN" | undefined ?? undefined;

    const result = await listEvents(filtersResult.data, role);
    return successResponse(result.data, result.meta);
  } catch (err) {
    if (AppError.isAppError(err)) return errorResponse(err.code, err.message, err.httpStatus);
    console.error("[GET /events]", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
  }
}

// POST /api/v1/events — ORGANIZER or ADMIN
export const POST = withAuth(
  withRoles(["ORGANIZER", "ADMIN"], async (req: NextRequest) => {
    const user = (req as AuthenticatedRequest).user;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Request body must be valid JSON.", 422);
    }

    const result = CreateEventInputSchema.safeParse(body);
    if (!result.success) {
      const message = result.error.issues
        .map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
        .join("; ");
      return errorResponse("VALIDATION_ERROR", message, 422);
    }

    try {
      const event = await createEvent(result.data, user.id);
      return successResponse(event, null, 201);
    } catch (err) {
      if (AppError.isAppError(err)) return errorResponse(err.code, err.message, err.httpStatus);
      console.error("[POST /events]", err);
      return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
    }
  }) as Parameters<typeof withAuth>[0]
);
