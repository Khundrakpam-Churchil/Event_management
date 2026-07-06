import { NextRequest } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { successResponse, errorResponse } from "@/src/lib/api/response";
import { withAuth } from "@/src/lib/middleware/auth";
import { withRoles } from "@/src/lib/middleware/rbac";

export const PATCH = withAuth(
  withRoles(["ADMIN"], async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const { role } = body;

      if (!role || !["USER", "ORGANIZER", "ADMIN"].includes(role)) {
        return errorResponse("BAD_REQUEST", "Invalid role specified.", 400);
      }

      const user = await prisma.user.update({
        where: { id },
        data: { role },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });

      return successResponse(user);
    } catch (err) {
      console.error("[PATCH /admin/users/[id]]", err);
      return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
    }
  }) as Parameters<typeof withAuth>[0]
);
