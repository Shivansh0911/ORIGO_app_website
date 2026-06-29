import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { DiscoverService } from '../services/discover.service';

const router = Router();

router.get('/people', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const filters = {
      gender: req.query['gender'] as string | undefined,
      lookingFor: req.query['lookingFor'] as string | undefined,
      collegeName: req.query['college'] as string | undefined,
    };
    const users = await DiscoverService.getPeople(req.user!.userId, filters, page);
    res.json(users);
  } catch (e: unknown) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed' });
  }
});

router.get('/campus', authMiddleware, async (req, res) => {
  try {
    const users = await DiscoverService.getCampusPeople(req.user!.userId);
    res.json(users);
  } catch {
    res.status(400).json({ error: 'Failed' });
  }
});

export default router;
