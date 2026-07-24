import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../utils/prisma';

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; deviceId: string };
    }
  }
}

export async function requireVerified(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Unauthenticated' }); return; }
  const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { isVerified: true } });
  if (!user?.isVerified) {
    res.status(403).json({ error: 'College email verification required to use this feature' });
    return;
  }
  next();
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
