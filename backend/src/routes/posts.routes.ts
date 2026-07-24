import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CommunityService } from '../services/community.service';

const router = Router();

// Flat routes so the web client can operate on posts without carrying communityId.
// The service resolves community context from the postId.

router.post('/:postId/like', authMiddleware, async (req, res) => {
  try { res.json(await CommunityService.likePost(req.params['postId']!, req.user!.userId)); }
  catch { res.status(400).json({ error: 'Failed' }); }
});

router.delete('/:postId/like', authMiddleware, async (req, res) => {
  try { res.json(await CommunityService.likePost(req.params['postId']!, req.user!.userId)); }
  catch { res.status(400).json({ error: 'Failed' }); }
});

router.get('/:postId/comments', authMiddleware, async (req, res) => {
  try { res.json(await CommunityService.getComments(req.params['postId']!)); }
  catch { res.status(400).json({ error: 'Failed' }); }
});

router.post('/:postId/comments', authMiddleware,
  validate(z.object({ content: z.string().min(1).max(1000) })),
  async (req, res) => {
    try { res.status(201).json(await CommunityService.addComment(req.params['postId']!, req.user!.userId, req.body.content)); }
    catch { res.status(400).json({ error: 'Failed' }); }
  }
);

export default router;
