import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { UserService } from '../services/user.service';

const router = Router();

router.get('/me', authMiddleware, async (req, res) => {
  try { res.json(await UserService.getMe(req.user!.userId)); }
  catch (e: unknown) { res.status(404).json({ error: e instanceof Error ? e.message : 'Not found' }); }
});

router.patch('/me', authMiddleware, async (req, res) => {
  try { res.json(await UserService.updateMe(req.user!.userId, req.body)); }
  catch { res.status(400).json({ error: 'Update failed' }); }
});

router.put('/me/interests', authMiddleware, async (req, res) => {
  try {
    const { interestIds } = req.body as { interestIds: string[] };
    res.json(await UserService.updateInterests(req.user!.userId, interestIds));
  } catch { res.status(400).json({ error: 'Failed to update interests' }); }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try { res.json(await UserService.getPublicProfile(req.params['id']!, req.user!.userId)); }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Not found';
    res.status(msg === 'BLOCKED' || msg === 'FORBIDDEN' ? 403 : 404).json({ error: msg });
  }
});

router.post('/block/:id', authMiddleware, async (req, res) => {
  try { res.json(await UserService.blockUser(req.user!.userId, req.params['id']!)); }
  catch { res.status(400).json({ error: 'Failed' }); }
});

router.delete('/block/:id', authMiddleware, async (req, res) => {
  try { res.json(await UserService.unblockUser(req.user!.userId, req.params['id']!)); }
  catch { res.status(400).json({ error: 'Failed' }); }
});

router.post('/report/:id', authMiddleware, async (req, res) => {
  try { res.json(await UserService.reportUser(req.user!.userId, req.params['id']!, req.body.reason)); }
  catch { res.status(400).json({ error: 'Failed' }); }
});

router.post('/push-token', authMiddleware, async (req, res) => {
  try { res.json(await UserService.registerPushToken(req.user!.userId, req.body.token)); }
  catch { res.status(400).json({ error: 'Failed' }); }
});

export default router;
