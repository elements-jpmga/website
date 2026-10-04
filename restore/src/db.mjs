// Storage for the Restore app: Supabase Postgres in production (DATABASE_URL), SQLite on a laptop.
// Raw inputs, engine outputs and consultant selections are stored in separate tables, as the spec asks.
import path from 'node:path';
import crypto from 'node:crypto';
import { connect } from './sql.mjs';

export const DATA_DIR = path.resolve(process.env.RESTORE_DATA || 'data');
export const db = await connect({ url: process.env.DATABASE_URL, dataDir: DATA_DIR });

const TABLES = ['rule_sets', 'clients', 'assessments', 'uploads', 'confirmed_readings', 'domain_results', 'priorities', 'program_selections', 'plans', 'reports', 'report_emails'];
await db.exec(`
CREATE TABLE IF NOT EXISTS rule_sets (version TEXT PRIMARY KEY, json TEXT NOT NULL, loaded_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS clients (client_id TEXT PRIMARY KEY, name TEXT NOT NULL, age INTEGER, sex TEXT, contact_ref TEXT, created_at TEXT NOT NULL, email TEXT);
CREATE TABLE IF NOT EXISTS assessments (
  assessment_id TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES clients(client_id), assessed_at TEXT, created_at TEXT NOT NULL, created_by TEXT,
  status TEXT NOT NULL DEFAULT 'uploading', rules_version TEXT
);
CREATE TABLE IF NOT EXISTS uploads (
  upload_id TEXT PRIMARY KEY, assessment_id TEXT NOT NULL REFERENCES assessments(assessment_id), kind TEXT NOT NULL, filename TEXT NOT NULL, stored_path TEXT NOT NULL,
  sha256 TEXT NOT NULL, uploaded_at TEXT NOT NULL, extraction_json TEXT, preview_path TEXT
);
CREATE TABLE IF NOT EXISTS confirmed_readings (
  assessment_id TEXT PRIMARY KEY REFERENCES assessments(assessment_id), stress_index DOUBLE PRECISION, pulse_complexity DOUBLE PRECISION, vascular_age_type TEXT, vascular_age_index DOUBLE PRECISION,
  extracted_json TEXT, corrections_json TEXT, confirmed_by TEXT, confirmed_at TEXT
);
CREATE TABLE IF NOT EXISTS domain_results (
  assessment_id TEXT NOT NULL REFERENCES assessments(assessment_id), domain TEXT NOT NULL, outcome TEXT NOT NULL, severity INTEGER NOT NULL, explanation TEXT, rules_version TEXT,
  PRIMARY KEY (assessment_id, domain)
);
CREATE TABLE IF NOT EXISTS priorities (assessment_id TEXT PRIMARY KEY REFERENCES assessments(assessment_id), priorities_json TEXT NOT NULL, maintain INTEGER NOT NULL, result_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS program_selections (
  assessment_id TEXT NOT NULL REFERENCES assessments(assessment_id), program TEXT NOT NULL, component2 TEXT, component3 TEXT, enhancer INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (assessment_id, program)
);
CREATE TABLE IF NOT EXISTS plans (
  assessment_id TEXT PRIMARY KEY REFERENCES assessments(assessment_id), duration TEXT, frequency TEXT, consultant_notes TEXT, suitability_json TEXT, contraindication_notes TEXT, updated_at TEXT
);
CREATE TABLE IF NOT EXISTS reports (report_id TEXT PRIMARY KEY, assessment_id TEXT NOT NULL REFERENCES assessments(assessment_id), pdf_path TEXT NOT NULL, generated_at TEXT NOT NULL, rules_version TEXT, template_version TEXT);
CREATE TABLE IF NOT EXISTS report_emails (
  email_id TEXT PRIMARY KEY, report_id TEXT NOT NULL REFERENCES reports(report_id), assessment_id TEXT NOT NULL, to_address TEXT NOT NULL, subject TEXT, message TEXT,
  sent_by TEXT, sent_at TEXT NOT NULL, provider TEXT, message_id TEXT, status TEXT NOT NULL, error TEXT, consent INTEGER NOT NULL DEFAULT 0
);
`);
if (db.kind === 'sqlite') {
  try { await db.exec('ALTER TABLE clients ADD COLUMN email TEXT'); } catch {} // databases created before this column existed
} else {
  // Supabase exposes the public schema through its Data API. Only this server (the table owner) may read these tables:
  // row level security with no policies + no grants for the API roles means the Data API sees nothing.
  await db.exec(TABLES.map((t) => `ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;`).join('\n') + `
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN EXECUTE 'REVOKE ALL ON ${TABLES.join(', ')} FROM anon, authenticated'; END IF;
END $$;`);
}

