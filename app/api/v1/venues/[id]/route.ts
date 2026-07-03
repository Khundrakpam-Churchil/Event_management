import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/src/lib/api/response";
import { withAuth } from "@/src/lib/middleware/auth";
import { withRoles } from "@/src/lib/middleware/rbac";
import { UpdateVenueInputSchema } from "@/src/lib/schemas/venue.schema";
import { getVenueById, updateVenue, softDeleteVenue } from "@/src/lib/services/venue.service";
import { AppError } from "@/src/lib/errors";

type RouteContext = { params: Record<string, string> };

// GET /api/v1/venues/:id — public
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const venue = await getVenueById(params.id);
    return successResponse(venue);
  } catch (err) {
    if (AppError.isAppError(err)) return errorResponse(err.code, err.message, err.httpStatus);
    console.error("[GET /venues/:id]", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
  }
}

// PUT /api/v1/venues/:id — Admin only
export const PUT = withAuth(
  withRoles(["ADMIN"], async (req: NextRequest, { params }: RouteContext) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Request body must be valid JSON.", 422);
    }

    const result = UpdateVenueInputSchema.safeParse(body);
    if (!result.success) {
      const message = result.error.issues
        .map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
        .join("; ");
      return errorResponse("VALIDATION_ERROR", message, 422);
    }

    try {
      const venue = await updateVenue(params.id, result.data);
      return successResponse(venue);
    } catch (err) {
      if (AppError.isAppError(err)) return errorResponse(err.code, err.message, err.httpStatus);
      console.error("[PUT /venues/:id]", err);
      return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
    }
  }) as Parameters<typeof withAuth>[0]
);

// DELETE /api/v1/venues/:id — Admin only
export const DELETE = withAuth(
  withRoles(["ADMIN"], async (_req: NextRequest, { params }: RouteContext) => {
    try {
      await softDeleteVenue(params.id);
      return new NextResponse(null, { status: 204 });
    } catch (err) {
      if (AppError.isAppError(err)) return errorResponse(err.code, err.message, err.httpStatus);
      console.error("[DELETE /venues/:id]", err);
      return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
    }
  }) as Parameters<typeof withAuth>[0]
);
