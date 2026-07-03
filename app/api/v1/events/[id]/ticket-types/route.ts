import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/src/lib/api/response";
import { withAuth, type AuthenticatedRequest } from "@/src/lib/middleware/auth";
import { CreateTicketTypeInputSchema } from "@/src/lib/schemas/ticketType.schema";
import { listTicketTypes, createTicketType } from "@/src/lib/services/ticketType.service";
import { AppError } from "@/src/lib/errors";

type RouteContext = { params: Record<string, string> };

// GET /api/v1/events/:id/ticket-types — public
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const ticketTypes = await listTicketTypes(params.id);
    return successResponse(ticketTypes);
  } catch (err) {
    if (AppError.isAppError(err)) return errorResponse(err.code, err.message, err.httpStatus);
    console.error("[GET /events/:id/ticket-types]", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
  }
}

// POST /api/v1/events/:id/ticket-types — owner Organizer or Admin
export const POST = withAuth(async (req: NextRequest, { params }: RouteContext) => {
  const user = (req as AuthenticatedRequest).user;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("VALIDATION_ERROR", "Request body must be valid JSON.", 422);
  }

  const result = CreateTicketTypeInputSchema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues
      .map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
      .join("; ");
    return errorResponse("VALIDATION_ERROR", message, 422);
  }

  try {
    const ticketType = await createTicketType(params.id, result.data, user.id, user.role);
    return successResponse(ticketType, null, 201);
  } catch (err) {
    if (AppError.isAppError(err)) return errorResponse(err.code, err.message, err.httpStatus);
    console.error("[POST /events/:id/ticket-types]", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
  }
});
