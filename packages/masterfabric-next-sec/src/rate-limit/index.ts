export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
};

export type RateLimitStore = {
  increment(
    key: string,
    windowMs: number,
  ): Promise<{ count: number; resetAt: number }> | { count: number; resetAt: number };
};

export type RateLimitPreset = "auth" | "api" | "sensitive";

const PRESETS: Record<RateLimitPreset, { limit: number; windowMs: number }> = {
  auth: { limit: 10, windowMs: 60_000 },
  api: { limit: 60, windowMs: 60_000 },
  sensitive: { limit: 5, windowMs: 60_000 },
};

type Bucket = { count: number; resetAt: number };

/** In-memory store for local/dev. Swap for Redis in production. */
export class MemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, Bucket>();

  increment(key: string, windowMs: number): { count: number; resetAt: number } {
    const now = Date.now();
    const existing = this.buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      const resetAt = now + windowMs;
      const bucket = { count: 1, resetAt };
      this.buckets.set(key, bucket);
      return bucket;
    }
    existing.count += 1;
    this.buckets.set(key, existing);
    return existing;
  }
}

export type RateLimiter = {
  check(key: string, preset?: RateLimitPreset): Promise<RateLimitResult>;
  checkCustom(
    key: string,
    limit: number,
    windowMs: number,
  ): Promise<RateLimitResult>;
};

export { RedisRateLimitStore, type RedisLike } from "./redis.js";

export function createRateLimiter(
  store: RateLimitStore = new MemoryRateLimitStore(),
): RateLimiter {
  async function checkCustom(
    key: string,
    limit: number,
    windowMs: number,
  ): Promise<RateLimitResult> {
    const { count, resetAt } = await store.increment(key, windowMs);
    const remaining = Math.max(0, limit - count);
    return {
      success: count <= limit,
      remaining,
      resetAt,
      limit,
    };
  }

  return {
    checkCustom,
    async check(key, preset = "api") {
      const { limit, windowMs } = PRESETS[preset];
      return checkCustom(`${preset}:${key}`, limit, windowMs);
    },
  };
}
