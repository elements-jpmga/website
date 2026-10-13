// Gift voucher storage (Elements' own system, replacing Gift Up). Same database as Restore.
// Codes are WESS running numbers loaded in batches per item; a voucher takes the next available code.
// Decisions (13 Oct 2026): low-stock threshold 10 per item, staff mark redemptions here, no partial use.
import { db, id, now } from '../db.mjs';

export const TABLES = ['gift_items', 'gift_code_batches', 'gift_codes', 'gift_designs', 'gift_orders', 'gift_vouchers', 'gift_events', 'gift_alerts', 'gift_settings', 'gift_archive'];
await db.exec(`
CREATE TABLE IF NOT EXISTS gift_items (
  item_id TEXT PRIMARY KEY, name TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'treatment', price DOUBLE PRECISION NOT NULL, value DOUBLE PRECISION,
  wess_item_code TEXT, code_prefix TEXT, description TEXT, validity_months INTEGER NOT NULL DEFAULT 12, low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  active INTEGER NOT NULL DEFAULT 1, show_on_website INTEGER NOT NULL DEFAULT 1, sort INTEGER NOT NULL DEFAULT 100, giftup_id TEXT, created_at TEXT NOT NULL, updated_at TEXT
);
CREATE TABLE IF NOT EXISTS gift_code_batches (batch_id TEXT PRIMARY KEY, item_id TEXT NOT NULL REFERENCES gift_items(item_id), count INTEGER NOT NULL, imported_by TEXT, imported_at TEXT NOT NULL, note TEXT);
CREATE TABLE IF NOT EXISTS gift_codes (
  code TEXT PRIMARY KEY, item_id TEXT NOT NULL REFERENCES gift_items(item_id), batch_id TEXT, status TEXT NOT NULL DEFAULT 'available', voucher_id TEXT, imported_at TEXT NOT NULL, assigned_at TEXT
);
CREATE TABLE IF NOT EXISTS gift_designs (design_id TEXT PRIMARY KEY, name TEXT NOT NULL, image_path TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, customer_pick INTEGER NOT NULL DEFAULT 1, sort INTEGER NOT NULL DEFAULT 100, created_by TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS gift_orders (
  order_id TEXT PRIMARY KEY, order_no TEXT NOT NULL, source TEXT NOT NULL, buyer_name TEXT, buyer_email TEXT, buyer_phone TEXT, total DOUBLE PRECISION NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'SGD',
  status TEXT NOT NULL DEFAULT 'pending', payment_provider TEXT, stripe_session_id TEXT, stripe_payment_intent TEXT, giftup_order_id TEXT, notes TEXT, created_by TEXT, created_at TEXT NOT NULL, paid_at TEXT
);
CREATE TABLE IF NOT EXISTS gift_vouchers (
  voucher_id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES gift_orders(order_id), item_id TEXT REFERENCES gift_items(item_id), title TEXT NOT NULL, code TEXT NOT NULL, design_id TEXT,
  recipient_name TEXT, recipient_email TEXT, from_name TEXT, message TEXT, delivery TEXT NOT NULL DEFAULT 'email', send_at TEXT, sent_at TEXT,
  value_initial DOUBLE PRECISION, value_remaining DOUBLE PRECISION, units_initial INTEGER, units_remaining INTEGER,
  valid_from TEXT NOT NULL, expires_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active',
  redeemed_at TEXT, redeemed_outlet TEXT, redeemed_by TEXT, voided_at TEXT, voided_by TEXT, void_reason TEXT, giftup_id TEXT, pdf_path TEXT, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS gift_events (event_id TEXT PRIMARY KEY, voucher_id TEXT, order_id TEXT, type TEXT NOT NULL, detail TEXT, staff TEXT, at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS gift_alerts (alert_id TEXT PRIMARY KEY, item_id TEXT NOT NULL REFERENCES gift_items(item_id), level TEXT NOT NULL, remaining INTEGER NOT NULL, created_at TEXT NOT NULL, emailed_at TEXT, resolved_at TEXT);
CREATE TABLE IF NOT EXISTS gift_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS gift_archive (kind TEXT NOT NULL, giftup_id TEXT NOT NULL, json TEXT NOT NULL, imported_at TEXT NOT NULL, PRIMARY KEY (kind, giftup_id));
CREATE INDEX IF NOT EXISTS gift_codes_item_status ON gift_codes (item_id, status);
CREATE INDEX IF NOT EXISTS gift_vouchers_code ON gift_vouchers (code);
CREATE INDEX IF NOT EXISTS gift_vouchers_order ON gift_vouchers (order_id);
CREATE INDEX IF NOT EXISTS gift_events_voucher ON gift_events (voucher_id);
`);
// Columns added after the first release (CREATE TABLE IF NOT EXISTS does not add them to existing tables)
for (const sql of ['ALTER TABLE gift_orders ADD COLUMN cart_json TEXT', 'ALTER TABLE gift_orders ADD COLUMN return_base TEXT']) { try { await db.exec(sql); } catch {} }
if (db.kind === 'postgres') {
  // Same lock-down as the Restore tables: only this server reads them, never Supabase's public Data API
  await db.exec(TABLES.map((t) => `ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;`).join('\n') + `
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN EXECUTE 'REVOKE ALL ON ${TABLES.join(', ')} FROM anon, authenticated'; END IF; END $$;`);
}

