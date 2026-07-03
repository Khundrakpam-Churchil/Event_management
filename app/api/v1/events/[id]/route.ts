import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/src/lib/api/response";
import { withAuth, type AuthenticatedRequest } from "@/src/lib/middleware/auth";
import { withRoles } from "@/src/lib/middleware/rbac";
import { UpdateEventInputSchema } from "@/src/lib/schemas/event.schema";
import { getEventById, updateEvent, softDeleteEvent } from "@/src/lib/services/event.service";
import { AppError } from "@/src/lib/errors";

type RouteContext = { params: Promise<Record<string, string>> };

// GET /api/v1/events/:id — public (PUBLISHED only) or Admin (all)
export async function GET(req: NextRequest, { params }: RouteContext) {
  const resolvedParams = await params;

  try {
    const role = req.headers.get("x-user-role") as "USER" | "ORGANIZER" | "ADMIN" | undefined ?? undefined;
    const event = await getEventById(resolvedParams.id, role);
    return successResponse(event);
  } catch (err) {
    if (AppError.isAppError(err)) return errorResponse(err.code, err.message, err.httpStatus);
    console.error("[GET /events/:id]", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
  }
}

// PUT /api/v1/events/:id — owner Organizer or Admin
export const PUT = withAuth(async (req: NextRequest, { params }: RouteContext) => {
  const resolvedParams = await params;

  const user = (req as AuthenticatedRequest).user;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("VALIDATION_ERROR", "Request body must be valid JSON.", 422);
  }

  const result = UpdateEventInputSchema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues
      .map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
      .join("; ");
    return errorResponse("VALIDATION_ERROR", message, 422);
  }

  try {
    const event = await updateEvent(resolvedParams.id, result.data, user.id, user.role);
    return successResponse(event);
  } catch (err) {
    if (AppError.isAppError(err)) return errorResponse(err.code, err.message, err.httpStatus);
    console.error("[PUT /events/:id]", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
  }
});

// PATCH /api/v1/events/:id — same as PUT (partial update)
export const PATCH = PUT;

// DELETE /api/v1/events/:id — owner Organizer or Admin
export const DELETE = withAuth(async (req: NextRequest, { params }: RouteContext) => {
  const resolvedParams = await params;

  const user = (req as AuthenticatedRequest).user;

  try {
    await softDeleteEvent(resolvedParams.id, user.id, user.role);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (AppError.isAppError(err)) return errorResponse(err.code, err.message, err.httpStatus);
    console.error("[DELETE /events/:id]", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
  }
});