export const id = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
const json = (s) => (s ? JSON.parse(s) : null);

export const Rules = {
  upsert: (rules) => db.run('INSERT INTO rule_sets (version, json, loaded_at) VALUES (?, ?, ?) ON CONFLICT (version) DO UPDATE SET json = excluded.json, loaded_at = excluded.loaded_at', rules.version, JSON.stringify(rules), now()),
  async get(version) { const r = await db.get('SELECT json FROM rule_sets WHERE version = ?', version); return r ? JSON.parse(r.json) : null; },
  list: () => db.all('SELECT version, loaded_at FROM rule_sets ORDER BY loaded_at DESC'),
};

export const Clients = {
  async create({ name, age, sex, contact_ref, email }) {
    const c = { client_id: id(), name: name.trim(), age: age ?? null, sex: sex ?? null, contact_ref: contact_ref ?? null, created_at: now(), email: email?.trim() || null };
    await db.run('INSERT INTO clients (client_id, name, age, sex, contact_ref, created_at, email) VALUES (?,?,?,?,?,?,?)', c.client_id, c.name, c.age, c.sex, c.contact_ref, c.created_at, c.email);
    return c;
  },
  get: (client_id) => db.get('SELECT * FROM clients WHERE client_id = ?', client_id),
  update: (client_id, { name, age, sex, email }) => db.run('UPDATE clients SET name = COALESCE(?, name), age = COALESCE(?, age), sex = COALESCE(?, sex), email = COALESCE(?, email) WHERE client_id = ?', name ?? null, age ?? null, sex ?? null, email ?? null, client_id),
  search: (term = '') => db.all(`SELECT c.*, CAST((SELECT COUNT(*) FROM assessments a WHERE a.client_id = c.client_id) AS INTEGER) AS assessments, (SELECT MAX(created_at) FROM assessments a WHERE a.client_id = c.client_id) AS last_assessment
    FROM clients c WHERE LOWER(c.name) LIKE ? ORDER BY last_assessment DESC, c.created_at DESC LIMIT 100`, `%${term.toLowerCase()}%`),
};