const json = (s) => (s ? JSON.parse(s) : null);
const toInt = (v) => (v == null ? null : Number(v));
const addMonths = (iso, months) => { const d = new Date(iso); d.setMonth(d.getMonth() + months); return d.toISOString(); };

/* ---------------- Settings ---------------- */
export const DEFAULTS = {
  notify_emails: ['finance.ewg@gmail.com'], // who receives "voucher sold" and low-stock emails — more can be added in Settings
  low_stock_threshold: 10,
  terms: '• 12 months validity from issue date.\n• Proper identification is required to redeem the voucher. We reserve the right to decline in cases where identification is not duly provided.\n• Kindly call or WhatsApp your preferred outlet to make an appointment. The gift voucher must be presented on the appointment day for validation.',
  expiry_reminder_days: 30,
  giftup_auto_sync: true,       // while GIFTUP_API_KEY is set, pull anything new/changed from Gift Up once a day
};
export const Settings = {
  async all() { const rows = await db.all('SELECT key, value FROM gift_settings'); return { ...DEFAULTS, ...Object.fromEntries(rows.map((r) => [r.key, json(r.value)])) }; },
  async get(key) { return (await this.all())[key]; },
  set: (key, value) => db.run('INSERT INTO gift_settings (key, value, updated_at) VALUES (?,?,?) ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at', key, JSON.stringify(value), now()),
};

/* ---------------- Items (what is for sale) ---------------- */
export const Items = {
  list: (all = false) => db.all(`SELECT i.*, CAST((SELECT COUNT(*) FROM gift_codes c WHERE c.item_id = i.item_id AND c.status = 'available') AS INTEGER) AS codes_available,
    CAST((SELECT COUNT(*) FROM gift_vouchers v WHERE v.item_id = i.item_id) AS INTEGER) AS vouchers_total
    FROM gift_items i ${all ? '' : 'WHERE i.active = 1'} ORDER BY i.sort, i.name`),
  get: (item_id) => db.get('SELECT * FROM gift_items WHERE item_id = ?', item_id),
  byGiftup: (giftup_id) => db.get('SELECT * FROM gift_items WHERE giftup_id = ?', giftup_id),
  async create(f, by) {
    const it = { item_id: id(), name: f.name.trim(), kind: f.kind === 'value' ? 'value' : 'treatment', price: +f.price, value: f.kind === 'value' ? +(f.value ?? f.price) : null, wess_item_code: f.wess_item_code || null, code_prefix: f.code_prefix || null, description: f.description || null, validity_months: toInt(f.validity_months) || 12, low_stock_threshold: toInt(f.low_stock_threshold) ?? 10, active: f.active === false ? 0 : 1, show_on_website: f.show_on_website === false ? 0 : 1, sort: toInt(f.sort) ?? 100, giftup_id: f.giftup_id || null, created_at: now() };
    await db.run('INSERT INTO gift_items (item_id, name, kind, price, value, wess_item_code, code_prefix, description, validity_months, low_stock_threshold, active, show_on_website, sort, giftup_id, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', ...['item_id', 'name', 'kind', 'price', 'value', 'wess_item_code', 'code_prefix', 'description', 'validity_months', 'low_stock_threshold', 'active', 'show_on_website', 'sort', 'giftup_id', 'created_at'].map((k) => it[k]));
    return it;
  },
  async update(item_id, f) {
    const cur = await this.get(item_id); if (!cur) return null;
    const n = { ...cur, ...Object.fromEntries(Object.entries(f).filter(([k]) => ['name', 'kind', 'price', 'value', 'wess_item_code', 'code_prefix', 'description', 'validity_months', 'low_stock_threshold', 'active', 'show_on_website', 'sort'].includes(k))) };
    n.active = n.active ? 1 : 0; n.show_on_website = n.show_on_website ? 1 : 0; n.price = +n.price; n.value = n.kind === 'value' ? +(n.value ?? n.price) : null;
    await db.run('UPDATE gift_items SET name=?, kind=?, price=?, value=?, wess_item_code=?, code_prefix=?, description=?, validity_months=?, low_stock_threshold=?, active=?, show_on_website=?, sort=?, updated_at=? WHERE item_id=?', n.name, n.kind, n.price, n.value, n.wess_item_code, n.code_prefix, n.description, toInt(n.validity_months) || 12, toInt(n.low_stock_threshold) ?? 10, n.active, n.show_on_website, toInt(n.sort) ?? 100, now(), item_id);
    return this.get(item_id);
  },
};

