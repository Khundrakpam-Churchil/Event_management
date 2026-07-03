import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/src/lib/api/response";
import { withAuth } from "@/src/lib/middleware/auth";
import { getTicketByCode } from "@/src/lib/services/ticket.service";
import { AppError } from "@/src/lib/errors";

type RouteContext = { params: Promise<Record<string, string>> };

// GET /api/v1/tickets/:code — authenticated users (owner or Admin)
export const GET = withAuth(async (_req: NextRequest, { params }: RouteContext) => {
  const resolvedParams = await params;

  try {
    const ticket = await getTicketByCode(resolvedParams.code);
    return successResponse(ticket);
  } catch (err) {
    if (AppError.isAppError(err)) return errorResponse(err.code, err.message, err.httpStatus);
    console.error("[GET /tickets/:code]", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
  }
});
