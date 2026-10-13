/**
 * MandiKart — Sliding-Window In-Memory Rate Limiter
 * Zero external dependencies. Enforces IP-based and route-based request rate limits
 * to prevent multi-click spamming and API abuse under high concurrency.
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up stale entries every 3 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < 120_000);
    if (entry.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}, 3 * 60 * 1000);

export function createRateLimiter(maxRequests: number, windowMs: number, keyPrefix = 'rl') {
  return (req: Request, res: Response, next: NextFunction): void => {
    // In local dev/testing, header or socket IP
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const key = `${keyPrefix}:${clientIp}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    let entry = rateLimitStore.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      rateLimitStore.set(key, entry);
    }

    // Filter out timestamps outside window
    entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

    if (entry.timestamps.length >= maxRequests) {
      const retryAfterSec = Math.max(1, Math.ceil(windowMs / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      res.setHeader('X-RateLimit-Limit', String(maxRequests));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.status(429).json({
        data: null,
        meta: null,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests from this client. Please wait ${retryAfterSec} seconds before retrying.`,
        },
      });
      return;
    }

    entry.timestamps.push(now);
    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequests - entry.timestamps.length)));
    next();
  };
}

/** General API rate limit: 150 requests per minute */
export const apiRateLimit = createRateLimiter(150, 60_000, 'api');

/** Sensitive Auth & OTP rate limit: 25 requests per minute */
export const strictAuthRateLimit = createRateLimiter(25, 60_000, 'auth');

/** Mutating endpoints (POST/PUT/DELETE): 60 requests per minute */
export const mutationRateLimit = createRateLimiter(60, 60_000, 'mutation');
