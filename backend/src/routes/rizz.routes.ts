import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { rizzLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { RizzService } from '../services/rizz.service';

const router = Router();

router.post('/sessions', authMiddleware, validate(z.object({ targetId: z.string().cuid() })), async (req, res) => {
  try { res.status(201).json(await RizzService.startSession(req.user!.userId, req.body.targetId)); }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed';
    const map: Record<string, number> = { CANNOT_RIZZ_SELF: 400, BLOCKED: 403, SESSION_ALREADY_EXISTS: 409, ALREADY_MATCHED: 409, DAILY_LIMIT_REACHED: 429 };
    res.status(map[msg] ?? 400).json({ error: msg });
  }
});

router.get('/sessions', authMiddleware, async (req, res) => {
  const type = (req.query['type'] as string) === 'outgoing' ? 'outgoing' : 'incoming';
  try { res.json(await RizzService.getSessions(req.user!.userId, type)); }
  catch { res.status(500).json({ error: 'Failed' }); }
});

router.get('/sessions/:id', authMiddleware, async (req, res) => {
  try { res.json(await RizzService.getSession(req.params['id']!, req.user!.userId)); }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed';
    res.status(msg === 'FORBIDDEN' ? 403 : 404).json({ error: msg });
  }
});

router.post('/sessions/:id/messages', authMiddleware, rizzLimiter,
  validate(z.object({ content: z.string().min(1).max(500).trim() })),
  async (req, res) => {
    try { res.json(await RizzService.sendMessage(req.params['id']!, req.user!.userId, req.body.content)); }
    catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed';
      const map: Record<string, number> = { SESSION_NOT_FOUND: 404, NOT_IN_SESSION: 403, WAITING_FOR_REPLY: 409, MESSAGE_LIMIT_REACHED: 409, SESSION_NOT_ACTIVE: 409 };
      res.status(map[msg] ?? 400).json({ error: msg });
    }
  }
);

router.post('/sessions/:id/decline', authMiddleware, async (req, res) => {
  try { res.json(await RizzService.declineSession(req.params['id']!, req.user!.userId)); }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed';
    res.status(msg === 'NOT_YOUR_SESSION' ? 403 : 400).json({ error: msg });
  }
});

router.get('/sessions/:id/icebreaker', authMiddleware, async (req, res) => {
  try {
    const session = await RizzService.getSession(req.params['id']!, req.user!.userId);
    res.json(await RizzService.generateIcebreakerPrompt(req.user!.userId, session.targetId));
  } catch { res.status(400).json({ error: 'Failed' }); }
});

export default router;
