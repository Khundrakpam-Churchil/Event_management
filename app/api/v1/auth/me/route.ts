import { NextRequest } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { successResponse, errorResponse } from "@/src/lib/api/response";
import { withAuth, type AuthenticatedRequest } from "@/src/lib/middleware/auth";

export const GET = withAuth(async (req: NextRequest) => {
  const user = (req as AuthenticatedRequest).user;

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!dbUser) {
      return errorResponse("UNAUTHORIZED", "User not found.", 401);
    }

    return successResponse({ user: dbUser });
  } catch (err) {
    console.error("[me]", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
  }
});
