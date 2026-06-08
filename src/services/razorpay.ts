/**
 * Razorpay service — order creation and payment verification.
 * Uses native Node 20 fetch + crypto; no extra package needed.
 */
import crypto from 'crypto';
import { env } from '../config/env';

const RAZORPAY_API = 'https://api.razorpay.com/v1';

function authHeader(): string {
  return 'Basic ' + Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

/**
 * Create a Razorpay order.
 * @param amountPaise  Amount in paise (₹ × 100)
 * @param receipt      Unique receipt string (e.g. user ID + timestamp)
 */
export async function createOrder(amountPaise: number, receipt: string): Promise<RazorpayOrder> {
  const resp = await fetch(`${RAZORPAY_API}/orders`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({})) as { error?: { description?: string } };
    throw new Error(err.error?.description || `Razorpay error ${resp.status}`);
  }
  return resp.json() as Promise<RazorpayOrder>;
}

/**
 * Verify Razorpay payment signature (HMAC SHA256).
 * The signature is over "orderId|paymentId" using the key secret.
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
