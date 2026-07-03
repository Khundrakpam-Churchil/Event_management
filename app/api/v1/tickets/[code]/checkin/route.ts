import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/src/lib/api/response";
import { withAuth, type AuthenticatedRequest } from "@/src/lib/middleware/auth";
import { checkInTicket } from "@/src/lib/services/ticket.service";
import { AppError } from "@/src/lib/errors";

type RouteContext = { params: Promise<Record<string, string>> };

// POST /api/v1/tickets/:code/checkin — Organizer or Admin
export const POST = withAuth(async (req: NextRequest, { params }: RouteContext) => {
  const resolvedParams = await params;

  const user = (req as AuthenticatedRequest).user;

  try {
    const ticket = await checkInTicket(resolvedParams.code, user.id, user.role);
    return successResponse(ticket);
  } catch (err) {
    if (AppError.isAppError(err)) return errorResponse(err.code, err.message, err.httpStatus);
    console.error("[POST /tickets/:code/checkin]", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
  }
});
