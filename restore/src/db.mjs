// SQLite storage (Node's built-in node:sqlite). Raw inputs, engine outputs and
// consultant selections are stored in separate tables, as the spec asks.
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const DATA_DIR = path.resolve(process.env.RESTORE_DATA || 'data');
fs.mkdirSync(path.join(DATA_DIR, 'uploads'), { recursive: true });
fs.mkdirSync(path.join(DATA_DIR, 'reports'), { recursive: true });

export const db = new DatabaseSync(path.join(DATA_DIR, 'restore.sqlite'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
db.exec(`
CREATE TABLE IF NOT EXISTS rule_sets (version TEXT PRIMARY KEY, json TEXT NOT NULL, loaded_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS clients (client_id TEXT PRIMARY KEY, name TEXT NOT NULL, age INTEGER, sex TEXT, contact_ref TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS assessments (
  assessment_id TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES clients(client_id), assessed_at TEXT, created_at TEXT NOT NULL, created_by TEXT,
  status TEXT NOT NULL DEFAULT 'uploading', rules_version TEXT
);
CREATE TABLE IF NOT EXISTS uploads (
  upload_id TEXT PRIMARY KEY, assessment_id TEXT NOT NULL REFERENCES assessments(assessment_id), kind TEXT NOT NULL, filename TEXT NOT NULL, stored_path TEXT NOT NULL,
  sha256 TEXT NOT NULL, uploaded_at TEXT NOT NULL, extraction_json TEXT, preview_path TEXT
);
CREATE TABLE IF NOT EXISTS confirmed_readings (
  assessment_id TEXT PRIMARY KEY REFERENCES assessments(assessment_id), stress_index REAL, pulse_complexity REAL, vascular_age_type TEXT, vascular_age_index REAL,
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
// Migrations for databases created before these columns existed
for (const sql of ['ALTER TABLE clients ADD COLUMN email TEXT']) { try { db.exec(sql); } catch {} }

export const id = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
const q = (sql) => db.prepare(sql);

export const Rules = {
  upsert(rules) { q('INSERT OR REPLACE INTO rule_sets (version, json, loaded_at) VALUES (?, ?, ?)').run(rules.version, JSON.stringify(rules), now()); },
  get(version) { const r = q('SELECT json FROM rule_sets WHERE version = ?').get(version); return r ? JSON.parse(r.json) : null; },
  list() { return q('SELECT version, loaded_at FROM rule_sets ORDER BY loaded_at DESC').all(); },
};

export const Clients = {
  create({ name, age, sex, contact_ref, email }) { const c = { client_id: id(), name: name.trim(), age: age ?? null, sex: sex ?? null, contact_ref: contact_ref ?? null, created_at: now(), email: email?.trim() || null }; q('INSERT INTO clients (client_id, name, age, sex, contact_ref, created_at, email) VALUES (?,?,?,?,?,?,?)').run(c.client_id, c.name, c.age, c.sex, c.contact_ref, c.created_at, c.email); return c; },
  get(client_id) { return q('SELECT * FROM clients WHERE client_id = ?').get(client_id); },
  update(client_id, { name, age, sex, email }) { q('UPDATE clients SET name = COALESCE(?, name), age = COALESCE(?, age), sex = COALESCE(?, sex), email = COALESCE(?, email) WHERE client_id = ?').run(name ?? null, age ?? null, sex ?? null, email ?? null, client_id); },
  search(term = '') { return q(`SELECT c.*, (SELECT COUNT(*) FROM assessments a WHERE a.client_id = c.client_id) AS assessments, (SELECT MAX(created_at) FROM assessments a WHERE a.client_id = c.client_id) AS last_assessment FROM clients c WHERE c.name LIKE ? ORDER BY last_assessment DESC, c.created_at DESC LIMIT 100`).all(`%${term}%`); },
};

export const Assessments = {
  create(client_id, created_by) { const a = { assessment_id: id(), client_id, created_at: now(), created_by: created_by || 'staff', status: 'uploading' }; q('INSERT INTO assessments (assessment_id, client_id, created_at, created_by, status) VALUES (?,?,?,?,?)').run(a.assessment_id, client_id, a.created_at, a.created_by, a.status); return a; },
  get(assessment_id) { return q('SELECT a.*, c.name AS client_name, c.age AS client_age, c.sex AS client_sex FROM assessments a JOIN clients c USING (client_id) WHERE assessment_id = ?').get(assessment_id); },
  setStatus(assessment_id, status) { q('UPDATE assessments SET status = ? WHERE assessment_id = ?').run(status, assessment_id); },
  setAssessedAt(assessment_id, iso) { q('UPDATE assessments SET assessed_at = COALESCE(?, assessed_at) WHERE assessment_id = ?').run(iso, assessment_id); },
  setRules(assessment_id, version) { q('UPDATE assessments SET rules_version = ? WHERE assessment_id = ?').run(version, assessment_id); },
  list({ client_id, limit = 50 } = {}) {
    return q(`SELECT a.*, c.name AS client_name, c.age AS client_age, c.email AS client_email, p.priorities_json, p.maintain,
      (SELECT COUNT(*) FROM reports r WHERE r.assessment_id = a.assessment_id) AS reports,
      (SELECT COUNT(*) FROM uploads u WHERE u.assessment_id = a.assessment_id) AS uploads,
      (SELECT COUNT(*) FROM report_emails e WHERE e.assessment_id = a.assessment_id AND e.status != 'failed') AS emails,
      (SELECT MAX(e.sent_at) FROM report_emails e WHERE e.assessment_id = a.assessment_id) AS last_email_at
      FROM assessments a JOIN clients c USING (client_id) LEFT JOIN priorities p USING (assessment_id) ${client_id ? 'WHERE a.client_id = ?' : ''} ORDER BY a.created_at DESC LIMIT ?`).all(...(client_id ? [client_id, limit] : [limit]));
  },
  full(assessment_id) {
    const a = this.get(assessment_id); if (!a) return null;
    const client = Clients.get(a.client_id); a.client_email = client?.email || null;
    const uploads = q('SELECT upload_id, kind, filename, uploaded_at, extraction_json, preview_path FROM uploads WHERE assessment_id = ? ORDER BY uploaded_at').all(assessment_id).map((u) => ({ ...u, extraction: u.extraction_json ? JSON.parse(u.extraction_json) : null, extraction_json: undefined }));
    const readings = q('SELECT * FROM confirmed_readings WHERE assessment_id = ?').get(assessment_id);
    const pr = q('SELECT * FROM priorities WHERE assessment_id = ?').get(assessment_id);
    const selections = q('SELECT * FROM program_selections WHERE assessment_id = ?').all(assessment_id);
    const plan = q('SELECT * FROM plans WHERE assessment_id = ?').get(assessment_id);
    const reports = q('SELECT report_id, generated_at, rules_version, template_version FROM reports WHERE assessment_id = ? ORDER BY generated_at DESC').all(assessment_id);
    const emails = q('SELECT email_id, report_id, to_address, subject, sent_by, sent_at, provider, status, error FROM report_emails WHERE assessment_id = ? ORDER BY sent_at DESC').all(assessment_id);
    return { ...a, uploads, readings: readings ? { ...readings, extracted: readings.extracted_json ? JSON.parse(readings.extracted_json) : null, corrections: readings.corrections_json ? JSON.parse(readings.corrections_json) : [] } : null, result: pr ? JSON.parse(pr.result_json) : null, selections, plan: plan ? { ...plan, suitability: plan.suitability_json ? JSON.parse(plan.suitability_json) : {} } : null, reports, emails };
  },
};

export const Uploads = {
  add(u) { q('INSERT INTO uploads (upload_id, assessment_id, kind, filename, stored_path, sha256, uploaded_at, extraction_json, preview_path) VALUES (?,?,?,?,?,?,?,?,?)').run(u.upload_id, u.assessment_id, u.kind, u.filename, u.stored_path, u.sha256, u.uploaded_at, JSON.stringify(u.extraction || null), u.preview_path || null); },
  get(upload_id) { return q('SELECT * FROM uploads WHERE upload_id = ?').get(upload_id); },
  forAssessment(assessment_id) { return q('SELECT * FROM uploads WHERE assessment_id = ? ORDER BY uploaded_at').all(assessment_id); },
};

export const Readings = {
  confirm(assessment_id, r, extracted, corrections, confirmed_by) {
    q('INSERT OR REPLACE INTO confirmed_readings VALUES (?,?,?,?,?,?,?,?,?)').run(assessment_id, r.stress_index, r.pulse_complexity, r.vascular_age_type, r.vascular_age_index, JSON.stringify(extracted || null), JSON.stringify(corrections || []), confirmed_by || 'staff', now());
  },
};

export const Results = {
  save(assessment_id, result) {
    const del = q('DELETE FROM domain_results WHERE assessment_id = ?'); del.run(assessment_id);
    const ins = q('INSERT INTO domain_results VALUES (?,?,?,?,?,?)');
    for (const d of result.domains) ins.run(assessment_id, d.id, d.outcome, d.severity, d.explanation, result.rulesVersion);
    q('INSERT OR REPLACE INTO priorities VALUES (?,?,?,?)').run(assessment_id, JSON.stringify(result.priorities), result.maintain ? 1 : 0, JSON.stringify(result));
    // Reset selections to the new program list, keeping choices where the program still applies
    const existing = Object.fromEntries(q('SELECT * FROM program_selections WHERE assessment_id = ?').all(assessment_id).map((s) => [s.program, s]));
    q('DELETE FROM program_selections WHERE assessment_id = ?').run(assessment_id);
    const insSel = q('INSERT INTO program_selections VALUES (?,?,?,?,?)');
    for (const p of result.programs) insSel.run(assessment_id, p, existing[p]?.component2 || null, existing[p]?.component3 || null, existing[p]?.enhancer || 0);
    q('INSERT INTO plans (assessment_id, duration, frequency, updated_at) VALUES (?,?,?,?) ON CONFLICT(assessment_id) DO UPDATE SET duration = excluded.duration, frequency = excluded.frequency, updated_at = excluded.updated_at').run(assessment_id, result.plan.duration, result.plan.frequency, now());
  },
};

export const Selections = {
  set(assessment_id, program, { component2, component3, enhancer }) {
    q('UPDATE program_selections SET component2 = ?, component3 = ?, enhancer = ? WHERE assessment_id = ? AND program = ?').run(component2 || null, component3 || null, enhancer ? 1 : 0, assessment_id, program);
  },
};

export const Plans = {
  notes(assessment_id, { consultant_notes, suitability, contraindication_notes }) {
    q('UPDATE plans SET consultant_notes = ?, suitability_json = ?, contraindication_notes = ?, updated_at = ? WHERE assessment_id = ?').run(consultant_notes ?? null, JSON.stringify(suitability || {}), contraindication_notes ?? null, now(), assessment_id);
  },
};

export const Reports = {
  add(r) { q('INSERT INTO reports VALUES (?,?,?,?,?,?)').run(r.report_id, r.assessment_id, r.pdf_path, r.generated_at, r.rules_version, r.template_version); },
  get(report_id) { return q('SELECT * FROM reports WHERE report_id = ?').get(report_id); },
};

export const Emails = {
  add(e) { q('INSERT INTO report_emails VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(e.email_id, e.report_id, e.assessment_id, e.to_address, e.subject, e.message, e.sent_by, e.sent_at, e.provider || null, e.message_id || null, e.status, e.error || null, e.consent ? 1 : 0); },
};

// Activity feed for the staff inbox: every upload, confirmation, report and email, newest first
export const Activity = {
  feed(limit = 40) {
    return q(`SELECT * FROM (
      SELECT 'created' AS kind, a.created_at AS at, a.created_by AS who, a.assessment_id, c.name AS client, NULL AS detail FROM assessments a JOIN clients c USING (client_id)
      UNION ALL SELECT 'upload', u.uploaded_at, a.created_by, u.assessment_id, c.name, u.kind FROM uploads u JOIN assessments a USING (assessment_id) JOIN clients c USING (client_id)
      UNION ALL SELECT 'confirmed', r.confirmed_at, r.confirmed_by, r.assessment_id, c.name, NULL FROM confirmed_readings r JOIN assessments a USING (assessment_id) JOIN clients c USING (client_id)
      UNION ALL SELECT 'report', rp.generated_at, a.created_by, rp.assessment_id, c.name, NULL FROM reports rp JOIN assessments a USING (assessment_id) JOIN clients c USING (client_id)
      UNION ALL SELECT 'email', e.sent_at, e.sent_by, e.assessment_id, c.name, e.status || '|' || e.to_address FROM report_emails e JOIN assessments a USING (assessment_id) JOIN clients c USING (client_id)
    ) WHERE at IS NOT NULL ORDER BY at DESC LIMIT ?`).all(limit);
  },
};
