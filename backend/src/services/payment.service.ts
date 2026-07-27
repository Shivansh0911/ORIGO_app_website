import crypto from 'crypto';
import { prisma } from '../utils/prisma';

// PSEUDO: Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in env vars to activate real payments.
// Get them from: dashboard.razorpay.com → Settings → API Keys (use test keys first).
// When both are set, all calls automatically use the real Razorpay API — no code changes needed.
const RAZORPAY_KEY_ID = process.env['RAZORPAY_KEY_ID'] ?? '';
const RAZORPAY_KEY_SECRET = process.env['RAZORPAY_KEY_SECRET'] ?? '';
const IS_PSEUDO = !RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET;

const PLAN_PRICES: Record<string, number> = {
  PREMIUM_MONTHLY: 9900,
  PREMIUM_QUARTERLY: 24900,
  PREMIUM_ANNUAL: 79900,
};

const PLAN_DAYS: Record<string, number> = {
  PREMIUM_MONTHLY: 30,
  PREMIUM_QUARTERLY: 90,
  PREMIUM_ANNUAL: 365,
};

async function razorpayRequest(path: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (IS_PSEUDO) {
    // PSEUDO: Returns mock order. Set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET to switch to real Razorpay.
    return { id: `mock_order_${Date.now()}` };
  }
  const credentials = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Razorpay error: ${res.status}`);
  return res.json() as Promise<Record<string, unknown>>;
}

function verifySignature(orderId: string, paymentId: string, signature: string): boolean {
  // Pseudo mode only — real credentials are configured, so a real signature is
  // required below. Gating this on IS_PSEUDO alone (not orderId/signature
  // shape) matters: an unconditional 'mock_sig' bypass would let anyone skip
  // real signature verification in production just by sending that literal
  // string, regardless of whether real Razorpay keys are set.
  if (IS_PSEUDO) return orderId.startsWith('mock_') && signature === 'mock_sig';
  const expected = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}

export const PaymentService = {
  async createOrder(userId: string, plan: string) {
    const amount = PLAN_PRICES[plan];
    if (!amount) throw new Error('INVALID_PLAN');

    const order = await razorpayRequest('/orders', {
      amount,
      currency: 'INR',
      receipt: `origo_${userId}_${Date.now()}`,
    }) as { id: string };

    return { orderId: order.id, amount, plan, currency: 'INR', keyId: RAZORPAY_KEY_ID };
  },

  async verifyAndActivate(userId: string, plan: string, paymentData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
    // SEC-02 TODO: unlike Ship/Sticker/RizzPack/ViewShips, this doesn't yet check
    // that razorpay_order_id was actually raised for this user/plan via an
    // IapPurchase-style row — only that the signature is a valid HMAC. Low risk
    // while RAZORPAY_KEY_SECRET stays private, but should be closed before going
    // live with real keys, same as activateBoost below.
    const valid = verifySignature(paymentData.razorpay_order_id, paymentData.razorpay_payment_id, paymentData.razorpay_signature);
    if (!valid) throw new Error('INVALID_SIGNATURE');

    const days = PLAN_DAYS[plan] ?? 30;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { isPremium: true, premiumExpiresAt: expiresAt } }),
      prisma.subscription.upsert({
        where: { userId },
        create: { userId, plan: plan as Parameters<typeof prisma.subscription.create>[0]['data']['plan'], expiresAt },
        update: { plan: plan as Parameters<typeof prisma.subscription.update>[0]['data'] extends { plan?: infer P } ? P : never, status: 'ACTIVE', expiresAt, startsAt: new Date() },
      }),
    ]);

    return { message: 'Premium activated', expiresAt };
  },

  async createBoostOrder(userId: string) {
    const order = await razorpayRequest('/orders', {
      amount: 4900,
      currency: 'INR',
      receipt: `boost_${userId}_${Date.now()}`,
    }) as { id: string };
    return { orderId: order.id, amount: 4900, currency: 'INR', keyId: RAZORPAY_KEY_ID };
  },

  async activateBoost(userId: string, orderId: string, paymentId: string, signature: string) {
    if (!verifySignature(orderId, paymentId, signature)) throw new Error('INVALID_SIGNATURE');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.profileBoost.create({ data: { userId, expiresAt, razorpayOrderId: orderId } });
    return { message: 'Boost activated', expiresAt };
  },

  // IAP: Ship a Friend — ₹19 per ship. Order creation opens an IapPurchase
  // row so the eventual /ships POST has something concrete to redeem against
  // — without it, "payment verified" and "ship created" were two unrelated
  // facts and nothing stopped calling the create-ship endpoint for free.
  async createShipOrder(userId: string) {
    const order = await razorpayRequest('/orders', {
      amount: 1900,
      currency: 'INR',
      receipt: `ship_${userId}_${Date.now()}`,
    }) as { id: string };
    await prisma.iapPurchase.create({
      data: { userId, item: 'SHIP', razorpayOrderId: order.id },
    });
    return { orderId: order.id, amount: 1900, currency: 'INR', item: 'ship', keyId: RAZORPAY_KEY_ID };
  },

  // Verifies the Razorpay signature and marks the purchase verified. Does
  // NOT grant the ship itself — ShipService.createShip consumes it, so one
  // paid order can only ever redeem exactly one ship.
  async verifyShipOrder(userId: string, orderId: string, paymentId: string, signature: string) {
    if (!verifySignature(orderId, paymentId, signature)) throw new Error('INVALID_SIGNATURE');
    const purchase = await prisma.iapPurchase.findUnique({ where: { razorpayOrderId: orderId } });
    if (!purchase || purchase.userId !== userId || purchase.item !== 'SHIP') {
      throw new Error('PURCHASE_NOT_FOUND');
    }
    await prisma.iapPurchase.update({
      where: { razorpayOrderId: orderId },
      data: { razorpayPaymentId: paymentId, verifiedAt: new Date() },
    });
    return { verified: true };
  },

  // IAP: Sticker Pack — ₹29 basic / ₹49 premium
  async createStickerOrder(userId: string, packId: string) {
    const prices: Record<string, number> = { basic: 2900, premium: 4900 };
    const amount = prices[packId] ?? 2900;
    const item = packId === 'premium' ? 'STICKER_PREMIUM' : 'STICKER_BASIC';
    const order = await razorpayRequest('/orders', {
      amount,
      currency: 'INR',
      receipt: `sticker_${userId}_${packId}_${Date.now()}`,
    }) as { id: string };
    await prisma.iapPurchase.create({ data: { userId, item, razorpayOrderId: order.id } });
    return { orderId: order.id, amount, currency: 'INR', item: 'sticker', packId, keyId: RAZORPAY_KEY_ID };
  },

  // IAP: Rizz Pack (curated openers) — ₹39
  async createRizzPackOrder(userId: string) {
    const order = await razorpayRequest('/orders', {
      amount: 3900,
      currency: 'INR',
      receipt: `rizzpack_${userId}_${Date.now()}`,
    }) as { id: string };
    await prisma.iapPurchase.create({
      data: { userId, item: 'RIZZ_PACK', razorpayOrderId: order.id },
    });
    return { orderId: order.id, amount: 3900, currency: 'INR', item: 'rizz_pack', keyId: RAZORPAY_KEY_ID };
  },

  // IAP: See Who Shipped You — ₹9
  async createViewShipsOrder(userId: string) {
    const order = await razorpayRequest('/orders', {
      amount: 900,
      currency: 'INR',
      receipt: `viewships_${userId}_${Date.now()}`,
    }) as { id: string };
    await prisma.iapPurchase.create({
      data: { userId, item: 'VIEW_SHIPS', razorpayOrderId: order.id },
    });
    return { orderId: order.id, amount: 900, currency: 'INR', item: 'view_ships', keyId: RAZORPAY_KEY_ID };
  },

  // Generic IAP verify — for Sticker/RizzPack/ViewShips, which (unlike Ship)
  // have no separate "redeem" action anywhere in the app yet. Verifying is
  // the only gate that will ever exist for them until that consuming
  // feature is built, so grant (consumedAt) immediately on verification
  // rather than leaving the purchase in permanent limbo.
  async verifyIap(userId: string, orderId: string, paymentId: string, signature: string) {
    if (!verifySignature(orderId, paymentId, signature)) throw new Error('INVALID_SIGNATURE');
    const purchase = await prisma.iapPurchase.findUnique({ where: { razorpayOrderId: orderId } });
    if (!purchase || purchase.userId !== userId) throw new Error('PURCHASE_NOT_FOUND');
    if (purchase.item === 'SHIP') throw new Error('USE_SHIP_VERIFY_ENDPOINT');

    const now = new Date();
    await prisma.iapPurchase.update({
      where: { razorpayOrderId: orderId },
      data: { razorpayPaymentId: paymentId, verifiedAt: now, consumedAt: now },
    });
    return { verified: true, paymentId, item: purchase.item };
  },
};
