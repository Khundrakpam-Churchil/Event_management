import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/src/lib/middleware/auth";

// Stateless logout — client discards the token.
// The withAuth wrapper ensures the request has a valid token before we return 204.
export const POST = withAuth(async (_req: NextRequest) => {
  return new NextResponse(null, { status: 204 });
});
