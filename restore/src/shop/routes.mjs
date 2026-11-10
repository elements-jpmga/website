// Product shop: public endpoints used by elements.com.sg (catalogue, Stripe checkout, order status) and the staff order list. Mounted by server.mjs.
import { PRODUCTS, OUTLETS, NOTE, bySku, brandName } from './catalog.mjs';
import { Orders, Events, STATUSES } from './db.mjs';
import { Settings } from '../gift/db.mjs';
import * as stripe from '../gift/stripe.mjs';
import { sendMail, brandEmail } from '../mail.mjs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (n) => 'S$' + Number(n).toLocaleString('en-SG', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const clean = (v, max) => String(v ?? '').trim().slice(0, max);
const outletOf = (id) => OUTLETS.find((o) => o.id === id) || null;

// Home delivery is only offered once Elements sets a fee (SHOP_DELIVERY_FEE, SGD); SHOP_DELIVERY_FREE_FROM waives it above that subtotal.
export const delivery = () => {
  const fee = Number(process.env.SHOP_DELIVERY_FEE); if (!Number.isFinite(fee) || fee < 0) return null;
  const free_from = Number(process.env.SHOP_DELIVERY_FREE_FROM); return { fee, free_from: Number.isFinite(free_from) && free_from > 0 ? free_from : null };
};
const deliveryFee = (subtotal) => { const d = delivery(); if (!d) return 0; return d.free_from && subtotal >= d.free_from ? 0 : d.fee; };

const publicOrder = (o) => ({ order_no: o.order_no, status: o.status, buyer_name: o.buyer_name, buyer_email: o.buyer_email, fulfilment: o.fulfilment, outlet: outletOf(o.outlet), address: o.address, lines: o.lines, subtotal: o.subtotal, delivery_fee: o.delivery_fee, total: o.total, paid_at: o.paid_at });

/* ---- emails ---- */
const linesHtml = (o) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0">${o.lines.map((l) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eee5dc">${esc(l.title)}<div style="font-size:12.5px;color:#8b8175">${esc(l.brand)}${l.size ? ' · ' + esc(l.size) : ''}${l.qty > 1 ? ' · × ' + l.qty : ''}</div></td><td align="right" style="padding:8px 0;border-bottom:1px solid #eee5dc;white-space:nowrap">${money(l.price * l.qty)}</td></tr>`).join('')}
${o.delivery_fee ? `<tr><td style="padding:8px 0;color:#8b8175">Delivery</td><td align="right" style="padding:8px 0">${money(o.delivery_fee)}</td></tr>` : ''}
<tr><td style="padding:10px 0 0;font-weight:700">Total paid</td><td align="right" style="padding:10px 0 0;font-weight:700">${money(o.total)}</td></tr></table>`;
const whereHtml = (o) => {
  if (o.fulfilment === 'delivery' && o.address) return `<p style="margin:0 0 12px"><b>Delivery to</b><br>${esc(o.address.line1)}${o.address.line2 ? '<br>' + esc(o.address.line2) : ''}<br>Singapore ${esc(o.address.postal)}</p>`;
  const out = outletOf(o.outlet); return out ? `<p style="margin:0 0 12px"><b>Collect at ${esc(out.name)}</b><br>${esc(out.address)}<br>Tel ${esc(out.phone)}</p>` : '';
};
async function emailBuyer(o) {
  if (!o.buyer_email) return null;
  const body = `<p style="margin:0 0 12px">Order <b>${esc(o.order_no)}</b></p>${linesHtml(o)}${whereHtml(o)}`;
  return sendMail({ to: o.buyer_email, subject: `Your Elements Wellness order ${o.order_no}`, html: brandEmail({ title: 'Thank you for your order', eyebrow: 'Order confirmation', body, footnote: 'This is your receipt. Please bring it (on your phone is fine) when collecting at the outlet.' }),
    text: `Order ${o.order_no}\n\n${o.lines.map((l) => `${l.title} (${l.size}) × ${l.qty} — ${money(l.price * l.qty)}`).join('\n')}\n${o.delivery_fee ? `Delivery ${money(o.delivery_fee)}\n` : ''}Total paid ${money(o.total)}\n\n${o.fulfilment === 'delivery' ? `Delivery to ${[o.address?.line1, o.address?.line2, 'Singapore ' + o.address?.postal].filter(Boolean).join(', ')}` : `Collect at ${outletOf(o.outlet)?.name || 'the outlet'}: ${outletOf(o.outlet)?.address || ''}`}` });
}
async function emailStaff(o) {
  const to = (await Settings.get('notify_emails')) || []; if (!to.length) return null;
  const body = `<p style="margin:0 0 12px"><b>${esc(o.buyer_name || 'A customer')}</b>${o.buyer_email ? ` (${esc(o.buyer_email)})` : ''}${o.buyer_phone ? ` · ${esc(o.buyer_phone)}` : ''} paid ${money(o.total)} for ${o.lines.reduce((n, l) => n + l.qty, 0)} item(s).</p>${linesHtml(o)}${whereHtml(o)}${o.customer_note ? `<p style="margin:0 0 12px"><b>Customer note</b><br>${esc(o.customer_note)}</p>` : ''}<p style="margin:0;font-size:13px;color:#6c635b">Open the staff app → Shop orders → ${esc(o.order_no)} to mark it ready and completed.</p>`;
  return sendMail({ to, subject: `Product order ${o.order_no}: ${o.fulfilment === 'delivery' ? 'delivery' : 'collect at ' + (outletOf(o.outlet)?.name || '')} (${money(o.total)})`, html: brandEmail({ title: 'New product order', eyebrow: 'Staff notification', body, footnote: 'Sent to the Elements team by the Elements staff app.' }), text: `${o.buyer_name || 'A customer'} ordered ${o.lines.map((l) => `${l.title} × ${l.qty}`).join('; ')}. Order ${o.order_no}, ${money(o.total)}.`, replyTo: undefined });
}

