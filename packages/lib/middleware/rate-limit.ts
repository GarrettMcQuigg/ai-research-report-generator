/**
 * Rate limiting middleware using in-memory storage
 * Prevents brute force and DoS attacks
 */

import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage } from '../helpers/validation';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests allowed in the window
}

// In-memory store for rate limiting
// Key format: "identifier:endpoint"
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Get client identifier from request
 * Uses IP address or falls back to a header-based identifier
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from various headers (for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  if (cfConnectingIp) return cfConnectingIp;
  if (realIp) return realIp;
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  // Fallback to a generic identifier (not ideal but prevents crashes)
  return 'unknown-client';
}

/**
 * Check if request is rate limited
 * @param identifier - Unique identifier for the client (IP, user ID, etc.)
 * @param endpoint - Endpoint being accessed
 * @param config - Rate limit configuration
 * @returns Object with allowed status and retry info
 */
export function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): { allowed: boolean; retryAfter?: number; remaining?: number } {
  const key = `${identifier}:${endpoint}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // No entry exists, create new one
  if (!entry) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return { allowed: true, remaining: config.maxRequests - 1 };
  }

  // Window has expired, reset
  if (entry.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return { allowed: true, remaining: config.maxRequests - 1 };
  }

  // Within window, check if limit exceeded
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000); // seconds
    return { allowed: false, retryAfter };
  }

  // Increment count
  entry.count += 1;
  return { allowed: true, remaining: config.maxRequests - entry.count };
}

/**
 * Rate limit middleware wrapper
 * @param config - Rate limit configuration
 * @param identifierFn - Optional function to get custom identifier (default: IP)
 */
export function createRateLimiter(
  config: RateLimitConfig,
  identifierFn?: (request: NextRequest) => Promise<string> | string
) {
  return async (
    request: NextRequest,
    endpoint: string
  ): Promise<NextResponse | null> => {
    try {
      // Get identifier
      const identifier = identifierFn
        ? await identifierFn(request)
        : getClientIdentifier(request);

      // Check rate limit
      const result = checkRateLimit(identifier, endpoint, config);

      if (!result.allowed) {
        console.warn('[RATE_LIMIT_EXCEEDED]', {
          identifier: identifier.substring(0, 10) + '...', // Partial for privacy
          endpoint,
          timestamp: new Date().toISOString(),
        });

        return NextResponse.json(
          {
            message: getErrorMessage('RATE_LIMIT_EXCEEDED'),
            retryAfter: result.retryAfter,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(result.retryAfter),
              'X-RateLimit-Limit': String(config.maxRequests),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(
                Math.ceil((Date.now() + (result.retryAfter || 0) * 1000) / 1000)
              ),
            },
          }
        );
      }

      // Add rate limit headers to response (will be added by caller)
      return null; // null means allowed, caller should proceed
    } catch (error) {
      // Log error but don't block request on rate limit failures
      console.error('[RATE_LIMIT_ERROR]', {
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint,
        timestamp: new Date().toISOString(),
      });
      return null; // Fail open - allow request if rate limiting fails
    }
  };
}

// Pre-configured rate limiters for different endpoints

/**
 * Rate limiter for signup endpoint
 * 5 requests per 15 minutes per IP
 */
export const signupRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
});

/**
 * Rate limiter for report generation
 * 10 requests per hour per user
 */
export const generateReportRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
});

/**
 * Rate limiter for report access
 * 100 requests per minute per user
 */
export const reportAccessRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
});

/**
 * Helper to get user ID from request for user-specific rate limiting
 * This should be used with authenticated endpoints
 */
export async function getUserIdentifier(request: NextRequest): Promise<string> {
  // Import here to avoid circular dependencies
  const { getCurrentUserId } = await import('../helpers/supabase/auth');

  try {
    const userId = await getCurrentUserId();
    return `user:${userId}`;
  } catch {
    // If user not authenticated, fall back to IP
    return getClientIdentifier(request);
  }
}

/**
 * Rate limiter for authenticated report generation
 * Uses user ID instead of IP
 */
export const authenticatedGenerateRateLimiter = createRateLimiter(
  {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
  },
  getUserIdentifier
);

/**
 * Rate limiter for authenticated report access
 * Uses user ID instead of IP
 */
export const authenticatedReportAccessRateLimiter = createRateLimiter(
  {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  getUserIdentifier
);
