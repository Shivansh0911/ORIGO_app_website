import { Router } from 'express';
import { PulseCategory } from '@prisma/client';
import { PulseService } from '../services/pulse.service';
import { pulseLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/feed', async (req, res) => {
  try {
    const pulses = await PulseService.getFeed(req.user!.userId);
    res.json(pulses);
  } catch {
    res.status(500).json({ error: 'Failed to load feed' });
  }
});

router.get('/mine', async (req, res) => {
  try {
    const pulse = await PulseService.getMyPulse(req.user!.userId);
    res.json(pulse ?? null);
  } catch {
    res.status(500).json({ error: 'Failed to load pulse' });
  }
});

router.post('/', pulseLimiter, async (req, res) => {
  try {
    const { category, text, vibe } = req.body as { category: PulseCategory; text: string; vibe?: string };
    if (!category || !text?.trim()) { res.status(400).json({ error: 'category and text are required' }); return; }
    if (text.length > 140) { res.status(400).json({ error: 'text must be 140 characters or fewer' }); return; }
    const pulse = await PulseService.createPulse(req.user!.userId, { category, text: text.trim(), vibe });
    res.status(201).json(pulse);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create pulse';
    res.status(400).json({ error: msg });
  }
});

router.post('/:pulseId/respond', async (req, res) => {
  try {
    const response = await PulseService.respondToPulse(req.params.pulseId!, req.user!.userId);
    res.status(201).json(response);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to respond';
    const status = msg === 'PULSE_NOT_FOUND' ? 404 : msg === 'ALREADY_RESPONDED' ? 409 : 400;
    res.status(status).json({ error: msg });
  }
});

router.delete('/:pulseId', async (req, res) => {
  try {
    await PulseService.cancelPulse(req.params.pulseId!, req.user!.userId);
    res.json({ message: 'Pulse cancelled' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to cancel';
    const status = msg === 'PULSE_NOT_FOUND' ? 404 : msg === 'NOT_PULSE_AUTHOR' ? 403 : 400;
    res.status(status).json({ error: msg });
  }
});

export default router;
