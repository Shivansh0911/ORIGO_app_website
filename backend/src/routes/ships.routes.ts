import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { ShipService } from '../services/ship.service';

const router = Router();
router.use(authMiddleware);

const CreateShipSchema = z.object({
  targetOneId: z.string().cuid(),
  targetTwoId: z.string().cuid(),
  message: z.string().max(200).optional(),
});

router.post('/', validate(CreateShipSchema), async (req: Request, res: Response) => {
  try {
    const { targetOneId, targetTwoId, message } = req.body as z.infer<typeof CreateShipSchema>;
    const ship = await ShipService.createShip(req.user!.userId, targetOneId, targetTwoId, message);
    res.status(201).json(ship);
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg === 'SAME_TARGET' || msg === 'CANNOT_SHIP_SELF' ? 400
      : msg === 'BLOCKED' || msg === 'DIFFERENT_CAMPUS' ? 403
      : msg.endsWith('OPTED_OUT') ? 403
      : msg === 'TARGET_UNAVAILABLE' ? 404
      : msg === 'ALREADY_SHIPPED' ? 409
      : msg === 'DAILY_SHIP_LIMIT_REACHED' ? 429
      : 500;
    // Never reveal *which* target opted out — that tells the shipper something
    // about a third party's private setting.
    const message = msg.endsWith('OPTED_OUT')
      ? "One of them isn't open to being shipped right now."
      : msg === 'DAILY_SHIP_LIMIT_REACHED'
        ? "You're out of ships for today."
        : undefined;
    res.status(status).json({ error: msg, message });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const data = await ShipService.getMyShips(req.user!.userId);
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/eligible-targets', async (req: Request, res: Response) => {
  try {
    const targets = await ShipService.getEligibleTargets(req.user!.userId);
    res.json(targets);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
