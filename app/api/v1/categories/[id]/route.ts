import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/src/lib/api/response";
import { withAuth } from "@/src/lib/middleware/auth";
import { withRoles } from "@/src/lib/middleware/rbac";
import { UpdateCategoryInputSchema } from "@/src/lib/schemas/category.schema";
import { updateCategory, softDeleteCategory } from "@/src/lib/services/category.service";
import { AppError } from "@/src/lib/errors";

type RouteContext = { params: Record<string, string> };

// PUT /api/v1/categories/:id — Admin only
export const PUT = withAuth(
  withRoles(["ADMIN"], async (req: NextRequest, { params }: RouteContext) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Request body must be valid JSON.", 422);
    }

    const result = UpdateCategoryInputSchema.safeParse(body);
    if (!result.success) {
      const message = result.error.issues
        .map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
        .join("; ");
      return errorResponse("VALIDATION_ERROR", message, 422);
    }

    try {
      const category = await updateCategory(params.id, result.data);
      return successResponse(category);
    } catch (err) {
      if (AppError.isAppError(err)) return errorResponse(err.code, err.message, err.httpStatus);
      console.error("[PUT /categories/:id]", err);
      return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
    }
  }) as Parameters<typeof withAuth>[0]
);

// DELETE /api/v1/categories/:id — Admin only
export const DELETE = withAuth(
  withRoles(["ADMIN"], async (_req: NextRequest, { params }: RouteContext) => {
    try {
      await softDeleteCategory(params.id);
      return new NextResponse(null, { status: 204 });
    } catch (err) {
      if (AppError.isAppError(err)) return errorResponse(err.code, err.message, err.httpStatus);
      console.error("[DELETE /categories/:id]", err);
      return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
    }
  }) as Parameters<typeof withAuth>[0]
);
