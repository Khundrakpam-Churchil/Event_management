import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/src/lib/api/response";
import { withAuth, type AuthenticatedRequest } from "@/src/lib/middleware/auth";
import { UpdateTicketTypeInputSchema } from "@/src/lib/schemas/ticketType.schema";
import { updateTicketType, softDeleteTicketType } from "@/src/lib/services/ticketType.service";
import { AppError } from "@/src/lib/errors";

type RouteContext = { params: Promise<Record<string, string>> };

// PUT /api/v1/events/:id/ticket-types/:ttId — owner Organizer or Admin
export const PUT = withAuth(async (req: NextRequest, { params }: RouteContext) => {
  const resolvedParams = await params;

  const user = (req as AuthenticatedRequest).user;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("VALIDATION_ERROR", "Request body must be valid JSON.", 422);
  }

  const result = UpdateTicketTypeInputSchema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues
      .map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
      .join("; ");
    return errorResponse("VALIDATION_ERROR", message, 422);
  }

  try {
    const ticketType = await updateTicketType(resolvedParams.ttId, result.data, user.id, user.role);
    return successResponse(ticketType);
  } catch (err) {
    if (AppError.isAppError(err)) return errorResponse(err.code, err.message, err.httpStatus);
    console.error("[PUT /ticket-types/:ttId]", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
  }
});

// PATCH — same as PUT
export const PATCH = PUT;

// DELETE /api/v1/events/:id/ticket-types/:ttId — owner Organizer or Admin
export const DELETE = withAuth(async (req: NextRequest, { params }: RouteContext) => {
  const resolvedParams = await params;

  const user = (req as AuthenticatedRequest).user;

  try {
    await softDeleteTicketType(resolvedParams.ttId, user.id, user.role);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (AppError.isAppError(err)) return errorResponse(err.code, err.message, err.httpStatus);
    console.error("[DELETE /ticket-types/:ttId]", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
  }
});
