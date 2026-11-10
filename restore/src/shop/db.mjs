// Product orders placed on the website (paid through Stripe Checkout, collected at an outlet or delivered). Same database as Restore.
import { db, id, now } from '../db.mjs';

export const TABLES = ['shop_orders', 'shop_events'];
await db.exec(`
CREATE TABLE IF NOT EXISTS shop_orders (
  order_id TEXT PRIMARY KEY, order_no TEXT NOT NULL, buyer_name TEXT, buyer_email TEXT, buyer_phone TEXT,
  fulfilment TEXT NOT NULL DEFAULT 'collect', outlet TEXT, address_json TEXT, lines_json TEXT NOT NULL,
  subtotal DOUBLE PRECISION NOT NULL DEFAULT 0, delivery_fee DOUBLE PRECISION NOT NULL DEFAULT 0, total DOUBLE PRECISION NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'SGD',
  status TEXT NOT NULL DEFAULT 'pending', stripe_session_id TEXT, stripe_payment_intent TEXT, return_base TEXT, customer_note TEXT, staff_note TEXT,
  created_at TEXT NOT NULL, paid_at TEXT, ready_at TEXT, completed_at TEXT, cancelled_at TEXT, updated_by TEXT
);
CREATE TABLE IF NOT EXISTS shop_events (event_id TEXT PRIMARY KEY, order_id TEXT NOT NULL, type TEXT NOT NULL, detail TEXT, staff TEXT, at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS shop_orders_session ON shop_orders (stripe_session_id);
CREATE INDEX IF NOT EXISTS shop_orders_status ON shop_orders (status, created_at);
`);
if (db.kind === 'postgres') {
  await db.exec(TABLES.map((t) => `ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;`).join('\n') + `
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN EXECUTE 'REVOKE ALL ON ${TABLES.join(', ')} FROM anon, authenticated'; END IF; END $$;`);
}

const json = (s) => (s ? JSON.parse(s) : null);
const pad = (n) => String(n).padStart(5, '0');
// pending → paid → ready (packed at the outlet / handed to the courier) → completed. cancelled / failed / refunded end the flow.
export const STATUSES = ['pending', 'paid', 'ready', 'completed', 'cancelled', 'failed', 'refunded'];

export const hydrate = (o) => o && ({ ...o, lines: json(o.lines_json) || [], address: json(o.address_json) });

export const Orders = {
  async nextNo() { const r = await db.get('SELECT CAST(COUNT(*) AS INTEGER) AS n FROM shop_orders'); return 'EWP' + pad(r.n + 1); },
  async create(o) {
    const row = { order_id: id(), order_no: await this.nextNo(), buyer_name: o.buyer_name || null, buyer_email: o.buyer_email || null, buyer_phone: o.buyer_phone || null,
      fulfilment: o.fulfilment || 'collect', outlet: o.outlet || null, address_json: o.address ? JSON.stringify(o.address) : null, lines_json: JSON.stringify(o.lines || []),
      subtotal: +o.subtotal || 0, delivery_fee: +o.delivery_fee || 0, total: +o.total || 0, currency: 'SGD', status: 'pending', stripe_session_id: null, stripe_payment_intent: null,
      return_base: o.return_base || null, customer_note: o.customer_note || null, staff_note: null, created_at: now(), paid_at: null, ready_at: null, completed_at: null, cancelled_at: null, updated_by: null };
    await db.run(`INSERT INTO shop_orders (${Object.keys(row).join(', ')}) VALUES (${Object.keys(row).map(() => '?').join(',')})`, ...Object.values(row));
    return hydrate(row);
  },
  get: (order_id) => db.get('SELECT * FROM shop_orders WHERE order_id = ?', order_id).then(hydrate),
  byNo: (order_no) => db.get('SELECT * FROM shop_orders WHERE order_no = ?', order_no).then(hydrate),
  bySession: (sid) => db.get('SELECT * FROM shop_orders WHERE stripe_session_id = ?', sid).then(hydrate),
  setSession: (order_id, sid) => db.run('UPDATE shop_orders SET stripe_session_id = ? WHERE order_id = ?', sid, order_id),
  markPaid: (order_id, { payment_intent } = {}) => db.run(`UPDATE shop_orders SET status = 'paid', paid_at = ?, stripe_payment_intent = COALESCE(?, stripe_payment_intent) WHERE order_id = ? AND status = 'pending'`, now(), payment_intent || null, order_id),
  setStatus(order_id, status, staff = null) {
    const stamp = { ready: 'ready_at', completed: 'completed_at', cancelled: 'cancelled_at' }[status];
    return db.run(`UPDATE shop_orders SET status = ?, updated_by = ?${stamp ? `, ${stamp} = '${now()}'` : ''} WHERE order_id = ?`, status, staff, order_id);
  },
  setStaffNote: (order_id, note, staff) => db.run('UPDATE shop_orders SET staff_note = ?, updated_by = ? WHERE order_id = ?', note || null, staff, order_id),
  async list({ q = '', status = '', outlet = '', limit = 200 } = {}) {
    const where = ['status <> \'pending\' OR created_at > ?'], args = [new Date(Date.now() - 2 * 3600e3).toISOString()]; // abandoned checkouts drop out after two hours
    if (status) { where.push('status = ?'); args.push(status); }
    if (outlet) { where.push('outlet = ?'); args.push(outlet); }
    if (q) { const like = `%${q.toLowerCase()}%`; where.push('(LOWER(order_no) LIKE ? OR LOWER(buyer_name) LIKE ? OR LOWER(buyer_email) LIKE ? OR LOWER(lines_json) LIKE ?)'); args.push(like, like, like, like); }
    const rows = await db.all(`SELECT * FROM shop_orders WHERE ${where.map((w) => `(${w})`).join(' AND ')} ORDER BY created_at DESC LIMIT ?`, ...args, limit);
    return rows.map(hydrate);
  },
  async summary() {
    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    const open = await db.get(`SELECT CAST(COUNT(*) AS INTEGER) AS n FROM shop_orders WHERE status IN ('paid', 'ready')`);
    const month = await db.get(`SELECT CAST(COUNT(*) AS INTEGER) AS n, COALESCE(SUM(total), 0) AS revenue FROM shop_orders WHERE status IN ('paid', 'ready', 'completed') AND paid_at > ?`, since);
    return { open: open.n, month_orders: month.n, month_revenue: +month.revenue };
  },
};

export const Events = {
  add: (e) => db.run('INSERT INTO shop_events (event_id, order_id, type, detail, staff, at) VALUES (?,?,?,?,?,?)', id(), e.order_id, e.type, e.detail ? JSON.stringify(e.detail) : null, e.staff || null, now()),
  forOrder: (order_id) => db.all('SELECT * FROM shop_events WHERE order_id = ? ORDER BY at', order_id).then((rows) => rows.map((r) => ({ ...r, detail: json(r.detail) }))),
};
