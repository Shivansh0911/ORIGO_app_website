import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { validateQuery } from '../middleware/validate';
import { NotificationService } from '../services/notification.service';

const router = Router();

const NotifCursorQuery = z.object({ cursor: z.string().cuid().optional() });

router.get('/', authMiddleware, validateQuery(NotifCursorQuery), async (req, res) => {
  try {
    const cursor = req.query['cursor'] as string | undefined;
    res.json(await NotificationService.getForUser(req.user!.userId, cursor));
  } catch { res.status(500).json({ error: 'Failed' }); }
});

router.get('/count', authMiddleware, async (req, res) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user!.userId);
    res.json({ count });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    await NotificationService.markRead(req.params['id']!, req.user!.userId);
    res.json({ message: 'Marked read' });
  } catch { res.status(400).json({ error: 'Failed' }); }
});

router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    await NotificationService.markAllRead(req.user!.userId);
    res.json({ message: 'All marked read' });
  } catch { res.status(400).json({ error: 'Failed' }); }
});

export default router;
