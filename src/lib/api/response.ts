import { NextResponse } from "next/server";

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type SuccessEnvelope<T> = {
  success: true;
  data: T;
  meta: PaginationMeta | null;
};

export type ErrorEnvelope = {
  success: false;
  error: { code: string; message: string };
};

/**
 * Wraps a successful payload in the standard response envelope.
 * Produces: { success: true, data: T, meta: PaginationMeta | null }
 */
export function successResponse<T>(
  data: T,
  meta?: PaginationMeta | null,
  status: number = 200
): NextResponse<SuccessEnvelope<T>> {
  const body: SuccessEnvelope<T> = {
    success: true,
    data,
    meta: meta ?? null,
  };
  return NextResponse.json(body, { status });
}

/**
 * Wraps an error in the standard response envelope.
 * Produces: { success: false, error: { code, message } }
 */
export function errorResponse(
  code: string,
  message: string,
  httpStatus: number
): NextResponse<ErrorEnvelope> {
  const body: ErrorEnvelope = {
    success: false,
    error: { code, message },
  };
  return NextResponse.json(body, { status: httpStatus });
}
