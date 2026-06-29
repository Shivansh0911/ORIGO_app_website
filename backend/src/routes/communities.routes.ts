import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CommunityService } from '../services/community.service';
import { prisma } from '../utils/prisma';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const filter = req.query['filter'] as string | undefined;
    const communities = await CommunityService.list(req.user!.userId, filter);
    res.json(communities);
  } catch { res.status(500).json({ error: 'Failed' }); }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const community = await prisma.community.findUnique({
      where: { id: req.params['id'] },
      include: {
        members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        interest: true,
        _count: { select: { members: true, posts: true } },
      },
    });
    if (!community) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(community);
  } catch { res.status(500).json({ error: 'Failed' }); }
});

router.post('/:id/join', authMiddleware, async (req, res) => {
  try { res.json(await CommunityService.join(req.params['id']!, req.user!.userId)); }
  catch (e: unknown) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed' });
  }
});

router.delete('/:id/leave', authMiddleware, async (req, res) => {
  try { res.json(await CommunityService.leave(req.params['id']!, req.user!.userId)); }
  catch { res.status(400).json({ error: 'Failed' }); }
});

router.get('/:id/posts', authMiddleware, async (req, res) => {
  try {
    const cursor = req.query['cursor'] as string | undefined;
    res.json(await CommunityService.getPosts(req.params['id']!, req.user!.userId, cursor));
  } catch { res.status(500).json({ error: 'Failed' }); }
});

router.post('/:id/posts', authMiddleware,
  validate(z.object({ content: z.string().min(1).max(1000), mediaUrls: z.array(z.string()).max(4).optional() })),
  async (req, res) => {
    try {
      const post = await CommunityService.createPost(req.params['id']!, req.user!.userId, req.body.content, req.body.mediaUrls ?? []);
      res.status(201).json(post);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed';
      res.status(msg === 'NOT_MEMBER' ? 403 : 400).json({ error: msg });
    }
  }
);

router.post('/:communityId/posts/:postId/like', authMiddleware, async (req, res) => {
  try { res.json(await CommunityService.likePost(req.params['postId']!, req.user!.userId)); }
  catch { res.status(400).json({ error: 'Failed' }); }
});

router.post('/:communityId/posts/:postId/comments', authMiddleware,
  validate(z.object({ content: z.string().min(1).max(500) })),
  async (req, res) => {
    try {
      const comment = await CommunityService.addComment(req.params['postId']!, req.user!.userId, req.body.content);
      res.status(201).json(comment);
    } catch { res.status(400).json({ error: 'Failed' }); }
  }
);

router.get('/:id/events', authMiddleware, async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { communityId: req.params['id'], scheduledAt: { gt: new Date() } },
      orderBy: { scheduledAt: 'asc' },
    });
    res.json(events);
  } catch { res.status(500).json({ error: 'Failed' }); }
});

router.post('/:id/events', authMiddleware,
  validate(z.object({
    title: z.string().min(1).max(100),
    description: z.string().max(1000).optional(),
    scheduledAt: z.string().datetime(),
    venue: z.string().optional(),
    isOnline: z.boolean().optional(),
    ticketPrice: z.number().int().min(0).optional(),
    maxAttendees: z.number().int().min(1).optional(),
  })),
  async (req, res) => {
    try {
      const member = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId: req.params['id']!, userId: req.user!.userId } },
      });
      if (!member || !['ADMIN', 'MODERATOR'].includes(member.role)) {
        res.status(403).json({ error: 'Only admins can create events' }); return;
      }
      const event = await prisma.event.create({
        data: { communityId: req.params['id']!, ...req.body, scheduledAt: new Date(req.body.scheduledAt) },
      });
      res.status(201).json(event);
    } catch { res.status(400).json({ error: 'Failed' }); }
  }
);

export default router;
