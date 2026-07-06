import { NextRequest } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { successResponse, errorResponse } from "@/src/lib/api/response";
import { withAuth } from "@/src/lib/middleware/auth";
import { withRoles } from "@/src/lib/middleware/rbac";

export const GET = withAuth(
  withRoles(["ADMIN"], async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          bookings: {
            include: { event: { select: { title: true } } },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          events: {
            orderBy: { createdAt: "desc" },
            take: 10,
          }
        }
      });

      if (!user) {
        return errorResponse("NOT_FOUND", "User not found.", 404);
      }

      return successResponse({
        bookings: user.bookings,
        createdEvents: user.events,
      });
    } catch (err) {
      console.error("[GET /admin/users/[id]/activity]", err);
      return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
    }
  }) as Parameters<typeof withAuth>[0]
);
