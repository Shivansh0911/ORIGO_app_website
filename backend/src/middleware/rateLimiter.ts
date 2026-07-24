import rateLimit from 'express-rate-limit';
import { redis } from '../utils/redis';

function redisStore(prefix: string, windowMs: number) {
  const windowSeconds = Math.ceil(windowMs / 1000);
  return {
    async increment(key: string) {
      const fullKey = `rl:${prefix}:${key}`;
      const count = await redis.incr(fullKey);
      if (count === 1) await redis.expire(fullKey, windowSeconds);
      return { totalHits: count, resetTime: new Date(Date.now() + windowMs) };
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
  store: redisStore('api', 60 * 1000),
  keyGenerator: (req) => req.user?.userId ?? req.ip ?? 'unknown',
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  store: redisStore('auth', 15 * 60 * 1000),
  skipSuccessfulRequests: true,
  keyGenerator: (req) => req.ip ?? 'unknown',
  message: { error: 'Too many failed auth attempts. Try again in 15 minutes.' },
});

export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  store: redisStore('otp', 60 * 60 * 1000),
  keyGenerator: (req) => req.ip ?? 'unknown',
  message: { error: 'OTP limit reached. Try again in 1 hour.' },
});

export const rizzLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  store: redisStore('rizz', 60 * 1000),
  keyGenerator: (req) => req.user?.userId ?? req.ip ?? 'unknown',
  message: { error: 'Rizz rate limit reached.' },
});

export const pulseLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  store: redisStore('pulse', 60 * 60 * 1000),
  keyGenerator: (req) => req.user?.userId ?? req.ip ?? 'unknown',
  message: { error: 'Pulse limit reached. You can post up to 5 pulses per hour.' },
});