/* ---------------- Code pools (WESS running numbers) ---------------- */
export const normalizeCode = (s) => String(s).replace(/\s+/g, ' ').replace(/\s*\(\s*/, ' (').replace(/\s*\)\s*/, ')').trim();
export const Codes = {
  stats: () => db.all(`SELECT i.item_id, i.name, i.low_stock_threshold, CAST(COALESCE(SUM(CASE WHEN c.status = 'available' THEN 1 ELSE 0 END), 0) AS INTEGER) AS available, CAST(COALESCE(SUM(CASE WHEN c.status = 'assigned' THEN 1 ELSE 0 END), 0) AS INTEGER) AS assigned
    FROM gift_items i LEFT JOIN gift_codes c ON c.item_id = i.item_id WHERE i.active = 1 GROUP BY i.item_id, i.name, i.low_stock_threshold, i.sort ORDER BY i.sort, i.name`),
  available: (item_id) => db.get(`SELECT CAST(COUNT(*) AS INTEGER) AS n FROM gift_codes WHERE item_id = ? AND status = 'available'`, item_id).then((r) => r.n),
  list: (item_id, status) => db.all(`SELECT c.*, v.recipient_name, v.status AS voucher_status FROM gift_codes c LEFT JOIN gift_vouchers v ON v.voucher_id = c.voucher_id WHERE c.item_id = ? ${status ? 'AND c.status = ?' : ''} ORDER BY c.imported_at, c.code`, ...(status ? [item_id, status] : [item_id])),
  batches: (item_id) => db.all('SELECT * FROM gift_code_batches WHERE item_id = ? ORDER BY imported_at DESC', item_id),
  // Bulk import: duplicates (already in any pool) are reported and skipped; nothing is overwritten.
  async import(item_id, rawCodes, by, note) {
    const codes = [...new Set(rawCodes.map(normalizeCode).filter(Boolean))];
    const existing = new Set((await db.all('SELECT code FROM gift_codes WHERE code = ANY(?)'.replace('= ANY(?)', db.kind === 'postgres' ? '= ANY(?)' : `IN (${codes.map(() => '?').join(',') || 'NULL'})`), ...(db.kind === 'postgres' ? [codes] : codes))).map((r) => r.code));
    const fresh = codes.filter((c) => !existing.has(c));
    const batch_id = id(), at = now();
    if (fresh.length) {
      await db.run('INSERT INTO gift_code_batches (batch_id, item_id, count, imported_by, imported_at, note) VALUES (?,?,?,?,?,?)', batch_id, item_id, fresh.length, by || null, at, note || null);
      for (const c of fresh) await db.run('INSERT INTO gift_codes (code, item_id, batch_id, status, imported_at) VALUES (?,?,?,?,?)', c, item_id, batch_id, 'available', at);
    }
    return { batch_id: fresh.length ? batch_id : null, imported: fresh.length, duplicates: codes.filter((c) => existing.has(c)), repeated: rawCodes.filter(Boolean).length - codes.length, total_given: rawCodes.length };
  },
  // Next available code for an item (oldest batch first, then code order). Postgres path is safe under concurrent sales.
  async allocate(item_id, voucher_id) {
    const at = now();
    if (db.kind === 'postgres') {
      const r = await db.get(`UPDATE gift_codes SET status = 'assigned', voucher_id = ?, assigned_at = ? WHERE code = (SELECT code FROM gift_codes WHERE item_id = ? AND status = 'available' ORDER BY imported_at, code LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING code`, voucher_id, at, item_id);
      return r?.code || null;
    }
    const r = await db.get(`SELECT code FROM gift_codes WHERE item_id = ? AND status = 'available' ORDER BY imported_at, code LIMIT 1`, item_id);
    if (!r) return null;
    await db.run(`UPDATE gift_codes SET status = 'assigned', voucher_id = ?, assigned_at = ? WHERE code = ?`, voucher_id, at, r.code);
    return r.code;
  },
  // Register a code that already exists outside the pool (Gift Up import) so it can never be handed out twice
  async claim(code, item_id, voucher_id, at) {
    await db.run(`INSERT INTO gift_codes (code, item_id, batch_id, status, voucher_id, imported_at, assigned_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT (code) DO UPDATE SET status = 'assigned', voucher_id = excluded.voucher_id, assigned_at = excluded.assigned_at`, code, item_id, null, 'assigned', voucher_id, at, at);
  },
  release: (code) => db.run(`UPDATE gift_codes SET status = 'available', voucher_id = NULL, assigned_at = NULL WHERE code = ?`, code),
};

