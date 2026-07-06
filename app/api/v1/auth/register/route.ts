import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/src/lib/prisma";
import { signToken } from "@/src/lib/jwt";
import { errorResponse } from "@/src/lib/api/response";
import { RegisterInputSchema } from "@/src/lib/schemas/auth.schema";
import { checkRateLimit, AUTH_RATE_LIMIT } from "@/src/lib/rate-limit";
import { AppError } from "@/src/lib/errors";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  const rl = checkRateLimit(`register:${ip}`, AUTH_RATE_LIMIT);
  if (!rl.allowed) {
    return errorResponse("RATE_LIMIT_EXCEEDED", "Too many requests. Please try again later.", 429);
  }

  // Validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("VALIDATION_ERROR", "Request body must be valid JSON.", 422);
  }

  const result = RegisterInputSchema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues
      .map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
      .join("; ");
    return errorResponse("VALIDATION_ERROR", message, 422);
  }

  const { name, email, password } = result.data;

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: "USER" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    const token = signToken({ sub: user.id, email: user.email, role: user.role });

    // Build response and set auth-token cookie directly on it
    const response = NextResponse.json(
      { success: true, data: { token, user }, meta: null },
      { status: 201 }
    );

    response.cookies.set("auth-token", token, {
      path: "/",
      maxAge: 86400,
      sameSite: "lax",
      httpOnly: false,
    });

    return response;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return errorResponse("EMAIL_ALREADY_EXISTS", "An account with this email already exists.", 409);
    }
    if (AppError.isAppError(err)) {
      return errorResponse(err.code, err.message, err.httpStatus);
    }
    console.error("[register]", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
  }
}

