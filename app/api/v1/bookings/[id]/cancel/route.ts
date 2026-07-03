import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/src/lib/api/response";
import { withAuth, type AuthenticatedRequest } from "@/src/lib/middleware/auth";
import { cancelBooking } from "@/src/lib/services/booking.service";
import { AppError } from "@/src/lib/errors";

type RouteContext = { params: Promise<Record<string, string>> };

// POST /api/v1/bookings/:id/cancel — owner or Admin
export const POST = withAuth(async (req: NextRequest, { params }: RouteContext) => {
  const resolvedParams = await params;

  const user = (req as AuthenticatedRequest).user;

  try {
    const booking = await cancelBooking(resolvedParams.id, user.id, user.role);
    return successResponse(booking);
  } catch (err) {
    if (AppError.isAppError(err)) return errorResponse(err.code, err.message, err.httpStatus);
    console.error("[POST /bookings/:id/cancel]", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
  }
});