/* ---------------- Low-stock alerts ---------------- */
export const Alerts = {
  open: () => db.all('SELECT a.*, i.name FROM gift_alerts a JOIN gift_items i USING (item_id) WHERE a.resolved_at IS NULL ORDER BY a.level DESC, a.created_at'),
  // Called after every allocation and import: opens/updates one alert per item while stock is at or below the threshold, resolves it once topped up
  async check(item_id) {
    const it = await Items.get(item_id); if (!it) return null;
    const remaining = await Codes.available(item_id);
    const level = remaining === 0 ? 'out' : remaining <= it.low_stock_threshold ? 'low' : null;
    const open = await db.get('SELECT * FROM gift_alerts WHERE item_id = ? AND resolved_at IS NULL', item_id);
    if (!level) { if (open) await db.run('UPDATE gift_alerts SET resolved_at = ? WHERE alert_id = ?', now(), open.alert_id); return null; }
    if (open && open.level === level) { await db.run('UPDATE gift_alerts SET remaining = ? WHERE alert_id = ?', remaining, open.alert_id); return { ...open, remaining, name: it.name, fresh: false }; }
    if (open) await db.run('UPDATE gift_alerts SET resolved_at = ? WHERE alert_id = ?', now(), open.alert_id);
    const a = { alert_id: id(), item_id, level, remaining, created_at: now() };
    await db.run('INSERT INTO gift_alerts (alert_id, item_id, level, remaining, created_at) VALUES (?,?,?,?,?)', a.alert_id, item_id, level, remaining, a.created_at);
    return { ...a, name: it.name, threshold: it.low_stock_threshold, fresh: true };
  },
  markEmailed: (alert_id) => db.run('UPDATE gift_alerts SET emailed_at = ? WHERE alert_id = ?', now(), alert_id),
};

/* ---------------- Card designs ---------------- */
export const Designs = {
  list: (all = false) => db.all(`SELECT * FROM gift_designs ${all ? '' : 'WHERE active = 1'} ORDER BY sort, created_at`),
  get: (design_id) => db.get('SELECT * FROM gift_designs WHERE design_id = ?', design_id),
  async create({ name, image_path, customer_pick = true, sort = 100 }, by) { const d = { design_id: id(), name: name.trim(), image_path, active: 1, customer_pick: customer_pick ? 1 : 0, sort: toInt(sort) ?? 100, created_by: by || null, created_at: now() }; await db.run('INSERT INTO gift_designs (design_id, name, image_path, active, customer_pick, sort, created_by, created_at) VALUES (?,?,?,?,?,?,?,?)', d.design_id, d.name, d.image_path, d.active, d.customer_pick, d.sort, d.created_by, d.created_at); return d; },
  update: (design_id, f) => db.run('UPDATE gift_designs SET name = COALESCE(?, name), active = COALESCE(?, active), customer_pick = COALESCE(?, customer_pick), sort = COALESCE(?, sort) WHERE design_id = ?', f.name ?? null, f.active == null ? null : (f.active ? 1 : 0), f.customer_pick == null ? null : (f.customer_pick ? 1 : 0), f.sort == null ? null : toInt(f.sort), design_id),
};

