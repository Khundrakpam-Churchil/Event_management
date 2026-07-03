import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/src/lib/prisma";
import { signToken } from "@/src/lib/jwt";
import { successResponse, errorResponse } from "@/src/lib/api/response";
import { LoginInputSchema } from "@/src/lib/schemas/auth.schema";
import { checkRateLimit, AUTH_RATE_LIMIT } from "@/src/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  const rl = checkRateLimit(`login:${ip}`, AUTH_RATE_LIMIT);
  if (!rl.allowed) {
    return errorResponse("RATE_LIMIT_EXCEEDED", "Too many requests. Please try again later.", 429);
  }

  // Validate
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("VALIDATION_ERROR", "Request body must be valid JSON.", 422);
  }

  const result = LoginInputSchema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues
      .map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
      .join("; ");
    return errorResponse("VALIDATION_ERROR", message, 422);
  }

  const { email, password } = result.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return errorResponse("INVALID_CREDENTIALS", "Invalid email or password.", 401);
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return errorResponse("INVALID_CREDENTIALS", "Invalid email or password.", 401);
    }

    const token = signToken({ sub: user.id, email: user.email, role: user.role });

    return successResponse({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("[login]", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
  }
}
