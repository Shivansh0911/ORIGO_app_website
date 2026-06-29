import crypto from 'crypto';
import { prisma } from '../utils/prisma';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID ?? '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? '';

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

async function razorpayRequest(path: string, body: Record<string, unknown>) {
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

    return { orderId: order.id, amount, plan, keyId: RAZORPAY_KEY_ID };
  },

  async verifyAndActivate(userId: string, plan: string, paymentData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
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
    return { orderId: order.id, amount: 4900, keyId: RAZORPAY_KEY_ID };
  },

  async activateBoost(userId: string, orderId: string, paymentId: string, signature: string) {
    if (!verifySignature(orderId, paymentId, signature)) throw new Error('INVALID_SIGNATURE');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.profileBoost.create({ data: { userId, expiresAt, razorpayOrderId: orderId } });
    return { message: 'Boost activated', expiresAt };
  },
};
