import { NextRequest, NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";
import { errorResponse } from "@/src/lib/api/response";

type RouteHandler = (
  req: NextRequest,
  context: { params: Record<string, string> }
) => Promise<NextResponse> | NextResponse;

/**
 * Higher-order function that validates the request body against a Zod schema
 * before passing control to the route handler.
 *
 * Returns HTTP 422 with VALIDATION_ERROR code if validation fails,
 * including per-field error details in the error message.
 */
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (
    req: NextRequest,
    context: { params: Record<string, string> },
    body: T
  ) => Promise<NextResponse> | NextResponse
): RouteHandler {
  return async (req: NextRequest, context: { params: Record<string, string> }) => {
    let rawBody: unknown;

    try {
      rawBody = await req.json();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Request body must be valid JSON.", 422);
    }

    const result = schema.safeParse(rawBody);

    if (!result.success) {
      const message = formatZodError(result.error);
      return errorResponse("VALIDATION_ERROR", message, 422);
    }

    return handler(req, context, result.data);
  };
}

function formatZodError(error: ZodError): string {
  const issues = error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    return `${path}${issue.message}`;
  });
  return issues.join("; ");
}