/* ---------------- Orders & vouchers ---------------- */
const pad = (n, w = 5) => String(n).padStart(w, '0');
export const Orders = {
  async nextNo() { const r = await db.get('SELECT CAST(COUNT(*) AS INTEGER) AS n FROM gift_orders'); return 'EW' + pad(r.n + 1); },
  async create(o) {
    const row = { order_id: id(), order_no: o.order_no || await this.nextNo(), source: o.source, buyer_name: o.buyer_name || null, buyer_email: o.buyer_email || null, buyer_phone: o.buyer_phone || null, total: +(o.total || 0), currency: o.currency || 'SGD', status: o.status || 'pending', payment_provider: o.payment_provider || null, stripe_session_id: o.stripe_session_id || null, stripe_payment_intent: o.stripe_payment_intent || null, giftup_order_id: o.giftup_order_id || null, notes: o.notes || null, created_by: o.created_by || null, created_at: o.created_at || now(), paid_at: o.paid_at || null };
    await db.run('INSERT INTO gift_orders (order_id, order_no, source, buyer_name, buyer_email, buyer_phone, total, currency, status, payment_provider, stripe_session_id, stripe_payment_intent, giftup_order_id, notes, created_by, created_at, paid_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', ...Object.values(row));
    return row;
  },
  get: (order_id) => db.get('SELECT * FROM gift_orders WHERE order_id = ?', order_id),
  byStripeSession: (sid) => db.get('SELECT * FROM gift_orders WHERE stripe_session_id = ?', sid),
  setCheckout: (order_id, { stripe_session_id, cart, return_base }) => db.run('UPDATE gift_orders SET stripe_session_id = ?, cart_json = ?, return_base = ? WHERE order_id = ?', stripe_session_id, JSON.stringify(cart), return_base || null, order_id),
  cart: (o) => (o.cart_json ? JSON.parse(o.cart_json) : []),
  byGiftup: (gid) => db.get('SELECT * FROM gift_orders WHERE giftup_order_id = ?', gid),
  markPaid: (order_id, { payment_intent } = {}) => db.run(`UPDATE gift_orders SET status = 'paid', paid_at = ?, stripe_payment_intent = COALESCE(?, stripe_payment_intent) WHERE order_id = ?`, now(), payment_intent || null, order_id),
  setStatus: (order_id, status) => db.run('UPDATE gift_orders SET status = ? WHERE order_id = ?', status, order_id),
};

