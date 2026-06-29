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

// IAP: Ship a Friend — ₹19
router.post('/ship/order', authMiddleware, async (req, res) => {
  try { res.json(await PaymentService.createShipOrder(req.user!.userId)); }
  catch { res.status(500).json({ error: 'Failed' }); }
});

router.post('/ship/verify', authMiddleware,
  validate(z.object({ orderId: z.string(), paymentId: z.string(), signature: z.string() })),
  async (req, res) => {
    try { res.json(await PaymentService.verifyShipOrder(req.body.orderId, req.body.paymentId, req.body.signature)); }
    catch { res.status(400).json({ error: 'Verification failed' }); }
  }
);

// IAP: Sticker Pack — ₹29/₹49
router.post('/sticker/order', authMiddleware,
  validate(z.object({ packId: z.enum(['basic', 'premium']) })),
  async (req, res) => {
    try { res.json(await PaymentService.createStickerOrder(req.user!.userId, req.body.packId)); }
    catch { res.status(500).json({ error: 'Failed' }); }
  }
);

// IAP: Rizz Pack — ₹39
router.post('/rizz-pack/order', authMiddleware, async (req, res) => {
  try { res.json(await PaymentService.createRizzPackOrder(req.user!.userId)); }
  catch { res.status(500).json({ error: 'Failed' }); }
});

// IAP: See Who Shipped You — ₹9
router.post('/view-ships/order', authMiddleware, async (req, res) => {
  try { res.json(await PaymentService.createViewShipsOrder(req.user!.userId)); }
  catch { res.status(500).json({ error: 'Failed' }); }
});

// Generic IAP verify
router.post('/iap/verify', authMiddleware,
  validate(z.object({ orderId: z.string(), paymentId: z.string(), signature: z.string() })),
  async (req, res) => {
    try { res.json(await PaymentService.verifyIap(req.body.orderId, req.body.paymentId, req.body.signature)); }
    catch { res.status(400).json({ error: 'Verification failed' }); }
  }
);

export default router;