export const Assessments = {
  async create(client_id, created_by) {
    const a = { assessment_id: id(), client_id, created_at: now(), created_by: created_by || 'staff', status: 'uploading' };
    await db.run('INSERT INTO assessments (assessment_id, client_id, created_at, created_by, status) VALUES (?,?,?,?,?)', a.assessment_id, client_id, a.created_at, a.created_by, a.status);
    return a;
  },
  get: (assessment_id) => db.get('SELECT a.*, c.name AS client_name, c.age AS client_age, c.sex AS client_sex FROM assessments a JOIN clients c USING (client_id) WHERE assessment_id = ?', assessment_id),
  setStatus: (assessment_id, status) => db.run('UPDATE assessments SET status = ? WHERE assessment_id = ?', status, assessment_id),
  setAssessedAt: (assessment_id, iso) => db.run('UPDATE assessments SET assessed_at = COALESCE(?, assessed_at) WHERE assessment_id = ?', iso, assessment_id),
  setRules: (assessment_id, version) => db.run('UPDATE assessments SET rules_version = ? WHERE assessment_id = ?', version, assessment_id),
  list({ client_id, limit = 50 } = {}) {
    return db.all(`SELECT a.*, c.name AS client_name, c.age AS client_age, c.email AS client_email, p.priorities_json, p.maintain,
      CAST((SELECT COUNT(*) FROM reports r WHERE r.assessment_id = a.assessment_id) AS INTEGER) AS reports,
      CAST((SELECT COUNT(*) FROM uploads u WHERE u.assessment_id = a.assessment_id) AS INTEGER) AS uploads,
      CAST((SELECT COUNT(*) FROM report_emails e WHERE e.assessment_id = a.assessment_id AND e.status != 'failed') AS INTEGER) AS emails,
      (SELECT MAX(e.sent_at) FROM report_emails e WHERE e.assessment_id = a.assessment_id) AS last_email_at
      FROM assessments a JOIN clients c USING (client_id) LEFT JOIN priorities p USING (assessment_id) ${client_id ? 'WHERE a.client_id = ?' : ''} ORDER BY a.created_at DESC LIMIT ?`, ...(client_id ? [client_id, limit] : [limit]));
  },
  async full(assessment_id) {
    const a = await this.get(assessment_id); if (!a) return null;
    const [client, uploads, readings, pr, selections, plan, reports, emails] = await Promise.all([
      Clients.get(a.client_id),
      db.all('SELECT upload_id, kind, filename, uploaded_at, extraction_json, preview_path FROM uploads WHERE assessment_id = ? ORDER BY uploaded_at', assessment_id),
      db.get('SELECT * FROM confirmed_readings WHERE assessment_id = ?', assessment_id),
      db.get('SELECT * FROM priorities WHERE assessment_id = ?', assessment_id),
      db.all('SELECT * FROM program_selections WHERE assessment_id = ? ORDER BY program', assessment_id),
      db.get('SELECT * FROM plans WHERE assessment_id = ?', assessment_id),
      db.all('SELECT report_id, generated_at, rules_version, template_version FROM reports WHERE assessment_id = ? ORDER BY generated_at DESC', assessment_id),
      db.all('SELECT email_id, report_id, to_address, subject, sent_by, sent_at, provider, status, error FROM report_emails WHERE assessment_id = ? ORDER BY sent_at DESC', assessment_id),
    ]);
    a.client_email = client?.email || null;
    return {
      ...a,
      uploads: uploads.map(({ extraction_json, ...u }) => ({ ...u, extraction: json(extraction_json) })),
      readings: readings ? { ...readings, extracted: json(readings.extracted_json), corrections: json(readings.corrections_json) || [] } : null,
      result: pr ? JSON.parse(pr.result_json) : null,
      selections: [...selections],
      plan: plan ? { ...plan, suitability: json(plan.suitability_json) || {} } : null,
      reports: [...reports],
      emails: [...emails],
    };
  },
};

export const Uploads = {
  add: (u) => db.run('INSERT INTO uploads (upload_id, assessment_id, kind, filename, stored_path, sha256, uploaded_at, extraction_json, preview_path) VALUES (?,?,?,?,?,?,?,?,?)', u.upload_id, u.assessment_id, u.kind, u.filename, u.stored_path, u.sha256, u.uploaded_at, JSON.stringify(u.extraction || null), u.preview_path || null),
  get: (upload_id) => db.get('SELECT * FROM uploads WHERE upload_id = ?', upload_id),
};

export const Readings = {
  confirm: (assessment_id, r, extracted, corrections, confirmed_by) => db.run(`INSERT INTO confirmed_readings (assessment_id, stress_index, pulse_complexity, vascular_age_type, vascular_age_index, extracted_json, corrections_json, confirmed_by, confirmed_at)
    VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT (assessment_id) DO UPDATE SET stress_index = excluded.stress_index, pulse_complexity = excluded.pulse_complexity, vascular_age_type = excluded.vascular_age_type,
    vascular_age_index = excluded.vascular_age_index, extracted_json = excluded.extracted_json, corrections_json = excluded.corrections_json, confirmed_by = excluded.confirmed_by, confirmed_at = excluded.confirmed_at`,
    assessment_id, r.stress_index, r.pulse_complexity, r.vascular_age_type, r.vascular_age_index, JSON.stringify(extracted || null), JSON.stringify(corrections || []), confirmed_by || 'staff', now()),
};

