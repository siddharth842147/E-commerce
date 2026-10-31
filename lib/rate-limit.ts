/**
 * Lightweight In-Memory Sliding-Window Rate Limiter
 *
 * Protects public API endpoints, payment order generation, and authentication
 * endpoints against brute-force and DDoS attacks.
 *
 * When deploying across multiple serverless regions or instances, consider
 * Upstash Redis / Redis for shared distributed state. For single-process
 * or edge instances, this sliding-window token tracker provides instant,
 * zero-latency protection without external dependencies.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const cache = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of cache.entries()) {
      // Discard entries older than 10 minutes
      const valid = record.timestamps.filter((ts) => now - ts < 600_000);
      if (valid.length === 0) {
        cache.delete(key);
      } else {
        record.timestamps = valid;
      }
    }
  }, 300_000);
}

export interface RateLimitOptions {
  /** Maximum number of requests allowed within the window */
  limit?: number;
  /** Window size in seconds (default: 60) */
  windowSeconds?: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Checks and records a request against a rate-limit key.
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const limit = options.limit ?? 60;
  const windowMs = (options.windowSeconds ?? 60) * 1000;
  const now = Date.now();
  const windowStart = now - windowMs;

  const record = cache.get(key) || { timestamps: [] };
  // Keep only timestamps within the sliding window
  const activeTimestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (activeTimestamps.length >= limit) {
    const oldest = activeTimestamps[0];
    const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));

    return {
      success: false,
      limit,
      remaining: 0,
      reset: resetSeconds,
    };
  }

  activeTimestamps.push(now);
  cache.set(key, { timestamps: activeTimestamps });

  return {
    success: true,
    limit,
    remaining: Math.max(0, limit - activeTimestamps.length),
    reset: options.windowSeconds ?? 60,
  };
}

/**
 * Extracts client IP address from standard proxy/CDN headers.
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  return "127.0.0.1";
}

