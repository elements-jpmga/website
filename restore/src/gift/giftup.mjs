// One-way import from Gift Up (read-only API key) into Elements' own voucher tables.
// Safe to run repeatedly: anything already imported (by Gift Up id / code) is skipped, nothing in Gift Up is changed.
import { Items, Codes, Designs, Orders, Vouchers, Events, normalizeCode } from './db.mjs';
import * as files from '../files.mjs';

const KEY = () => process.env.GIFTUP_API_KEY || '';
export const enabled = () => Boolean(KEY());
const api = async (p) => {
  const r = await fetch('https://api.giftup.app' + p, { headers: { Authorization: `Bearer ${KEY()}`, Accept: 'application/json' } });
  if (!r.ok) throw new Error(`Gift Up ${r.status} on ${p}`);
  return r.json();
};
const wessCode = (code) => (String(code).match(/\(([^)]+)\)/) || [])[1] || null;
const prefix = (code) => String(code).replace(/-\d{4}\s*\(.*$/, '').replace(/\s*\(.*$/, '');
const DESIGN_NAME = 'Classic (sauna)';
const ARTWORK = 'https://cdn.giftup.app/assets/025887db-063a-408b-34b2-08da9590d9f1/7x/ugwNbqEav2/2UupbvoQ.png';

export async function importAll({ by = 'Gift Up import', onProgress = () => {} } = {}) {
  if (!enabled()) throw new Error('GIFTUP_API_KEY is not set');
  const out = { items: 0, codes: 0, duplicates: 0, orders: 0, vouchers: 0, skipped: 0, design: null };

  // 1. The card design Gift Up uses today, as design #1
  let design = (await Designs.list(true)).find((d) => d.name === DESIGN_NAME);
  if (!design) {
    const png = Buffer.from(await (await fetch(ARTWORK)).arrayBuffer());
    const key = await files.put('gift/designs/classic-sauna.png', png, 'image/png');
    design = await Designs.create({ name: DESIGN_NAME, image_path: key, customer_pick: true, sort: 1 }, by);
    out.design = design.design_id;
  }

  // 2. Items for sale + their unused WESS code pools
  const guItems = await api('/items');
  const itemByGu = {};
  for (const g of guItems) {
    const d = await api('/items/' + g.id);
    let it = await Items.byGiftup(g.id);
    const first = d.codes?.[0] || '';
    if (!it) {
      it = await Items.create({ name: d.name, kind: d.backingType === 'Currency' ? 'value' : 'treatment', price: d.price, value: d.backingType === 'Currency' ? (d.value || d.price) : null, wess_item_code: wessCode(first), code_prefix: first ? prefix(first) : null, description: d.description || null, validity_months: d.expiresInMonths || 12, giftup_id: g.id, sort: 100 + out.items }, by);
      out.items++;
    }
    itemByGu[g.id] = it;
    if (Array.isArray(d.codes) && d.codes.length) { const r = await Codes.import(it.item_id, d.codes, by, 'Unused codes carried over from Gift Up'); out.codes += r.imported; out.duplicates += r.duplicates.length; }
    onProgress({ stage: 'items', done: out.items });
  }
  // Older items that only exist on past vouchers (e.g. "$150 Spa Voucher") are kept as voucher titles, not sold again.
  const itemByTitle = Object.fromEntries((await Items.list(true)).map((i) => [i.name.toLowerCase(), i]));

  // 3. Every gift card ever sold → order + voucher + history. Codes are claimed so they can never be handed out again.
  let offset = 0;
  while (true) {
    const page = await api(`/gift-cards?limit=100&offset=${offset}`);
    for (const c of page.giftCards) {
      if (await Vouchers.byGiftup(c.code)) { out.skipped++; continue; } // Gift Up identifies a card by its code
      const o = c.order || {};
      let order = o.id ? await Orders.byGiftup(o.id) : null;
      if (!order) {
        order = await Orders.create({ order_no: o.orderNumber ? `GU-${o.orderNumber}` : `GU-${String(c.code).slice(-9)}`, source: 'giftup', buyer_name: c.purchaserName || o.purchaserName || null, buyer_email: o.purchaserEmail || null, total: o.revenue ?? (c.initialValue || c.equivalentValuePerUnit || 0), currency: o.currency || 'SGD', status: 'paid', payment_provider: o.payment?.provider || 'Gift Up', giftup_order_id: o.id || null, created_at: o.createdOn || c.createdOn, paid_at: o.createdOn || c.createdOn, created_by: by });
        out.orders++;
      }
      const item = itemByTitle[String(c.title || '').toLowerCase()] || null;
      const units = c.backingType === 'Units';
      const status = c.isVoided ? 'voided' : (c.hasExpired || (c.expiresOn && c.expiresOn < new Date().toISOString())) ? 'expired' : (units ? c.remainingUnits === 0 : c.remainingValue === 0) ? 'redeemed' : 'active';
      const v = await Vouchers.create({
        order_id: order.order_id, item_id: item?.item_id || null, title: c.title || item?.name || 'Gift voucher', code: c.code, design_id: design.design_id,
        recipient_name: c.recipientName || null, recipient_email: c.recipientEmail || c.emailFulfilment?.emailAddress || null, from_name: c.purchaserName || null, message: c.message || null,
        delivery: c.fulfilledBy === 'Print' ? 'print' : 'email', send_at: c.emailFulfilment?.scheduledFor || null, sent_at: c.fulfilledOn || null,
        value_initial: units ? null : c.initialValue, value_remaining: units ? null : c.remainingValue, units_initial: units ? c.initialUnits : null, units_remaining: units ? c.remainingUnits : null,
        valid_from: c.validFrom || c.createdOn, expires_at: c.expiresOn || c.createdOn, status, voided_at: c.voidedOn || null, giftup_id: c.code, created_at: c.createdOn,
      });
      await Codes.claim(normalizeCode(c.code), item?.item_id || (await ensureLegacyItem(c, itemByTitle, by)).item_id, v.voucher_id, c.createdOn);
      for (const l of c.ledger || []) {
        const type = { GiftCardCreated: 'created', Expired: 'expired', Unexpired: 'extended', Voided: 'voided' }[l.eventType] || l.eventType.toLowerCase();
        await Events.add({ voucher_id: v.voucher_id, order_id: order.order_id, type, detail: { source: 'giftup', reason: l.reason || undefined }, staff: l.whoName || l.whoEmail || null, at: l.eventOccuredOn || c.createdOn });
      }
      if (c.fulfilledOn) await Events.add({ voucher_id: v.voucher_id, order_id: order.order_id, type: 'sent', detail: { source: 'giftup', by: c.fulfilledBy }, at: c.fulfilledOn });
      out.vouchers++;
    }
    onProgress({ stage: 'vouchers', done: out.vouchers + out.skipped, total: page.total });
    offset += 100; if (!page.hasMore) break;
  }
  return out;
}

// Items that are no longer sold but still have vouchers out — created inactive so their codes have a home
async function ensureLegacyItem(c, itemByTitle, by) {
  const key = String(c.title || 'Legacy voucher').toLowerCase();
  if (itemByTitle[key]) return itemByTitle[key];
  const it = await Items.create({ name: c.title || 'Legacy voucher', kind: c.backingType === 'Currency' ? 'value' : 'treatment', price: c.initialValue || c.equivalentValuePerUnit || 0, value: c.backingType === 'Currency' ? c.initialValue : null, wess_item_code: wessCode(c.code), code_prefix: prefix(c.code), active: false, show_on_website: false, sort: 900 }, by);
  itemByTitle[key] = it;
  return it;
}

// Read-only preview for the staff screen: what would be imported
export async function preview() {
  if (!enabled()) return { enabled: false };
  const first = await api('/gift-cards?limit=1');
  const items = await api('/items');
  return { enabled: true, giftCards: first.total, items: items.length };
}
