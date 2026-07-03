import { NextResponse } from "next/server";
import { openApiSpec } from "@/src/lib/openapi/spec";

// GET /api/v1/docs — returns the OpenAPI 3.1 JSON spec
export function GET() {
  return NextResponse.json(openApiSpec, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
