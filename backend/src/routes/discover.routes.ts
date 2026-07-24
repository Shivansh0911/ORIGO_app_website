import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { validateQuery } from '../middleware/validate';
import { DiscoverService } from '../services/discover.service';

const router = Router();

const DiscoverPeopleQuery = z.object({
  page:       z.coerce.number().int().min(1).max(100).optional().default(1),
  gender:     z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY']).optional(),
  lookingFor: z.enum(['FRIENDS', 'DATING', 'NETWORKING', 'STUDY_BUDDY']).optional(),
  college:    z.string().max(120).optional(),
});

router.get('/people', authMiddleware, validateQuery(DiscoverPeopleQuery), async (req, res) => {
  try {
    const { page, gender, lookingFor, college } = req.query as z.infer<typeof DiscoverPeopleQuery> & Record<string, string>;
    const filters = { gender, lookingFor, collegeName: college };
    const users = await DiscoverService.getPeople(req.user!.userId, filters, Number(page ?? 1));
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
