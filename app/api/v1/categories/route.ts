import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/src/lib/api/response";
import { withAuth } from "@/src/lib/middleware/auth";
import { withRoles } from "@/src/lib/middleware/rbac";
import { CreateCategoryInputSchema } from "@/src/lib/schemas/category.schema";
import { listCategories, createCategory } from "@/src/lib/services/category.service";
import { AppError } from "@/src/lib/errors";

// GET /api/v1/categories — public
export async function GET() {
  try {
    const categories = await listCategories();
    return successResponse(categories);
  } catch (err) {
    console.error("[GET /categories]", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
  }
}

// POST /api/v1/categories — Admin only
export const POST = withAuth(
  withRoles(["ADMIN"], async (req: NextRequest) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Request body must be valid JSON.", 422);
    }

    const result = CreateCategoryInputSchema.safeParse(body);
    if (!result.success) {
      const message = result.error.issues
        .map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
        .join("; ");
      return errorResponse("VALIDATION_ERROR", message, 422);
    }

    try {
      const category = await createCategory(result.data);
      return successResponse(category, null, 201);
    } catch (err) {
      if (AppError.isAppError(err)) return errorResponse(err.code, err.message, err.httpStatus);
      console.error("[POST /categories]", err);
      return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
    }
  }) as Parameters<typeof withAuth>[0]
);
