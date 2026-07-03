import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/src/lib/api/response";
import { withAuth, type AuthenticatedRequest } from "@/src/lib/middleware/auth";
import { CreateBookingInputSchema } from "@/src/lib/schemas/booking.schema";
import { createBooking, getUserBookings } from "@/src/lib/services/booking.service";
import { AppError } from "@/src/lib/errors";

// GET /api/v1/bookings — authenticated user's bookings (Admin: all)
export const GET = withAuth(async (req: NextRequest) => {
  const user = (req as AuthenticatedRequest).user;
  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")));
  const filterUserId = searchParams.get("userId") ?? undefined;

  try {
    const result = await getUserBookings(user.id, user.role, page, limit, filterUserId);
    return successResponse(result.data, result.meta);
  } catch (err) {
    if (AppError.isAppError(err)) return errorResponse(err.code, err.message, err.httpStatus);
    console.error("[GET /bookings]", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
  }
});

// POST /api/v1/bookings — create booking (rate-limited by middleware)
export const POST = withAuth(async (req: NextRequest) => {
  const user = (req as AuthenticatedRequest).user;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("VALIDATION_ERROR", "Request body must be valid JSON.", 422);
  }

  const result = CreateBookingInputSchema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues
      .map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
      .join("; ");
    return errorResponse("VALIDATION_ERROR", message, 422);
  }

  try {
    const booking = await createBooking(result.data, user.id);
    return successResponse(booking, null, 201);
  } catch (err) {
    if (AppError.isAppError(err)) return errorResponse(err.code, err.message, err.httpStatus);
    console.error("[POST /bookings]", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
  }
});
