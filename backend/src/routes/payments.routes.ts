import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { PaymentService } from '../services/payment.service';

const router = Router();

router.post('/subscription/order', authMiddleware,
  validate(z.object({ plan: z.enum(['PREMIUM_MONTHLY', 'PREMIUM_QUARTERLY', 'PREMIUM_ANNUAL']) })),
  async (req, res) => {
    try { res.json(await PaymentService.createOrder(req.user!.userId, req.body.plan)); }
    catch (e: unknown) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Failed' });
    }
  }
);

router.post('/subscription/verify', authMiddleware,
  validate(z.object({
    plan: z.enum(['PREMIUM_MONTHLY', 'PREMIUM_QUARTERLY', 'PREMIUM_ANNUAL']),
    razorpay_order_id: z.string(),
    razorpay_payment_id: z.string(),
    razorpay_signature: z.string(),
  })),
  async (req, res) => {
    try {
      const { plan, ...paymentData } = req.body;
      res.json(await PaymentService.verifyAndActivate(req.user!.userId, plan, paymentData));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Verification failed';
      res.status(msg === 'INVALID_SIGNATURE' ? 400 : 500).json({ error: msg });
    }
  }
);

router.post('/boost/order', authMiddleware, async (req, res) => {
  try { res.json(await PaymentService.createBoostOrder(req.user!.userId)); }
  catch { res.status(500).json({ error: 'Failed' }); }
});

router.post('/boost/verify', authMiddleware,
  validate(z.object({ orderId: z.string(), paymentId: z.string(), signature: z.string() })),
  async (req, res) => {
    try {
      res.json(await PaymentService.activateBoost(req.user!.userId, req.body.orderId, req.body.paymentId, req.body.signature));
    } catch { res.status(400).json({ error: 'Verification failed' }); }
  }
);

export default router;
