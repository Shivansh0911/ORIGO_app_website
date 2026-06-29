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
      : msg.startsWith('NOT_MATCHED') ? 403
      : msg === 'ALREADY_SHIPPED' ? 409
      : 500;
    res.status(status).json({ error: msg });
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
    const targets = await ShipService.getMatches(req.user!.userId);
    res.json(targets);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
