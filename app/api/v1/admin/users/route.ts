import { NextRequest } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { successResponse, errorResponse } from "@/src/lib/api/response";
import { withAuth, type AuthenticatedRequest } from "@/src/lib/middleware/auth";
import { withRoles } from "@/src/lib/middleware/rbac";

// GET /api/v1/admin/users — Admin only: list all users
export const GET = withAuth(
  withRoles(["ADMIN"], async (req: NextRequest) => {
    try {
      const { searchParams } = req.nextUrl;
      const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
      const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "50")));
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true, email: true, role: true, createdAt: true },
        }),
        prisma.user.count(),
      ]);

      return successResponse(users, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      console.error("[GET /admin/users]", err);
      return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
    }
  }) as Parameters<typeof withAuth>[0]
);
