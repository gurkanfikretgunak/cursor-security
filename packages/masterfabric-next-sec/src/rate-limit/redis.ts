import type { RateLimitStore } from "./index.js";

export type RedisLike = {
  incr(key: string): Promise<number> | number;
  pexpire(key: string, ms: number): Promise<unknown> | unknown;
  pttl(key: string): Promise<number> | number;
};

/**
 * Redis-backed store for production rate limiting.
 * Pass any client that implements INCR / PEXPIRE / PTTL (e.g. ioredis).
 */
export class RedisRateLimitStore implements RateLimitStore {
  constructor(
    private readonly redis: RedisLike,
    private readonly prefix = "rl:",
  ) {}

  async increment(
    key: string,
    windowMs: number,
  ): Promise<{ count: number; resetAt: number }> {
    const redisKey = `${this.prefix}${key}`;
    const count = Number(await this.redis.incr(redisKey));
    if (count === 1) {
      await this.redis.pexpire(redisKey, windowMs);
    }
    const ttl = Number(await this.redis.pttl(redisKey));
    const resetAt =
      ttl > 0 ? Date.now() + ttl : Date.now() + windowMs;
    return { count, resetAt };
  }
}
