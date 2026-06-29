import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { ChatService } from '../services/chat.service';

const router = Router();

const SendMessageSchema = z.object({
  content: z.string().min(1).max(2000).trim(),
  mediaUrl: z.string().url().optional(),
  messageType: z.enum(['TEXT', 'IMAGE', 'STICKER']).optional(),
});

router.get('/', authMiddleware, async (req, res) => {
  try { res.json(await ChatService.getConversations(req.user!.userId)); }
  catch { res.status(500).json({ error: 'Failed' }); }
});

router.get('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const cursor = req.query['cursor'] as string | undefined;
    res.json(await ChatService.getMessages(req.params['id']!, req.user!.userId, cursor));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed';
    res.status(msg === 'FORBIDDEN' ? 403 : 500).json({ error: msg });
  }
});

router.post('/:id/messages', authMiddleware, validate(SendMessageSchema), async (req, res) => {
  try {
    const msg = await ChatService.sendMessage(
      req.params['id']!,
      req.user!.userId,
      req.body.content,
      req.body.mediaUrl,
      req.body.messageType
    );
    res.status(201).json(msg);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed';
    res.status(msg === 'FORBIDDEN' ? 403 : 400).json({ error: msg });
  }
});

router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    await ChatService.markRead(req.params['id']!, req.user!.userId);
    res.json({ message: 'Marked as read' });
  } catch { res.status(400).json({ error: 'Failed' }); }
});

router.delete('/:conversationId/messages/:messageId', authMiddleware, async (req, res) => {
  try {
    await ChatService.deleteMessage(req.params['messageId']!, req.user!.userId);
    res.json({ message: 'Deleted' });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed';
    res.status(msg === 'FORBIDDEN' ? 403 : 400).json({ error: msg });
  }
});

export default router;
