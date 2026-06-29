import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { MatchService } from '../services/match.service';

const router = Router();

router.post('/', authMiddleware,
  validate(z.object({ receiverId: z.string().cuid(), matchType: z.enum(['FRIEND', 'DATE', 'STUDY']).optional() })),
  async (req, res) => {
    try {
      const match = await MatchService.sendMatch(req.user!.userId, req.body.receiverId, req.body.matchType);
      res.status(201).json(match);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed';
      const map: Record<string, number> = { BLOCKED: 403, ALREADY_EXISTS: 409, CANNOT_MATCH_SELF: 400 };
      res.status(map[msg] ?? 400).json({ error: msg });
    }
  }
);

router.get('/', authMiddleware, async (req, res) => {
  try {
    const matches = await MatchService.getMatches(req.user!.userId, req.query['status'] as string | undefined);
    res.json(matches);
  } catch { res.status(500).json({ error: 'Failed' }); }
});

router.post('/:id/respond', authMiddleware,
  validate(z.object({ accept: z.boolean() })),
  async (req, res) => {
    try {
      const match = await MatchService.respondMatch(req.params['id']!, req.user!.userId, req.body.accept);
      res.json(match);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed';
      const map: Record<string, number> = { FORBIDDEN: 403, NOT_FOUND: 404, ALREADY_RESPONDED: 409 };
      res.status(map[msg] ?? 400).json({ error: msg });
    }
  }
);

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    res.json(await MatchService.unmatch(req.params['id']!, req.user!.userId));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed';
    res.status(msg === 'FORBIDDEN' ? 403 : 404).json({ error: msg });
  }
});

export default router;