export const effectiveStatus = (v) => (v.status === 'active' && v.expires_at < now() ? 'expired' : v.status);
export const Vouchers = {
  async create(v) {
    const valid_from = v.valid_from || now();
    const row = { voucher_id: v.voucher_id || id(), order_id: v.order_id, item_id: v.item_id || null, title: v.title, code: normalizeCode(v.code), design_id: v.design_id || null, recipient_name: v.recipient_name || null, recipient_email: v.recipient_email || null, from_name: v.from_name || null, message: v.message || null, delivery: v.delivery || 'email', send_at: v.send_at || null, sent_at: v.sent_at || null, value_initial: v.value_initial ?? null, value_remaining: v.value_remaining ?? v.value_initial ?? null, units_initial: v.units_initial ?? null, units_remaining: v.units_remaining ?? v.units_initial ?? null, valid_from, expires_at: v.expires_at || addMonths(valid_from, v.validity_months || 12), status: v.status || 'active', redeemed_at: v.redeemed_at || null, redeemed_outlet: v.redeemed_outlet || null, redeemed_by: v.redeemed_by || null, voided_at: v.voided_at || null, voided_by: v.voided_by || null, void_reason: v.void_reason || null, giftup_id: v.giftup_id || null, pdf_path: v.pdf_path || null, created_at: v.created_at || now() };
    await db.run('INSERT INTO gift_vouchers (voucher_id, order_id, item_id, title, code, design_id, recipient_name, recipient_email, from_name, message, delivery, send_at, sent_at, value_initial, value_remaining, units_initial, units_remaining, valid_from, expires_at, status, redeemed_at, redeemed_outlet, redeemed_by, voided_at, voided_by, void_reason, giftup_id, pdf_path, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', ...Object.values(row));
    return row;
  },
  get: (voucher_id) => db.get('SELECT v.*, o.order_no, o.buyer_name, o.buyer_email, o.buyer_phone, o.source, o.total AS order_total, o.status AS order_status, o.paid_at, d.name AS design_name, d.image_path AS design_image FROM gift_vouchers v JOIN gift_orders o USING (order_id) LEFT JOIN gift_designs d ON d.design_id = v.design_id WHERE v.voucher_id = ?', voucher_id),
  byCode: (code) => db.get('SELECT v.*, o.order_no, o.buyer_name, o.buyer_email, o.source FROM gift_vouchers v JOIN gift_orders o USING (order_id) WHERE LOWER(v.code) = LOWER(?)', normalizeCode(code)),
  byGiftup: (gid) => db.get('SELECT * FROM gift_vouchers WHERE giftup_id = ?', gid),
  forOrder: (order_id) => db.all('SELECT * FROM gift_vouchers WHERE order_id = ? ORDER BY created_at', order_id),
  // Search/list for the staff screens
  list({ q = '', status = '', item_id = '', source = '', limit = 100, offset = 0 } = {}) {
    const where = [], p = [];
    if (q) { const like = `%${q.toLowerCase()}%`; where.push('(LOWER(v.code) LIKE ? OR LOWER(COALESCE(v.recipient_name, \'\')) LIKE ? OR LOWER(COALESCE(v.recipient_email, \'\')) LIKE ? OR LOWER(COALESCE(o.buyer_name, \'\')) LIKE ? OR LOWER(COALESCE(o.buyer_email, \'\')) LIKE ? OR LOWER(o.order_no) LIKE ?)'); p.push(like, like, like, like, like, like); }
    if (status === 'expired') where.push(`v.status = 'active' AND v.expires_at < ?`), p.push(now());
    else if (status === 'active') where.push(`v.status = 'active' AND v.expires_at >= ?`), p.push(now());
    else if (status === 'scheduled') where.push(`v.status = 'scheduled'`);
    else if (status) where.push('v.status = ?'), p.push(status);
    if (item_id) where.push('v.item_id = ?'), p.push(item_id);
    if (source) where.push('o.source = ?'), p.push(source);
    return db.all(`SELECT v.*, o.order_no, o.buyer_name, o.buyer_email, o.source, o.status AS order_status FROM gift_vouchers v JOIN gift_orders o USING (order_id) ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY v.created_at DESC LIMIT ? OFFSET ?`, ...p, limit, offset);
  },
  setPdf: (voucher_id, pdf_path) => db.run('UPDATE gift_vouchers SET pdf_path = ? WHERE voucher_id = ?', pdf_path, voucher_id),
  markSent: (voucher_id, pdf_path) => db.run(`UPDATE gift_vouchers SET sent_at = ?, status = CASE WHEN status = 'scheduled' THEN 'active' ELSE status END, pdf_path = COALESCE(?, pdf_path) WHERE voucher_id = ?`, now(), pdf_path || null, voucher_id),
  setRecipient: (voucher_id, { recipient_name, recipient_email, message, from_name }) => db.run('UPDATE gift_vouchers SET recipient_name = COALESCE(?, recipient_name), recipient_email = COALESCE(?, recipient_email), message = COALESCE(?, message), from_name = COALESCE(?, from_name) WHERE voucher_id = ?', recipient_name ?? null, recipient_email ?? null, message ?? null, from_name ?? null, voucher_id),
  extend: (voucher_id, expires_at) => db.run(`UPDATE gift_vouchers SET expires_at = ?, status = CASE WHEN status IN ('active','expired') THEN 'active' ELSE status END WHERE voucher_id = ?`, expires_at, voucher_id),
  // No partial use: redeeming uses the whole voucher
  redeem: (voucher_id, { outlet, staff }) => db.run(`UPDATE gift_vouchers SET status = 'redeemed', redeemed_at = ?, redeemed_outlet = ?, redeemed_by = ?, value_remaining = CASE WHEN value_remaining IS NULL THEN NULL ELSE 0 END, units_remaining = CASE WHEN units_remaining IS NULL THEN NULL ELSE 0 END WHERE voucher_id = ?`, now(), outlet || null, staff || null, voucher_id),
  unredeem: (voucher_id) => db.run(`UPDATE gift_vouchers SET status = 'active', redeemed_at = NULL, redeemed_outlet = NULL, redeemed_by = NULL, value_remaining = value_initial, units_remaining = units_initial WHERE voucher_id = ?`, voucher_id),
  void: (voucher_id, { staff, reason }) => db.run(`UPDATE gift_vouchers SET status = 'voided', voided_at = ?, voided_by = ?, void_reason = ? WHERE voucher_id = ?`, now(), staff || null, reason || null, voucher_id),
  dueToSend: () => db.all(`SELECT voucher_id FROM gift_vouchers WHERE status = 'scheduled' AND send_at <= ? ORDER BY send_at LIMIT 50`, now()),
  expiringWithin: (days) => { const until = new Date(Date.now() + days * 864e5).toISOString(); return db.all(`SELECT v.*, o.buyer_email, o.buyer_name FROM gift_vouchers v JOIN gift_orders o USING (order_id) WHERE v.status = 'active' AND v.expires_at BETWEEN ? AND ? AND NOT EXISTS (SELECT 1 FROM gift_events e WHERE e.voucher_id = v.voucher_id AND e.type = 'reminder_sent') ORDER BY v.expires_at`, now(), until); },
  sweepExpired: () => db.run(`UPDATE gift_vouchers SET status = 'expired' WHERE status = 'active' AND expires_at < ?`, now()),
  // Gift Up sync: bring an imported voucher up to date unless staff have acted on it here
  syncFromGiftup: (voucher_id, f) => db.run('UPDATE gift_vouchers SET status = ?, expires_at = ?, value_remaining = ?, units_remaining = ?, voided_at = ?, recipient_email = COALESCE(?, recipient_email), sent_at = COALESCE(?, sent_at) WHERE voucher_id = ?', f.status, f.expires_at, f.value_remaining, f.units_remaining, f.voided_at, f.recipient_email, f.sent_at, voucher_id),
  touchedByStaff: (voucher_id) => db.get(`SELECT CAST(COUNT(*) AS INTEGER) AS n FROM gift_events WHERE voucher_id = ? AND type IN ('redeemed','unredeemed','voided','extended','recipient_changed','resent')`, voucher_id).then((r) => r.n > 0),
};

