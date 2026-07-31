import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../utils/prisma';

const router = Router();

/**
 * "Happening Around You" feed — see BUILD_PLAN.md 1.9. Campus-scoped, no
 * community membership required. This is the one surface whose content the
 * team fully controls, which is why it's the day-one hero against emptiness:
 * a real schedule here means the app is never empty regardless of user count.
 *
 * No sponsored-card mixing (unlike the seed data this replaces) — ad-load
 * infrastructure is explicitly out of scope for launch.
 */
router.get('/', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { collegeName: true },
  });
  if (!user?.collegeName) {
    res.json([]);
    return;
  }
  const events = await prisma.happeningEvent.findMany({
    where: { collegeName: user.collegeName, startAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    orderBy: { startAt: 'asc' },
    take: 20,
  });
  res.json(events);
});

export default router;