export const Results = {
  async save(assessment_id, result) {
    await db.run('DELETE FROM domain_results WHERE assessment_id = ?', assessment_id);
    for (const d of result.domains) await db.run('INSERT INTO domain_results (assessment_id, domain, outcome, severity, explanation, rules_version) VALUES (?,?,?,?,?,?)', assessment_id, d.id, d.outcome, d.severity, d.explanation, result.rulesVersion);
    await db.run('INSERT INTO priorities (assessment_id, priorities_json, maintain, result_json) VALUES (?,?,?,?) ON CONFLICT (assessment_id) DO UPDATE SET priorities_json = excluded.priorities_json, maintain = excluded.maintain, result_json = excluded.result_json',
      assessment_id, JSON.stringify(result.priorities), result.maintain ? 1 : 0, JSON.stringify(result));
    // Reset selections to the new program list, keeping choices where the program still applies
    const existing = Object.fromEntries((await db.all('SELECT * FROM program_selections WHERE assessment_id = ?', assessment_id)).map((s) => [s.program, s]));
    await db.run('DELETE FROM program_selections WHERE assessment_id = ?', assessment_id);
    for (const p of result.programs) await db.run('INSERT INTO program_selections (assessment_id, program, component2, component3, enhancer) VALUES (?,?,?,?,?)', assessment_id, p, existing[p]?.component2 || null, existing[p]?.component3 || null, existing[p]?.enhancer || 0);
    await db.run('INSERT INTO plans (assessment_id, duration, frequency, updated_at) VALUES (?,?,?,?) ON CONFLICT (assessment_id) DO UPDATE SET duration = excluded.duration, frequency = excluded.frequency, updated_at = excluded.updated_at', assessment_id, result.plan.duration, result.plan.frequency, now());
  },
};

export const Selections = {
  set: (assessment_id, program, { component2, component3, enhancer }) => db.run('UPDATE program_selections SET component2 = ?, component3 = ?, enhancer = ? WHERE assessment_id = ? AND program = ?', component2 || null, component3 || null, enhancer ? 1 : 0, assessment_id, program),
};

export const Plans = {
  notes: (assessment_id, { consultant_notes, suitability, contraindication_notes }) => db.run('UPDATE plans SET consultant_notes = ?, suitability_json = ?, contraindication_notes = ?, updated_at = ? WHERE assessment_id = ?', consultant_notes ?? null, JSON.stringify(suitability || {}), contraindication_notes ?? null, now(), assessment_id),
};

export const Reports = {
  add: (r) => db.run('INSERT INTO reports (report_id, assessment_id, pdf_path, generated_at, rules_version, template_version) VALUES (?,?,?,?,?,?)', r.report_id, r.assessment_id, r.pdf_path, r.generated_at, r.rules_version, r.template_version),
  get: (report_id) => db.get('SELECT * FROM reports WHERE report_id = ?', report_id),
};

export const Emails = {
  add: (e) => db.run('INSERT INTO report_emails (email_id, report_id, assessment_id, to_address, subject, message, sent_by, sent_at, provider, message_id, status, error, consent) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
    e.email_id, e.report_id, e.assessment_id, e.to_address, e.subject, e.message, e.sent_by, e.sent_at, e.provider || null, e.message_id || null, e.status, e.error || null, e.consent ? 1 : 0),
};

// Activity feed for the staff inbox: every upload, confirmation, report and email, newest first
export const Activity = {
  feed: (limit = 40) => db.all(`SELECT * FROM (
      SELECT 'created' AS kind, a.created_at AS at, a.created_by AS who, a.assessment_id, c.name AS client, CAST(NULL AS TEXT) AS detail FROM assessments a JOIN clients c USING (client_id)
      UNION ALL SELECT 'upload', u.uploaded_at, a.created_by, u.assessment_id, c.name, u.kind FROM uploads u JOIN assessments a USING (assessment_id) JOIN clients c USING (client_id)
      UNION ALL SELECT 'confirmed', r.confirmed_at, r.confirmed_by, r.assessment_id, c.name, NULL FROM confirmed_readings r JOIN assessments a USING (assessment_id) JOIN clients c USING (client_id)
      UNION ALL SELECT 'report', rp.generated_at, a.created_by, rp.assessment_id, c.name, NULL FROM reports rp JOIN assessments a USING (assessment_id) JOIN clients c USING (client_id)
      UNION ALL SELECT 'email', e.sent_at, e.sent_by, e.assessment_id, c.name, e.status || '|' || e.to_address FROM report_emails e JOIN assessments a USING (assessment_id) JOIN clients c USING (client_id)
    ) AS feed WHERE at IS NOT NULL ORDER BY at DESC LIMIT ?`, limit),
};