// Marks a shop order paid exactly once and sends the two emails. Called by the Stripe webhook and by the thank-you page.
export async function settle(order, paymentIntent) {
  const fresh = await Orders.get(order.order_id); if (fresh.status !== 'pending') return fresh;
  await Orders.markPaid(order.order_id, { payment_intent: paymentIntent || null });
  const paid = await Orders.get(order.order_id); if (paid.status !== 'paid') return paid; // another request settled it first
  await Events.add({ order_id: order.order_id, type: 'paid', detail: { provider: 'stripe', payment_intent: paymentIntent || null } });
  await Promise.all([emailBuyer(paid).catch((e) => console.error('buyer email failed:', e.message)), emailStaff(paid).catch((e) => console.error('staff email failed:', e.message))]);
  return paid;
}
// The gift webhook hands over sessions it does not recognise
export async function onStripeSession(s, type) {
  const order = await Orders.bySession(s.id); if (!order) return false;
  if (type === 'expired') { if (order.status === 'pending') await Orders.setStatus(order.order_id, 'cancelled'); }
  else if (s.payment_status === 'paid') await settle(order, s.payment_intent);
  return true;
}

export function registerShopRoutes({ route, send, err, json, staff, allowedOrigins = [] }) {
  const siteUrl = (process.env.PUBLIC_SITE_URL || 'https://elements.com.sg').replace(/\/+$/, '');

  /* ---- public ---- */
  route('GET', '/api/shop/public/catalog', async (req, res) => send(res, 200, { products: PRODUCTS.map((p) => ({ sku: p.sku, brand: brandName(p.brand), name: p.name, size: p.size, price: p.price, img: p.img[0] })), outlets: OUTLETS, delivery: delivery(), payments: stripe.enabled(), note: NOTE }), { open: true });

  route('POST', '/api/shop/public/checkout', async (req, res) => {
    if (!stripe.enabled()) return err(res, 503, 'Online payment is not switched on yet. Please call or WhatsApp an outlet to order.');
    const b = await json(req);
    // Lines: only skus from the catalogue, priced from the catalogue, 1–10 of each
    const lines = []; for (const l of Array.isArray(b.lines) ? b.lines.slice(0, 40) : []) {
      const p = bySku(String(l.sku || '')); const qty = Math.min(10, Math.max(1, parseInt(l.qty, 10) || 1)); if (!p) continue;
      const seen = lines.find((x) => x.sku === p.sku); if (seen) seen.qty = Math.min(10, seen.qty + qty); else lines.push({ sku: p.sku, title: p.name, brand: brandName(p.brand), size: p.size, price: p.price, qty, img: p.img[0] });
    }
    if (!lines.length) return err(res, 400, 'Your cart is empty');
    const buyer_name = clean(b.buyer_name, 80), buyer_email = clean(b.buyer_email, 120).toLowerCase(), buyer_phone = clean(b.buyer_phone, 30);
    if (!buyer_name || !EMAIL_RE.test(buyer_email)) return err(res, 422, 'Please enter your name and a valid email address');
    if (!buyer_phone) return err(res, 422, 'Please enter a phone number we can reach you on');
    const fulfilment = b.fulfilment === 'delivery' ? 'delivery' : 'collect';
    let outlet = null, address = null;
    if (fulfilment === 'collect') { outlet = outletOf(String(b.outlet || '')); if (!outlet) return err(res, 422, 'Please choose the outlet to collect from'); outlet = outlet.id; }
    else {
      if (!delivery()) return err(res, 422, 'Delivery is not available yet — please choose an outlet to collect from');
      address = { line1: clean(b.address?.line1, 120), line2: clean(b.address?.line2, 120), postal: clean(b.address?.postal, 6).replace(/\D/g, '') };
      if (!address.line1 || !/^\d{6}$/.test(address.postal)) return err(res, 422, 'Please enter your address and a 6-digit Singapore postal code');
    }
    const subtotal = +lines.reduce((n, l) => n + l.price * l.qty, 0).toFixed(2);
    const delivery_fee = fulfilment === 'delivery' ? deliveryFee(subtotal) : 0;
    const total = +(subtotal + delivery_fee).toFixed(2);
    const return_base = allowedOrigins.includes(b.return_base) ? b.return_base : siteUrl; // never redirect to an unknown site
    const order = await Orders.create({ buyer_name, buyer_email, buyer_phone, fulfilment, outlet, address, lines, subtotal, delivery_fee, total, return_base, customer_note: clean(b.note, 300) || null });
    try {
      const stripeLines = lines.map((l) => ({ title: l.title, description: [l.brand, l.size].filter(Boolean).join(' · '), price: l.price, qty: l.qty }));
      if (delivery_fee) stripeLines.push({ title: 'Delivery', price: delivery_fee, qty: 1 });
      const session = await stripe.createCheckoutSession({ order, lines: stripeLines, kind: 'shop', description: `Elements Wellness order ${order.order_no}`, successUrl: `${return_base}/checkout/thank-you/?session_id={CHECKOUT_SESSION_ID}`, cancelUrl: `${return_base}/checkout/?cancelled=1` });
      await Orders.setSession(order.order_id, session.id);
      await Events.add({ order_id: order.order_id, type: 'order_created', detail: { total, items: lines.length, fulfilment, outlet } });
      send(res, 200, { url: session.url, order_no: order.order_no });
    } catch (e) { await Orders.setStatus(order.order_id, 'failed'); console.error('shop checkout failed:', e.message); err(res, 502, 'We could not start the payment. Please try again in a moment.'); }
  }, { open: true });

  // Thank-you page: order status. If the webhook has not arrived yet, confirm with Stripe directly.
  route('GET', '/api/shop/public/order', async (req, res, { url }) => {
    const sid = url.searchParams.get('session_id') || ''; if (sid.length < 10) return err(res, 400, 'Missing session');
    let order = await Orders.bySession(sid); if (!order) return err(res, 404, 'Order not found');
    if (order.status === 'pending' && stripe.enabled()) { try { const s = await stripe.getSession(sid); if (s.payment_status === 'paid') await settle(order, s.payment_intent); else if (s.status === 'expired') await Orders.setStatus(order.order_id, 'cancelled'); } catch (e) { console.error('session check failed:', e.message); } order = await Orders.get(order.order_id); }
    send(res, 200, publicOrder(order));
  }, { open: true });

  /* ---- staff ---- */
  route('GET', '/api/shop/summary', async (req, res) => send(res, 200, { ...(await Orders.summary()), outlets: OUTLETS, delivery: delivery(), stripe: stripe.enabled() ? (stripe.livemode() ? 'live' : 'test') : null }));
  route('GET', '/api/shop/orders', async (req, res, { url }) => send(res, 200, (await Orders.list({ q: url.searchParams.get('q') || '', status: url.searchParams.get('status') || '', outlet: url.searchParams.get('outlet') || '', limit: Math.min(500, +url.searchParams.get('limit') || 200) })).map((o) => ({ ...o, outlet_name: outletOf(o.outlet)?.name || null }))));
  route('GET', '/api/shop/orders/:id', async (req, res, { params }) => { const o = await Orders.get(params.id); if (!o) return err(res, 404, 'Order not found'); send(res, 200, { ...o, outlet_name: outletOf(o.outlet)?.name || null, events: await Events.forOrder(o.order_id), statuses: STATUSES }); });
  route('POST', '/api/shop/orders/:id/status', async (req, res, { params }) => {
    const o = await Orders.get(params.id); if (!o) return err(res, 404, 'Order not found');
    const b = await json(req); const next = String(b.status || '');
    const allowed = { paid: ['ready', 'completed', 'cancelled', 'refunded'], ready: ['completed', 'paid', 'cancelled', 'refunded'], completed: ['refunded'], pending: ['cancelled'] }[o.status] || [];
    if (!allowed.includes(next)) return err(res, 422, `An order that is ${o.status} cannot be marked ${next}`);
    await Orders.setStatus(o.order_id, next, staff(req)); await Events.add({ order_id: o.order_id, type: next, staff: staff(req), detail: b.note ? { note: clean(b.note, 300) } : null });
    send(res, 200, await Orders.get(o.order_id));
  });
  route('POST', '/api/shop/orders/:id/note', async (req, res, { params }) => { const o = await Orders.get(params.id); if (!o) return err(res, 404, 'Order not found'); const b = await json(req); await Orders.setStaffNote(o.order_id, clean(b.note, 600), staff(req)); send(res, 200, await Orders.get(o.order_id)); });
  route('GET', '/api/shop/export.csv', async (req, res) => {
    const rows = await Orders.list({ limit: 5000 }); const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = ['Order,Date,Status,Buyer,Email,Phone,Fulfilment,Outlet,Items,Subtotal,Delivery,Total'].concat(rows.map((o) => [o.order_no, o.created_at, o.status, o.buyer_name, o.buyer_email, o.buyer_phone, o.fulfilment, outletOf(o.outlet)?.name || '', o.lines.map((l) => `${l.title} x${l.qty}`).join('; '), o.subtotal, o.delivery_fee, o.total].map(cell).join(','))).join('\n');
    res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="elements-product-orders.csv"' }); res.end(csv);
  });
}
