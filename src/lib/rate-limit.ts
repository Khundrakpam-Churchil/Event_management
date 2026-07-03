/**
 * Simple in-memory rate limiter for development.
 * Tracks request counts per IP within a time window.
 * For production, replace with a distributed solution (e.g., Upstash Redis).
 */

interface RateLimitRecord {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitRecord>();

export interface RateLimitOptions {
  /** Maximum requests allowed per window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if an identifier (IP address) is within the rate limit.
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const record = store.get(identifier);

  if (!record || now - record.windowStart >= options.windowMs) {
    // New window: reset counter
    store.set(identifier, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetAt: now + options.windowMs,
    };
  }

  if (record.count >= options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.windowStart + options.windowMs,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: options.maxRequests - record.count,
    resetAt: record.windowStart + options.windowMs,
  };
}

// Default options for auth endpoints: 10 requests per 60 seconds
export const AUTH_RATE_LIMIT: RateLimitOptions = {
  maxRequests: 10,
  windowMs: 60 * 1000, // 60 seconds
};

// Default options for booking endpoints: 20 requests per 60 seconds
export const BOOKING_RATE_LIMIT: RateLimitOptions = {
  maxRequests: 20,
  windowMs: 60 * 1000,
};
