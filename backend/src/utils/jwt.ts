import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { redis } from './redis';

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`[startup] Missing required env var: ${name}`);
  return val;
}

const ACCESS_SECRET = requireEnv('JWT_SECRET');
const REFRESH_SECRET = requireEnv('JWT_REFRESH_SECRET');
const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES = '30d';
const REFRESH_TTL = 30 * 24 * 60 * 60;

interface TokenPayload {
  userId: string;
  deviceId: string;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function issueTokenPair(
  userId: string,
  deviceId: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const payload: TokenPayload = { userId, deviceId };
  const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
  await redis.set(`refresh:${userId}:${deviceId}`, hashToken(refreshToken), 'EX', REFRESH_TTL);
  return { accessToken, refreshToken };
}

export async function rotateRefreshToken(
  userId: string,
  deviceId: string,
  oldToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const decoded = jwt.verify(oldToken, REFRESH_SECRET) as TokenPayload;
  const storedHash = await redis.get(`refresh:${decoded.userId}:${decoded.deviceId}`);
  if (!storedHash || storedHash !== hashToken(oldToken)) {
    const keys = await redis.keys(`refresh:${userId}:*`);
    if (keys.length > 0) await redis.del(...keys);
    throw new Error('REFRESH_TOKEN_REUSE_DETECTED');
  }
  await redis.del(`refresh:${decoded.userId}:${decoded.deviceId}`);
  return issueTokenPair(decoded.userId, decoded.deviceId);
}

export async function invalidateAllSessions(userId: string): Promise<void> {
  const keys = await redis.keys(`refresh:${userId}:*`);
  if (keys.length > 0) await redis.del(...keys);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
}