// Complete raw copy of every Gift Up record (card + order) so nothing is lost when Gift Up is switched off
export const Archive = {
  put: (kind, giftup_id, obj) => db.run('INSERT INTO gift_archive (kind, giftup_id, json, imported_at) VALUES (?,?,?,?) ON CONFLICT (kind, giftup_id) DO UPDATE SET json = excluded.json, imported_at = excluded.imported_at', kind, String(giftup_id), JSON.stringify(obj), now()),
  get: (kind, giftup_id) => db.get('SELECT json FROM gift_archive WHERE kind = ? AND giftup_id = ?', kind, String(giftup_id)).then((r) => (r ? JSON.parse(r.json) : null)),
  count: () => db.get('SELECT CAST(COUNT(*) AS INTEGER) AS n FROM gift_archive').then((r) => r.n),
};

export const Events = {
  add: (e) => db.run('INSERT INTO gift_events (event_id, voucher_id, order_id, type, detail, staff, at) VALUES (?,?,?,?,?,?,?)', id(), e.voucher_id || null, e.order_id || null, e.type, e.detail ? JSON.stringify(e.detail) : null, e.staff || null, e.at || now()),
  forVoucher: (voucher_id) => db.all('SELECT * FROM gift_events WHERE voucher_id = ? ORDER BY at', voucher_id).then((rows) => rows.map((r) => ({ ...r, detail: json(r.detail) }))),
  recent: (limit = 40) => db.all('SELECT e.*, v.code, v.recipient_name, v.title FROM gift_events e LEFT JOIN gift_vouchers v USING (voucher_id) ORDER BY e.at DESC LIMIT ?', limit).then((rows) => rows.map((r) => ({ ...r, detail: json(r.detail) }))),
};

