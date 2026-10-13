// Staff API for gift vouchers (+ two public endpoints used by the website). Mounted by server.mjs.
import { Items, Codes, Alerts, Designs, Orders, Vouchers, Events, Settings, Reports, effectiveStatus, normalizeCode } from './db.mjs';
import * as giftup from './giftup.mjs';
import { issue, deliver, pdfFor, voucherHtml, OUTLETS } from './voucher.mjs';
import * as files from '../files.mjs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const withStatus = (v) => ({ ...v, status: effectiveStatus(v) });
const addMonths = (iso, m) => { const d = new Date(iso); d.setMonth(d.getMonth() + m); return d.toISOString(); };

export function registerGiftRoutes({ route, send, err, json, readBody, staff, sendFile }) {
  /* ---- dashboard ---- */
  route('GET', '/api/gift/summary', async (req, res) => send(res, 200, { ...(await Reports.summary()), recent: await Events.recent(12), giftup: giftup.enabled(), mail: (await import('../mail.mjs')).provider(), outlets: OUTLETS }));
  route('GET', '/api/gift/alerts', async (req, res) => send(res, 200, await Alerts.open()));

  /* ---- items ---- */
  route('GET', '/api/gift/items', async (req, res, { url }) => send(res, 200, await Items.list(url.searchParams.get('all') === '1')));
  route('POST', '/api/gift/items', async (req, res) => { const b = await json(req); if (!b.name?.trim() || !(+b.price >= 0)) return err(res, 400, 'Name and price are required'); send(res, 201, await Items.create(b, staff(req))); });
  route('PUT', '/api/gift/items/:id', async (req, res, { params }) => { const it = await Items.update(params.id, await json(req)); it ? send(res, 200, it) : err(res, 404, 'Item not found'); });

  /* ---- code pools ---- */
  route('GET', '/api/gift/codes', async (req, res) => send(res, 200, await Codes.stats()));
  route('GET', '/api/gift/codes/:item_id', async (req, res, { params, url }) => send(res, 200, { item: await Items.get(params.item_id), codes: await Codes.list(params.item_id, url.searchParams.get('status') || ''), batches: await Codes.batches(params.item_id) }));
  // Bulk import: body { codes: "one per line / comma / tab" | [..], note }
  route('POST', '/api/gift/codes/:item_id/import', async (req, res, { params }) => {
    const it = await Items.get(params.item_id); if (!it) return err(res, 404, 'Item not found');
    const b = await json(req);
    const raw = Array.isArray(b.codes) ? b.codes : String(b.codes || '').split(/\r?\n|,|\t|;/);
    const codes = raw.map((s) => s.trim()).filter(Boolean);
    if (!codes.length) return err(res, 400, 'Paste at least one code');
    const bad = codes.filter((c) => c.length < 6 || c.length > 60);
    if (bad.length) return err(res, 422, `These do not look like voucher codes: ${bad.slice(0, 5).join(', ')}${bad.length > 5 ? '…' : ''}`);
    const r = await Codes.import(it.item_id, codes, staff(req), b.note);
    await Alerts.check(it.item_id);
    await Events.add({ type: 'codes_imported', detail: { item: it.name, imported: r.imported, duplicates: r.duplicates.length }, staff: staff(req) });
    send(res, 200, { ...r, available: await Codes.available(it.item_id) });
  });

  /* ---- card designs ---- */
  route('GET', '/api/gift/designs', async (req, res, { url }) => send(res, 200, await Designs.list(url.searchParams.get('all') === '1')));
  route('POST', '/api/gift/designs', async (req, res) => {
    const buf = await readBody(req);
    const type = (req.headers['content-type'] || '').toString();
    const ext = type.includes('png') ? 'png' : type.includes('jpeg') || type.includes('jpg') ? 'jpg' : null;
    if (!ext || !buf.length) return err(res, 400, 'Upload a PNG or JPG image');
    if (buf.length > 4 * 1024 * 1024) return err(res, 413, 'Image is larger than 4 MB — export it smaller from Canva');
    const name = decodeURIComponent((req.headers['x-name'] || 'Untitled design').toString()).slice(0, 80);
    const key = await files.put(`gift/designs/${crypto.randomUUID()}.${ext}`, buf, ext === 'png' ? 'image/png' : 'image/jpeg');
    send(res, 201, await Designs.create({ name, image_path: key, customer_pick: true, sort: 100 }, staff(req)));
  });
  route('PUT', '/api/gift/designs/:id', async (req, res, { params }) => { await Designs.update(params.id, await json(req)); send(res, 200, await Designs.get(params.id)); });
  route('GET', '/api/gift/designs/:id/image', async (req, res, { params }) => { const d = await Designs.get(params.id); const buf = d && await files.get(d.image_path); if (!buf) return err(res, 404, 'Not found'); res.writeHead(200, { 'Content-Type': d.image_path.endsWith('.png') ? 'image/png' : 'image/jpeg', 'Cache-Control': 'public, max-age=86400' }); res.end(buf); }, { open: true });

  /* ---- vouchers & orders ---- */
  route('GET', '/api/gift/vouchers', async (req, res, { url }) => { const q = url.searchParams; send(res, 200, (await Vouchers.list({ q: q.get('q') || '', status: q.get('status') || '', item_id: q.get('item_id') || '', source: q.get('source') || '', limit: Math.min(+q.get('limit') || 100, 500), offset: +q.get('offset') || 0 })).map(withStatus)); });
  route('GET', '/api/gift/lookup', async (req, res, { url }) => { const v = await Vouchers.byCode(url.searchParams.get('code') || ''); v ? send(res, 200, withStatus(v)) : err(res, 404, 'No voucher with that code'); });
  route('GET', '/api/gift/vouchers/:id', async (req, res, { params }) => { const v = await Vouchers.get(params.id); if (!v) return err(res, 404, 'Voucher not found'); send(res, 200, { ...withStatus(v), events: await Events.forVoucher(params.id), siblings: (await Vouchers.forOrder(v.order_id)).filter((x) => x.voucher_id !== v.voucher_id).map(withStatus) }); });
  route('GET', '/api/gift/vouchers/:id/pdf', async (req, res, { params, url }) => { const v = await Vouchers.get(params.id); if (!v) return err(res, 404, 'Voucher not found'); const original = v.pdf_path?.startsWith('gift/giftup/') && url.searchParams.get('original') !== '0' ? await files.get(v.pdf_path) : null; sendFile(res, original || await pdfFor(params.id), 'application/pdf', `Elements-Gift-Voucher-${v.code.split(' ')[0]}.pdf`); });
  route('GET', '/api/gift/vouchers/:id/preview.html', async (req, res, { params }) => { const v = await Vouchers.get(params.id); if (!v) return err(res, 404, 'Voucher not found'); const html = (await voucherHtml(v)).replace('</head>', `<style>html{background:#e9e9ee}body{transform-origin:0 0;box-shadow:0 2px 12px rgba(0,0,0,.12)}</style><script>function fit(){if(!document.body)return;var z=document.documentElement.clientWidth/document.body.offsetWidth;document.body.style.transform='scale('+z+')';document.documentElement.style.height=(document.body.offsetHeight*z)+'px'}addEventListener('DOMContentLoaded',fit);addEventListener('load',fit);addEventListener('resize',fit)</script></head>`);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(html); });
  route('POST', '/api/gift/vouchers/:id/resend', async (req, res, { params }) => {
    const v = await Vouchers.get(params.id); if (!v) return err(res, 404, 'Voucher not found');
    const b = await json(req);
    if (b.recipient_email) { if (!EMAIL_RE.test(b.recipient_email)) return err(res, 422, 'Enter a valid email'); await Vouchers.setRecipient(params.id, { recipient_email: b.recipient_email.trim(), recipient_name: b.recipient_name?.trim() || null }); await Events.add({ voucher_id: params.id, type: 'recipient_changed', detail: { to: b.recipient_email.trim() }, staff: staff(req) }); }
    try { const r = await deliver(params.id, { by: staff(req), resend: true }); send(res, 200, { ok: true, provider: r.provider, file: r.file || null }); }
    catch (e) { err(res, 502, 'Could not send: ' + e.message); }
  });
  route('PUT', '/api/gift/vouchers/:id/recipient', async (req, res, { params }) => { const b = await json(req); if (b.recipient_email && !EMAIL_RE.test(b.recipient_email)) return err(res, 422, 'Enter a valid email'); await Vouchers.setRecipient(params.id, b); await Events.add({ voucher_id: params.id, type: 'recipient_changed', detail: b, staff: staff(req) }); send(res, 200, withStatus(await Vouchers.get(params.id))); });
  route('POST', '/api/gift/vouchers/:id/extend', async (req, res, { params }) => {
    const v = await Vouchers.get(params.id); if (!v) return err(res, 404, 'Voucher not found'); if (['voided', 'redeemed'].includes(v.status)) return err(res, 400, 'This voucher is ' + v.status);
    const b = await json(req); const months = Math.min(Math.max(+b.months || 0, 1), 24);
    const base = v.expires_at > new Date().toISOString() ? v.expires_at : new Date().toISOString();
    const expires_at = b.expires_at ? new Date(b.expires_at).toISOString() : addMonths(base, months);
    await Vouchers.extend(params.id, expires_at); await Events.add({ voucher_id: params.id, type: 'extended', detail: { from: v.expires_at, to: expires_at, reason: b.reason || null }, staff: staff(req) });
    send(res, 200, withStatus(await Vouchers.get(params.id)));
  });
  route('POST', '/api/gift/vouchers/:id/redeem', async (req, res, { params }) => {
    const v = await Vouchers.get(params.id); if (!v) return err(res, 404, 'Voucher not found');
    const st = effectiveStatus(v); if (st !== 'active') return err(res, 400, `This voucher is ${st} and cannot be redeemed`);
    const b = await json(req); if (!OUTLETS.includes(b.outlet)) return err(res, 422, 'Choose the outlet');
    await Vouchers.redeem(params.id, { outlet: b.outlet, staff: staff(req) }); await Events.add({ voucher_id: params.id, type: 'redeemed', detail: { outlet: b.outlet, note: b.note || null }, staff: staff(req) });
    send(res, 200, withStatus(await Vouchers.get(params.id)));
  });
  route('POST', '/api/gift/vouchers/:id/unredeem', async (req, res, { params }) => { const v = await Vouchers.get(params.id); if (!v || v.status !== 'redeemed') return err(res, 400, 'Not a redeemed voucher'); await Vouchers.unredeem(params.id); await Events.add({ voucher_id: params.id, type: 'unredeemed', detail: { reason: (await json(req)).reason || null }, staff: staff(req) }); send(res, 200, withStatus(await Vouchers.get(params.id))); });
  route('POST', '/api/gift/vouchers/:id/void', async (req, res, { params }) => {
    const v = await Vouchers.get(params.id); if (!v) return err(res, 404, 'Voucher not found'); if (v.status === 'voided') return err(res, 400, 'Already voided');
    const b = await json(req); if (!b.reason?.trim()) return err(res, 422, 'A reason is required');
    await Vouchers.void(params.id, { staff: staff(req), reason: b.reason.trim() }); await Events.add({ voucher_id: params.id, type: 'voided', detail: { reason: b.reason.trim() }, staff: staff(req) });
    send(res, 200, withStatus(await Vouchers.get(params.id)));
  });

  /* ---- issue manually (counter sale / complimentary) ---- */
  route('POST', '/api/gift/issue', async (req, res) => {
    const b = await json(req);
    const line = { item_id: b.item_id, qty: 1, recipient_name: b.recipient_name?.trim() || null, recipient_email: b.recipient_email?.trim() || null, from_name: b.from_name?.trim() || null, message: b.message?.trim() || null, design_id: b.design_id || null, delivery: b.delivery === 'print' ? 'print' : 'email', send_at: b.send_at || null };
    if (line.delivery === 'email' && !EMAIL_RE.test(line.recipient_email || '')) return err(res, 422, 'Enter the recipient email, or choose Print');
    if (!['counter', 'complimentary', 'other'].includes(b.payment)) return err(res, 422, 'Choose how it was paid');
    try {
      const r = await issue({ lines: [line], buyer: { name: b.buyer_name?.trim() || line.from_name, email: b.buyer_email?.trim() || null, phone: b.buyer_phone?.trim() || null }, source: 'staff', payment_provider: b.payment, created_by: staff(req), notes: b.notes || null });
      send(res, 201, { order: r.order, voucher: withStatus(await Vouchers.get(r.vouchers[0].voucher_id)) });
    } catch (e) { err(res, 400, e.message); }
  });

  /* ---- reports ---- */
  route('GET', '/api/gift/reports/sales', async (req, res, { url }) => { const y = url.searchParams.get('year'); send(res, 200, y ? await Reports.salesByMonth(`${+y - 1}-12-31`, `${+y + 1}-01-01T00:00:00`) : await Reports.salesByMonth(new Date(Date.now() - 366 * 864e5).toISOString(), '9999')); });
  route('GET', '/api/gift/reports/years', async (req, res) => send(res, 200, await Reports.salesByYear()));
  route('GET', '/api/gift/reports/items', async (req, res, { url }) => send(res, 200, await Reports.salesByItem(url.searchParams.get('from') || '2000', url.searchParams.get('to') || '9999')));
  route('GET', '/api/gift/reports/outlets', async (req, res, { url }) => send(res, 200, await Reports.redemptionsByOutlet(url.searchParams.get('from') || '2000', url.searchParams.get('to') || '9999')));
  route('GET', '/api/gift/reports/expiring', async (req, res, { url }) => send(res, 200, (await Reports.expiring(+url.searchParams.get('days') || 30)).map(withStatus)));
  route('GET', '/api/gift/export.csv', async (req, res, { url }) => {
    const rows = await Reports.exportRows(url.searchParams.get('from') || '2000', url.searchParams.get('to') || '9999');
    const cols = rows[0] ? Object.keys(rows[0]) : ['order_no'];
    const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(c === 'status' ? effectiveStatus(r) : r[c])).join(','))].join('\n') + '\n';
    res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="elements-vouchers-${new Date().toISOString().slice(0, 10)}.csv"`, 'Cache-Control': 'no-store' }); res.end('﻿' + csv);
  });

  /* ---- settings ---- */
  route('GET', '/api/gift/settings', async (req, res) => send(res, 200, await Settings.all()));
  route('PUT', '/api/gift/settings', async (req, res) => {
    const b = await json(req);
    if (b.notify_emails !== undefined) { const list = (Array.isArray(b.notify_emails) ? b.notify_emails : String(b.notify_emails).split(/[,;\s]+/)).map((s) => s.trim()).filter(Boolean); const bad = list.filter((e) => !EMAIL_RE.test(e)); if (bad.length) return err(res, 422, 'Not an email: ' + bad.join(', ')); await Settings.set('notify_emails', list); }
    if (b.low_stock_threshold !== undefined) await Settings.set('low_stock_threshold', Math.max(0, +b.low_stock_threshold || 0));
    if (b.terms !== undefined) await Settings.set('terms', String(b.terms).slice(0, 2000));
    if (b.expiry_reminder_days !== undefined) await Settings.set('expiry_reminder_days', Math.max(0, +b.expiry_reminder_days || 0));
    if (b.giftup_auto_sync !== undefined) await Settings.set('giftup_auto_sync', !!b.giftup_auto_sync);
    send(res, 200, await Settings.all());
  });

  /* ---- Gift Up migration ---- */
  route('GET', '/api/gift/giftup', async (req, res) => { try { send(res, 200, await giftup.preview()); } catch (e) { err(res, 502, e.message); } });
  route('POST', '/api/gift/giftup/import', async (req, res) => { try { const r = await giftup.importAll({ by: staff(req) }); await Events.add({ type: 'giftup_import', detail: r, staff: staff(req) }); send(res, 200, r); } catch (e) { err(res, 502, 'Import failed: ' + e.message); } });

  /* ---- public (website): catalogue + balance check — no personal data ---- */
  route('GET', '/api/gift/public/catalog', async (req, res) => send(res, 200, { items: (await Items.list()).filter((i) => i.show_on_website && i.codes_available > 0).map((i) => ({ item_id: i.item_id, name: i.name, kind: i.kind, price: i.price, value: i.value, description: i.description, validity_months: i.validity_months })), designs: (await Designs.list()).filter((d) => d.customer_pick).map((d) => ({ design_id: d.design_id, name: d.name, image: `/api/gift/designs/${d.design_id}/image` })) }, { 'Cache-Control': 'public, max-age=300' }), { open: true });
  route('GET', '/api/gift/public/check', async (req, res, { url }) => {
    const code = normalizeCode(url.searchParams.get('code') || ''); if (code.length < 6) return err(res, 400, 'Enter your voucher code');
    const v = await Vouchers.byCode(code); if (!v) return err(res, 404, 'We could not find a voucher with that code. Please check it and try again.');
    const st = effectiveStatus(v);
    send(res, 200, { title: v.title, status: st, value_remaining: v.value_remaining, expires_at: v.expires_at, redeemed_at: st === 'redeemed' ? v.redeemed_at : null });
  }, { open: true });
}
