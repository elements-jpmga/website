// Issuing, delivering and reminding: the e-voucher PDF, the emails, and the scheduler tick.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { Items, Codes, Alerts, Designs, Orders, Vouchers, Events, Settings, effectiveStatus } from './db.mjs';
import * as files from '../files.mjs';
import { sendMail, brandEmail, provider as mailProvider } from '../mail.mjs';
import { htmlToPdf } from '../report.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const b64 = (f) => { const p = path.join(here, '../../public', f); return fs.existsSync(p) ? fs.readFileSync(p).toString('base64') : ''; };
const money = (n) => 'S$' + Number(n).toLocaleString('en-SG', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const day = (iso) => new Date(iso).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });
export const PUBLIC_URL = () => (process.env.PUBLIC_SITE_URL || 'https://elements.com.sg').replace(/\/+$/, '');
export const OUTLETS = ['ION Orchard', 'The Centrepoint', '313@somerset'];

/* ---------------- The e-voucher (A5 landscape PDF) ---------------- */
export async function voucherHtml(v, { terms } = {}) {
  const design = v.design_id ? await Designs.get(v.design_id) : null;
  let art = ''; if (design) { const buf = await files.get(design.image_path); if (buf) art = `data:image/${design.image_path.endsWith('.jpg') || design.image_path.endsWith('.jpeg') ? 'jpeg' : 'png'};base64,${buf.toString('base64')}`; }
  const qr = await QRCode.toString(v.code, { type: 'svg', margin: 0, width: 160, color: { dark: '#2d2a27', light: '#ffffff00' } });
  const worth = v.value_initial != null ? money(v.value_initial) : v.title;
  const t = terms ?? (await Settings.get('terms'));
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: 'Noto Serif'; src: url(data:font/ttf;base64,${b64('fonts/NotoSerif.ttf')}); }
@page { size: 210mm 148mm; margin: 0; }
* { box-sizing: border-box; } html, body { margin: 0; }
body { width: 210mm; height: 148mm; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #2d2a27; background: #fff; }
.art { height: 62mm; background: #72181b center/cover no-repeat; position: relative; }
.art .ribbon { position: absolute; left: 0; right: 0; bottom: 0; background: rgba(45,42,39,.72); color: #fff; padding: 4mm 10mm; display: flex; justify-content: space-between; align-items: baseline; }
.art .ribbon b { font-family: 'Noto Serif', Georgia, serif; font-weight: 400; font-size: 15pt; letter-spacing: .02em; }
.art .ribbon span { font-size: 8pt; letter-spacing: .3em; text-transform: uppercase; }
.body { display: grid; grid-template-columns: 1fr 46mm; gap: 8mm; padding: 7mm 10mm 0; }
.eyebrow { font-size: 7pt; letter-spacing: .22em; text-transform: uppercase; color: #8b8175; font-weight: 700; }
.worth { font-family: 'Noto Serif', Georgia, serif; font-size: 22pt; color: #72181b; margin: 1.5mm 0 3mm; line-height: 1.15; }
.to { font-size: 10.5pt; line-height: 1.45; }
.msg { font-family: 'Noto Serif', Georgia, serif; font-style: italic; font-size: 10pt; color: #4a4039; margin-top: 3mm; line-height: 1.45; max-height: 22mm; overflow: hidden; }
.code { margin-top: 4mm; display: inline-block; border: 1px solid #cfc6bc; border-radius: 2mm; padding: 2.5mm 4mm; font-family: Menlo, Consolas, monospace; font-size: 11pt; letter-spacing: .06em; background: #fbf8f4; }
.side { text-align: center; } .side svg { width: 34mm; height: 34mm; } .side small { display: block; font-size: 7pt; color: #8b8175; margin-top: 1.5mm; line-height: 1.4; }
.foot { position: absolute; left: 10mm; right: 10mm; bottom: 6mm; display: flex; justify-content: space-between; gap: 8mm; font-size: 6.6pt; color: #6c635b; line-height: 1.4; border-top: 1px solid #e8e1d9; padding-top: 2.5mm; }
.foot .terms { white-space: pre-line; max-width: 128mm; }
.foot .meta b { display: block; color: #2d2a27; font-size: 7.2pt; }
</style></head><body>
<div class="art" style="${art ? `background-image:url(${art})` : ''}"><div class="ribbon"><b>Elements Wellness · Gift Voucher</b><span>A gift for you</span></div></div>
<div class="body">
  <div>
    <div class="eyebrow">${v.value_initial != null ? 'Voucher value' : 'Treatment'}</div>
    <div class="worth">${esc(worth)}</div>
    <div class="to">${v.recipient_name ? `For <b>${esc(v.recipient_name)}</b>` : ''}${v.from_name ? `${v.recipient_name ? ' · ' : ''}From <b>${esc(v.from_name)}</b>` : ''}</div>
    ${v.message ? `<div class="msg">“${esc(v.message)}”</div>` : ''}
    <div class="code">${esc(v.code)}</div>
  </div>
  <div class="side">${qr}<small>Show this code at any Elements Wellness outlet<br>Valid until <b>${day(v.expires_at)}</b></small></div>
</div>
<div class="foot"><div class="terms">${esc(t || '')}</div><div class="meta"><b>${esc(v.order_no || '')}</b>Issued ${day(v.valid_from)}<br>elements.com.sg</div></div>
</body></html>`;
}

// PDF bytes for a staff download / preview (does not send anything)
export async function pdfFor(voucher_id) {
  const v = await Vouchers.get(voucher_id); if (!v) throw new Error('Voucher not found');
  return htmlToPdf(await voucherHtml(v));
}

/* ---------------- Emails ---------------- */
const outletsHtml = `<p style="margin:14px 0 0;font-size:13px;color:#6c635b">ION Orchard · The Centrepoint · 313@somerset &nbsp;—&nbsp; call or WhatsApp your preferred outlet to book, and show the voucher on the day.</p>`;
export async function emailRecipient(v, pdf, { resend = false } = {}) {
  if (!v.recipient_email) throw new Error('This voucher has no recipient email');
  const subject = `${v.from_name ? v.from_name + ' has sent you' : 'You have received'} an Elements Wellness gift voucher`;
  const body = `<p style="margin:0 0 14px">Dear ${esc(v.recipient_name || 'there')},</p><p style="margin:0 0 14px">${v.from_name ? `<b>${esc(v.from_name)}</b> has sent you` : 'You have received'} a gift voucher for <b>${esc(v.value_initial != null ? money(v.value_initial) + ' at Elements Wellness' : v.title)}</b>.</p>${v.message ? `<p style="margin:0 0 14px;font-family:Georgia,serif;font-style:italic;color:#4a4039">“${esc(v.message)}”</p>` : ''}<p style="margin:0 0 6px">Your voucher code:</p><p style="margin:0 0 14px;font-family:Menlo,Consolas,monospace;font-size:17px;letter-spacing:.05em;background:#fbf8f4;border:1px solid #e8e1d9;padding:12px 16px;display:inline-block">${esc(v.code)}</p><p style="margin:0">Your voucher is attached as a PDF and is valid until <b>${day(v.expires_at)}</b>.</p>${outletsHtml}`;
  const html = brandEmail({ title: 'A gift for you', eyebrow: resend ? 'Your gift voucher (resent)' : 'Your gift voucher', body, footnote: 'Please keep this email: the code inside is your voucher. Terms are printed on the PDF.' });
  const text = `Dear ${v.recipient_name || 'there'},\n\n${v.from_name ? v.from_name + ' has sent you' : 'You have received'} a gift voucher for ${v.value_initial != null ? money(v.value_initial) + ' at Elements Wellness' : v.title}.\n${v.message ? '\n“' + v.message + '”\n' : ''}\nVoucher code: ${v.code}\nValid until ${day(v.expires_at)}. Your voucher is attached as a PDF.\n\nION Orchard · The Centrepoint · 313@somerset — call or WhatsApp your preferred outlet to book.`;
  return sendMail({ to: v.recipient_email, subject, html, text, attachments: [{ filename: `Elements-Gift-Voucher-${v.code.split(' ')[0]}.pdf`, content: pdf, contentType: 'application/pdf' }] });
}

export async function emailBuyer(order, vouchers) {
  if (!order.buyer_email) return null;
  const rows = vouchers.map((v) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${esc(v.title)}${v.recipient_name ? `<br><span style="color:#6c635b;font-size:13px">for ${esc(v.recipient_name)}${v.recipient_email ? ' · ' + esc(v.recipient_email) : ''}${v.status === 'scheduled' && v.send_at ? ' · sends ' + day(v.send_at) : ''}</span>` : ''}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-family:Menlo,Consolas,monospace;font-size:13px">${esc(v.code)}</td></tr>`).join('');
  const body = `<p style="margin:0 0 14px">Dear ${esc(order.buyer_name || 'there')},</p><p style="margin:0 0 14px">Thank you for your gift voucher order <b>${esc(order.order_no)}</b>.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px">${rows}<tr><td style="padding:10px 0;font-weight:700">Total paid</td><td style="padding:10px 0;text-align:right;font-weight:700">${money(order.total)}</td></tr></table><p style="margin:14px 0 0">${vouchers.some((v) => v.recipient_email && v.recipient_email !== order.buyer_email) ? 'The voucher has been emailed to the recipient' + (vouchers.some((v) => v.status === 'scheduled') ? ' on the date you chose' : '') + '. ' : ''}Keep this email as your receipt.</p>${outletsHtml}`;
  return sendMail({ to: order.buyer_email, subject: `Your Elements Wellness gift voucher order ${order.order_no}`, html: brandEmail({ title: 'Thank you for your order', eyebrow: 'Order confirmation', body, footnote: 'This is your receipt. Vouchers are valid for 12 months from the issue date; terms are printed on each voucher.' }), text: `Thank you for your gift voucher order ${order.order_no}.\n\n${vouchers.map((v) => `${v.title} — ${v.code}${v.recipient_name ? ' (for ' + v.recipient_name + ')' : ''}`).join('\n')}\n\nTotal paid: ${money(order.total)}` });
}

export async function notifyElements(order, vouchers) {
  const to = (await Settings.get('notify_emails')) || []; if (!to.length) return null;
  const list = vouchers.map((v) => `<li>${esc(v.title)} — <code>${esc(v.code)}</code>${v.recipient_name ? ` · for ${esc(v.recipient_name)}` : ''}${v.status === 'scheduled' ? ` · scheduled ${day(v.send_at)}` : ''}</li>`).join('');
  const body = `<p style="margin:0 0 12px"><b>${esc(order.buyer_name || 'A customer')}</b>${order.buyer_email ? ` (${esc(order.buyer_email)})` : ''} bought ${vouchers.length} voucher${vouchers.length === 1 ? '' : 's'} via ${esc(order.source)} — order <b>${esc(order.order_no)}</b>, ${money(order.total)}.</p><ul style="margin:0 0 12px;padding-left:18px">${list}</ul><p style="margin:0;font-size:13px;color:#6c635b">Open the staff app → Vouchers → Orders to see the details.</p>`;
  return sendMail({ to, subject: `Gift voucher sold: ${vouchers.map((v) => v.title).join(', ')} (${order.order_no})`, html: brandEmail({ title: 'New gift voucher order', eyebrow: 'Staff notification', body, footnote: 'Sent to the Elements team by the Elements staff app.' }), text: `${order.buyer_name || 'A customer'} bought ${vouchers.length} voucher(s): ${vouchers.map((v) => v.title + ' ' + v.code).join('; ')}. Order ${order.order_no}, ${money(order.total)}.`, replyTo: undefined });
}

export async function emailLowStock(alert) {
  const to = (await Settings.get('notify_emails')) || []; if (!to.length) return null;
  const body = alert.level === 'out'
    ? `<p style="margin:0 0 12px"><b>${esc(alert.name)}</b> has <b>no voucher codes left</b>. Customers cannot buy this item until new WESS codes are imported.</p>`
    : `<p style="margin:0 0 12px"><b>${esc(alert.name)}</b> is down to <b>${alert.remaining}</b> voucher code${alert.remaining === 1 ? '' : 's'} (alert level ${alert.threshold ?? 10}).</p>`;
  return sendMail({ to, subject: `${alert.level === 'out' ? 'OUT OF CODES' : 'Low voucher codes'}: ${alert.name}`, html: brandEmail({ title: alert.level === 'out' ? 'Voucher codes finished' : 'Voucher codes running low', eyebrow: 'Staff alert', body: body + `<p style="margin:0;font-size:13px;color:#6c635b">Generate the next running numbers in WESS, then open the staff app → Vouchers → Codes → ${esc(alert.name)} → Import codes.</p>`, footnote: 'Sent to the Elements team by the Elements staff app.' }), text: `${alert.name}: ${alert.level === 'out' ? 'no voucher codes left' : alert.remaining + ' codes left'}. Import new WESS codes in the staff app (Vouchers → Codes).`, replyTo: undefined });
}

export async function emailReminder(v) {
  if (!v.recipient_email) return null;
  const body = `<p style="margin:0 0 14px">Dear ${esc(v.recipient_name || 'there')},</p><p style="margin:0 0 14px">A friendly reminder that your Elements Wellness gift voucher <b>${esc(v.title)}</b> (code <code>${esc(v.code)}</code>) expires on <b>${day(v.expires_at)}</b>.</p><p style="margin:0">Call or WhatsApp your preferred outlet to book before then — we look forward to seeing you.</p>${outletsHtml}`;
  return sendMail({ to: v.recipient_email, subject: `Your Elements Wellness voucher expires on ${day(v.expires_at)}`, html: brandEmail({ title: 'Your voucher is expiring soon', eyebrow: 'Gift voucher reminder', body }), text: `Your Elements Wellness gift voucher ${v.title} (code ${v.code}) expires on ${day(v.expires_at)}. Call or WhatsApp your preferred outlet to book.` });
}

/* ---------------- Issue + deliver ---------------- */
// Creates the order and its voucher(s), takes the next WESS code for each, then sends (or schedules) the emails.
export async function issue({ lines, buyer = {}, source = 'staff', payment_provider = null, status = 'paid', stripe_session_id = null, created_by = null, notes = null }) {
  if (!lines?.length) throw new Error('Nothing to issue');
  const items = []; for (const l of lines) { const it = await Items.get(l.item_id); if (!it || !it.active) throw new Error('Unknown or inactive item'); items.push(it); }
  const total = lines.reduce((s, l, i) => s + items[i].price * (l.qty || 1), 0);
  const order = await Orders.create({ source, buyer_name: buyer.name, buyer_email: buyer.email, buyer_phone: buyer.phone, total, status, payment_provider, stripe_session_id, created_by, notes, paid_at: status === 'paid' ? new Date().toISOString() : null });
  await Events.add({ order_id: order.order_id, type: 'order_created', detail: { source, total }, staff: created_by });
  const vouchers = status === 'paid' ? await fulfil(order, lines, items, created_by) : [];
  return { order, vouchers };
}

// Hands out codes and sends emails for a paid order (called at issue time, or by the Stripe webhook once paid)
export async function fulfil(order, lines, items, by) {
  const vouchers = [];
  for (const [i, l] of lines.entries()) {
    const it = items[i];
    for (let n = 0; n < (l.qty || 1); n++) {
      const voucher_id = crypto.randomUUID();
      const code = await Codes.allocate(it.item_id, voucher_id);
      if (!code) { await Events.add({ order_id: order.order_id, type: 'no_code', detail: { item: it.name }, staff: by }); throw new Error(`No voucher codes left for "${it.name}" — import new WESS codes first`); }
      const scheduled = l.send_at && new Date(l.send_at).getTime() > Date.now() + 60e3;
      const v = await Vouchers.create({ voucher_id, order_id: order.order_id, item_id: it.item_id, title: it.name, code, design_id: l.design_id || null, recipient_name: l.recipient_name, recipient_email: l.recipient_email, from_name: l.from_name || order.buyer_name, message: l.message, delivery: l.delivery || 'email', send_at: scheduled ? new Date(l.send_at).toISOString() : null, value_initial: it.kind === 'value' ? it.value : null, units_initial: it.kind === 'value' ? null : 1, validity_months: it.validity_months, status: scheduled ? 'scheduled' : 'active' });
      await Events.add({ voucher_id, order_id: order.order_id, type: 'created', detail: { code, scheduled: !!scheduled }, staff: by });
      const alert = await Alerts.check(it.item_id); if (alert?.fresh) { try { const r = await emailLowStock(alert); if (r) await Alerts.markEmailed(alert.alert_id); } catch (e) { console.error('low-stock email failed:', e.message); } }
      vouchers.push({ ...v, order_no: order.order_no });
    }
  }
  for (const v of vouchers) if (v.status === 'active' && v.delivery === 'email' && v.recipient_email) { try { await deliver(v.voucher_id, { by }); } catch (e) { console.error('voucher email failed:', e.message); await Events.add({ voucher_id: v.voucher_id, type: 'send_failed', detail: { error: e.message } }); } }
  try { await emailBuyer(order, vouchers); await Events.add({ order_id: order.order_id, type: 'receipt_sent', detail: { to: order.buyer_email } }); } catch (e) { console.error('receipt failed:', e.message); }
  try { await notifyElements(order, vouchers); } catch (e) { console.error('staff notification failed:', e.message); }
  return vouchers;
}

export async function deliver(voucher_id, { by = null, resend = false } = {}) {
  const v = await Vouchers.get(voucher_id); if (!v) throw new Error('Voucher not found');
  if (['voided'].includes(v.status)) throw new Error('This voucher is voided');
  const pdf = await htmlToPdf(await voucherHtml(v));
  const key = await files.put(`gift/vouchers/${voucher_id}-${Date.now()}.pdf`, pdf, 'application/pdf');
  const r = await emailRecipient(v, pdf, { resend });
  await Vouchers.markSent(voucher_id, key);
  await Events.add({ voucher_id, order_id: v.order_id, type: resend ? 'resent' : 'sent', detail: { to: v.recipient_email, provider: r.provider }, staff: by });
  return r;
}

/* ---------------- Scheduler: scheduled sends, expiry, reminders ---------------- */
let ticking = false;
export async function tick() {
  if (ticking) return; ticking = true;
  try {
    for (const { voucher_id } of await Vouchers.dueToSend()) { try { await deliver(voucher_id); } catch (e) { console.error('scheduled send failed:', e.message); await Events.add({ voucher_id, type: 'send_failed', detail: { error: e.message } }); } }
    await Vouchers.sweepExpired();
    if (mailProvider() !== 'outbox') {
      const days = (await Settings.get('expiry_reminder_days')) || 30;
      for (const v of await Vouchers.expiringWithin(days)) { try { if (await emailReminder(v)) await Events.add({ voucher_id: v.voucher_id, type: 'reminder_sent', detail: { to: v.recipient_email } }); } catch (e) { console.error('reminder failed:', e.message); } }
    }
  } finally { ticking = false; }
}
export function startScheduler() { setTimeout(tick, 15e3); setInterval(tick, 60e3).unref(); }
