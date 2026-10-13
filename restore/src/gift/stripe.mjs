// Stripe Checkout for website voucher purchases. Plain HTTPS calls (no SDK). Test keys and live keys behave the same.
import crypto from 'node:crypto';

const KEY = () => process.env.STRIPE_SECRET_KEY || '';
const BASE = () => (process.env.STRIPE_API_BASE || 'https://api.stripe.com').replace(/\/+$/, '');
export const enabled = () => Boolean(KEY());
export const livemode = () => KEY().startsWith('sk_live_');

// Stripe's API takes form-encoded bodies with bracket notation for nested fields
const encode = (obj, prefix = '') => Object.entries(obj).flatMap(([k, v]) => {
  const key = prefix ? `${prefix}[${k}]` : k;
  if (v == null) return [];
  if (Array.isArray(v)) return v.flatMap((x, i) => (typeof x === 'object' ? encode(x, `${key}[${i}]`) : [`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(x)}`]));
  if (typeof v === 'object') return encode(v, key);
  return [`${encodeURIComponent(key)}=${encodeURIComponent(v)}`];
}).join('&');

async function call(method, path, body) {
  const res = await fetch(BASE() + path, { method, headers: { Authorization: `Bearer ${KEY()}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Stripe-Version': '2024-06-20' }, body: body ? encode(body) : undefined, signal: AbortSignal.timeout(30e3) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Stripe: ${j.error?.message || res.status}`);
  return j;
}

// A hosted Checkout page for one order. Returns { id, url }.
export function createCheckoutSession({ order, lines, successUrl, cancelUrl }) {
  return call('POST', '/v1/checkout/sessions', {
    mode: 'payment',
    client_reference_id: order.order_id,
    customer_email: order.buyer_email || undefined,
    line_items: lines.map((l) => ({ quantity: l.qty || 1, price_data: { currency: 'sgd', unit_amount: Math.round(l.price * 100), product_data: { name: l.title, description: l.recipient_name ? `Gift for ${l.recipient_name}` : undefined } } })),
    metadata: { order_id: order.order_id, order_no: order.order_no },
    payment_intent_data: { description: `Elements Wellness gift voucher order ${order.order_no}`, metadata: { order_id: order.order_id, order_no: order.order_no } },
    success_url: successUrl, cancel_url: cancelUrl,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });
}
export const getSession = (id) => call('GET', `/v1/checkout/sessions/${encodeURIComponent(id)}`);

// Webhook signature check (Stripe-Signature: t=…,v1=…). Returns the parsed event or throws.
export function verifyWebhook(rawBody, sigHeader, secret = process.env.STRIPE_WEBHOOK_SECRET || '') {
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  const parts = Object.fromEntries(String(sigHeader || '').split(',').map((p) => p.split('=')));
  const t = parts.t, sigs = String(sigHeader || '').split(',').filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
  if (!t || !sigs.length) throw new Error('Missing Stripe signature');
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) throw new Error('Stripe signature too old');
  const expected = crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
  if (!sigs.some((s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)))) throw new Error('Stripe signature mismatch');
  return JSON.parse(rawBody);
}
