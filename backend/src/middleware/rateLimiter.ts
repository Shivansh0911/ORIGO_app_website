import rateLimit from 'express-rate-limit';
import { redis } from '../utils/redis';

function redisStore(prefix: string) {
  return {
    async increment(key: string) {
      const fullKey = `rl:${prefix}:${key}`;
      const count = await redis.incr(fullKey);
      if (count === 1) await redis.expire(fullKey, 60);
      return { totalHits: count, resetTime: new Date() };
    },
    async decrement(key: string) {
      await redis.decr(`rl:${prefix}:${key}`);
    },
    async resetKey(key: string) {
      await redis.del(`rl:${prefix}:${key}`);
    },
  };
}

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.user?.userId ?? req.ip ?? 'unknown',
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => req.ip ?? 'unknown',
  message: { error: 'Too many failed auth attempts. Try again in 15 minutes.' },
});

export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.ip ?? 'unknown',
  message: { error: 'OTP limit reached. Try again in 1 hour.' },
});

export const rizzLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.userId ?? req.ip ?? 'unknown',
  message: { error: 'Rizz rate limit reached.' },
});
