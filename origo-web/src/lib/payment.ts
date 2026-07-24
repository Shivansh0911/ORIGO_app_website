// PSEUDO: Razorpay checkout integration.
// To activate real payments:
//   1. Add VITE_RAZORPAY_KEY_ID to origo-web/.env (get it from dashboard.razorpay.com → Settings → API Keys)
//   2. Set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET in the backend env
//   3. The <script src="https://checkout.razorpay.com/v1/checkout.js"> is already in index.html
// When VITE_RAZORPAY_KEY_ID is set (and backend returns a real orderId), this switches to real mode automatically.

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open(): void };
  }
}

export interface PaymentResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export async function openPayment(opts: {
  orderId: string;
  amount: number;
  keyId: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string };
}): Promise<PaymentResult> {
  const isPseudo = !opts.keyId || opts.orderId.startsWith('mock_');

  if (isPseudo) {
    // PSEUDO: Simulates a ₹X payment that always succeeds.
    // Remove this block once real Razorpay keys are in env.
    await new Promise((r) => setTimeout(r, 1500));
    return {
      razorpay_order_id: opts.orderId,
      razorpay_payment_id: `mock_pay_${Date.now()}`,
      razorpay_signature: 'mock_sig',
    };
  }

  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error('Razorpay SDK not loaded'));
      return;
    }
    const rzp = new window.Razorpay({
      key: opts.keyId,
      order_id: opts.orderId,
      amount: opts.amount,
      currency: 'INR',
      name: opts.name,
      description: opts.description,
      prefill: opts.prefill ?? {},
      handler: (result: PaymentResult) => resolve(result),
      modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
    });
    rzp.open();
  });
}
