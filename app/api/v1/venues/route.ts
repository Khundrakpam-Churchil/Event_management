import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/src/lib/api/response";
import { withAuth, type AuthenticatedRequest } from "@/src/lib/middleware/auth";
import { withRoles } from "@/src/lib/middleware/rbac";
import { CreateVenueInputSchema } from "@/src/lib/schemas/venue.schema";
import { listVenues, createVenue } from "@/src/lib/services/venue.service";
import { AppError } from "@/src/lib/errors";

// GET /api/v1/venues — public, paginated
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")));

    const result = await listVenues(page, limit);
    return successResponse(result.data, result.meta);
  } catch (err) {
    console.error("[GET /venues]", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
  }
}

// POST /api/v1/venues — Admin only
export const POST = withAuth(
  withRoles(["ADMIN"], async (req: NextRequest) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Request body must be valid JSON.", 422);
    }

    const result = CreateVenueInputSchema.safeParse(body);
    if (!result.success) {
      const message = result.error.issues
        .map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
        .join("; ");
      return errorResponse("VALIDATION_ERROR", message, 422);
    }

    try {
      const venue = await createVenue(result.data);
      return successResponse(venue, null, 201);
    } catch (err) {
      if (AppError.isAppError(err)) return errorResponse(err.code, err.message, err.httpStatus);
      console.error("[POST /venues]", err);
      return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
    }
  }) as Parameters<typeof withAuth>[0]
);