/* ---------------- Reports ---------------- */
// Months are grouped in Singapore time (what Elements' accounts and the Gift Up dashboard use)
const monthExpr = db.kind === 'postgres' ? "to_char((o.paid_at::timestamptz AT TIME ZONE 'Asia/Singapore'), 'YYYY-MM')" : "strftime('%Y-%m', datetime(o.paid_at, '+8 hours'))";
export const Reports = {
  async summary() {
    const t = now(); const sg = new Date(Date.now() + 8 * 3600e3); const utcOf = (y, m) => new Date(Date.UTC(y, m, 1) - 8 * 3600e3).toISOString(); const monthStart = utcOf(sg.getUTCFullYear(), sg.getUTCMonth()); const prevStart = utcOf(sg.getUTCFullYear(), sg.getUTCMonth() - 1);
    const sales = async (from, to) => db.get(`SELECT CAST(COUNT(*) AS INTEGER) AS orders, COALESCE(SUM(total), 0) AS revenue FROM gift_orders WHERE status = 'paid' AND paid_at >= ? AND paid_at < ?`, from, to);
    const [thisMonth, lastMonth] = [await sales(monthStart, '9999'), await sales(prevStart, monthStart)];
    const out = await db.get(`SELECT CAST(COUNT(*) AS INTEGER) AS vouchers, COALESCE(SUM(value_remaining), 0) AS value, CAST(COALESCE(SUM(units_remaining), 0) AS INTEGER) AS units FROM gift_vouchers WHERE status = 'active' AND expires_at >= ?`, t);
    const redeemed30 = await db.get(`SELECT CAST(COUNT(*) AS INTEGER) AS n FROM gift_vouchers WHERE status = 'redeemed' AND redeemed_at >= ?`, new Date(Date.now() - 30 * 864e5).toISOString());
    const expiring = await db.get(`SELECT CAST(COUNT(*) AS INTEGER) AS n FROM gift_vouchers WHERE status = 'active' AND expires_at BETWEEN ? AND ?`, t, new Date(Date.now() + 30 * 864e5).toISOString());
    const scheduled = await db.get(`SELECT CAST(COUNT(*) AS INTEGER) AS n FROM gift_vouchers WHERE status = 'scheduled'`);
    return { thisMonth, lastMonth, allTime: await this.allTime(), outstanding: out, redeemed30: redeemed30.n, expiring30: expiring.n, scheduled: scheduled.n, codes: await Codes.stats(), alerts: await Alerts.open() };
  },
  salesByMonth: (from = '2000', to = '9999') => db.all(`SELECT ${monthExpr} AS month, CAST(COUNT(*) AS INTEGER) AS orders, COALESCE(SUM(o.total), 0) AS revenue FROM gift_orders o WHERE o.status = 'paid' AND o.paid_at >= ? AND o.paid_at < ? GROUP BY ${monthExpr} ORDER BY month`, from, to),
  salesByYear: () => db.all(`SELECT SUBSTR(${monthExpr}, 1, 4) AS year, CAST(COUNT(*) AS INTEGER) AS orders, COALESCE(SUM(o.total), 0) AS revenue FROM gift_orders o WHERE o.status = 'paid' GROUP BY SUBSTR(${monthExpr}, 1, 4) ORDER BY year`),
  allTime: () => db.get(`SELECT CAST(COUNT(*) AS INTEGER) AS orders, COALESCE(SUM(total), 0) AS revenue, MIN(paid_at) AS since FROM gift_orders WHERE status = 'paid'`),
  salesByItem: (from, to) => db.all(`SELECT v.title, CAST(COUNT(*) AS INTEGER) AS vouchers, COALESCE(SUM(COALESCE(v.value_initial, i.price)), 0) AS value FROM gift_vouchers v JOIN gift_orders o USING (order_id) LEFT JOIN gift_items i ON i.item_id = v.item_id WHERE o.status = 'paid' AND o.paid_at >= ? AND o.paid_at < ? GROUP BY v.title ORDER BY vouchers DESC`, from, to),
  redemptionsByOutlet: (from, to) => db.all(`SELECT COALESCE(redeemed_outlet, 'Not recorded') AS outlet, CAST(COUNT(*) AS INTEGER) AS vouchers, COALESCE(SUM(value_initial), 0) AS value FROM gift_vouchers WHERE status = 'redeemed' AND redeemed_at >= ? AND redeemed_at < ? GROUP BY redeemed_outlet ORDER BY vouchers DESC`, from, to),
  expiring: (days = 30) => db.all(`SELECT v.*, o.buyer_name, o.buyer_email FROM gift_vouchers v JOIN gift_orders o USING (order_id) WHERE v.status = 'active' AND v.expires_at BETWEEN ? AND ? ORDER BY v.expires_at`, now(), new Date(Date.now() + days * 864e5).toISOString()),
  exportRows: (from, to) => db.all(`SELECT o.order_no, o.created_at AS ordered_at, o.paid_at, o.source, o.status AS order_status, o.buyer_name, o.buyer_email, o.total, v.title, v.code, v.recipient_name, v.recipient_email, v.value_initial, v.units_initial, v.valid_from, v.expires_at, v.status, v.sent_at, v.redeemed_at, v.redeemed_outlet, v.redeemed_by, v.voided_at, v.void_reason FROM gift_vouchers v JOIN gift_orders o USING (order_id) WHERE o.created_at >= ? AND o.created_at < ? ORDER BY o.created_at DESC`, from, to),
};
