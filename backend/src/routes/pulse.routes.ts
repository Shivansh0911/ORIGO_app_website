import { Router } from 'express';
import { PulseService } from '../services/pulse.service';
import { pulseLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { CreatePulseSchema } from '../schemas/pulse.schema';

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

// VAL-01: Zod validates category enum and length caps before the service runs
router.post('/', pulseLimiter, validate(CreatePulseSchema), async (req, res) => {
  try {
    const pulse = await PulseService.createPulse(req.user!.userId, req.body);
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
    const status = msg === 'PULSE_NOT_FOUND' ? 404
      : (msg === 'ALREADY_RESPONDED' || msg === 'PULSE_FULL') ? 409
      : 400;
    const message = msg === 'PULSE_FULL' ? "This Pulse is full — they've got enough people already." : undefined;
    res.status(status).json({ error: msg, message });
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
