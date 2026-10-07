// Elements Restore — staff web app server (Node ≥ 22, no framework).
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { db, DATA_DIR, id, now, Rules, Clients, Assessments, Uploads, Readings, Results, Selections, Plans, Reports, Emails, Activity } from './src/db.mjs';
import * as files from './src/files.mjs';
import * as auth from './src/auth.mjs';
import * as ai from './src/ai.mjs';
import { sendReportEmail, reportEmailHtml, provider as mailProvider } from './src/mail.mjs';
import { evaluate, validateReadings } from './src/engine.mjs';
import { extractUbio, ocrEngine } from './src/extract.mjs';
import { reportHtml, htmlToPdf, TEMPLATE_VERSION } from './src/report.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = +process.env.PORT || 4400;
const PUBLIC = path.join(here, 'public');
const PROD = process.env.NODE_ENV === 'production';

// Online, client health data must sit behind staff sign-in, in Postgres and private storage — refuse to start otherwise.
if (PROD) {
  const missing = [!auth.enabled && 'SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY (staff sign-in)', db.kind !== 'postgres' && 'DATABASE_URL (Supabase Postgres)', !files.remote && 'SUPABASE_SECRET_KEY (private file storage)'].filter(Boolean);
  if (missing.length) { console.error('Refusing to start in production. Missing: ' + missing.join('; ')); process.exit(1); }
}
await files.ensureBucket();

// Load rule sets from /rules into the versioned config table; the newest file is the active version.
const ruleFiles = fs.readdirSync(path.join(here, 'rules')).filter((f) => f.endsWith('.json')).sort();
let activeRules = null;
for (const f of ruleFiles) { const r = JSON.parse(fs.readFileSync(path.join(here, 'rules', f), 'utf8')); await Rules.upsert(r); activeRules = r; }
const rulesFor = async (assessment) => (assessment?.rules_version && await Rules.get(assessment.rules_version)) || activeRules;

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.pdf': 'application/pdf', '.json': 'application/json', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const send = (res, code, body, headers = {}) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers }); res.end(JSON.stringify(body)); };
const err = (res, code, message, extra = {}) => send(res, code, { error: message, ...extra });
const MAX_BODY = 26 * 1024 * 1024;
const readBody = (req) => new Promise((resolve, reject) => { const chunks = []; let n = 0; req.on('data', (c) => { n += c.length; if (n > MAX_BODY) { reject(Object.assign(new Error('Upload is larger than 25 MB'), { status: 413 })); req.destroy(); } else chunks.push(c); }); req.on('end', () => resolve(Buffer.concat(chunks))); req.on('error', reject); });
const json = async (req) => { const b = await readBody(req); return b.length ? JSON.parse(b.toString('utf8')) : {}; };
// The signed-in staff member's name is recorded on every action (typed name when sign-in is off, on a laptop).
const staff = (req) => (req.staff?.name || decodeURIComponent((req.headers['x-staff'] || 'staff').toString())).slice(0, 80);
const sendFile = (res, buf, type, name) => { res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'private, no-store', ...(name ? { 'Content-Disposition': `inline; filename="${name}"` } : {}) }); res.end(buf); };

const routes = [];
const route = (method, pattern, handler, opts = {}) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '/?$'), handler, ...opts });

/* ---------- Health + sign-in (no session needed) ---------- */
route('GET', '/healthz', async (req, res) => { await db.get('SELECT 1 AS ok'); send(res, 200, { ok: true }); }, { open: true });
route('GET', '/api/auth/me', async (req, res) => {
  if (!auth.enabled) return send(res, 200, { authEnabled: false, staff: null });
  const s = await auth.currentStaff(req, res);
  send(res, 200, { authEnabled: true, staff: s });
}, { open: true });
route('POST', '/api/auth/login', async (req, res) => {
  if (!auth.enabled) return err(res, 400, 'Sign-in is not configured on this server');
  const b = await json(req); const r = await auth.login(req, res, b);
  r.staff ? send(res, 200, { staff: r.staff }) : err(res, r.status, r.error);
}, { open: true });
route('POST', '/api/auth/logout', async (req, res) => { if (auth.enabled) await auth.logout(req, res); send(res, 200, { ok: true }); }, { open: true });
route('POST', '/api/auth/password', async (req, res) => { const b = await json(req); const r = await auth.changePassword(req, b.password); r.status === 200 ? send(res, 200, { ok: true }) : err(res, r.status, r.error); });

/* ---------- Config ---------- */
route('GET', '/api/config', async (req, res) => send(res, 200, { rules: activeRules, rulesVersions: await Rules.list(), templateVersion: TEMPLATE_VERSION, mailProvider: mailProvider(), ocrEngine, storage: files.storageKind, database: db.kind, ai: { enabled: ai.enabled, model: ai.enabled ? ai.model : null } }));

/* ---------- Clients ---------- */
route('GET', '/api/clients', async (req, res, { url }) => send(res, 200, await Clients.search(url.searchParams.get('q') || '')));
route('POST', '/api/clients', async (req, res) => { const b = await json(req); if (!b.name?.trim()) return err(res, 400, 'Name is required'); send(res, 201, await Clients.create({ name: b.name, age: b.age ? +b.age : null, sex: b.sex || null, contact_ref: b.contact_ref || null, email: b.email || null })); });
route('GET', '/api/clients/:client_id', async (req, res, { params }) => { const c = await Clients.get(params.client_id); if (!c) return err(res, 404, 'Client not found'); send(res, 200, { ...c, assessments: await Assessments.list({ client_id: c.client_id }) }); });

/* ---------- Assessments ---------- */
route('GET', '/api/activity', async (req, res) => send(res, 200, await Activity.feed(60)));
route('GET', '/api/assessments', async (req, res) => send(res, 200, await Assessments.list({ limit: 200 })));
route('POST', '/api/assessments', async (req, res) => { const b = await json(req); if (!await Clients.get(b.client_id)) return err(res, 400, 'Unknown client'); const a = await Assessments.create(b.client_id, staff(req)); send(res, 201, await Assessments.full(a.assessment_id)); });
route('GET', '/api/assessments/:aid', async (req, res, { params }) => { const a = await Assessments.full(params.aid); a ? send(res, 200, a) : err(res, 404, 'Assessment not found'); });

// Upload: raw PDF bytes in the body; kind in x-kind (stress|vascular|auto), filename in x-filename.
// Originals are kept unchanged (never overwritten) with their SHA-256.
route('POST', '/api/assessments/:aid/uploads', async (req, res, { params }) => {
  const a = await Assessments.get(params.aid); if (!a) return err(res, 404, 'Assessment not found');
  const buf = await readBody(req);
  if (!buf.length || buf.subarray(0, 4).toString() !== '%PDF') return err(res, 400, 'Please upload a PDF file');
  const filename = decodeURIComponent((req.headers['x-filename'] || 'ubio.pdf').toString()).replace(/[^\w.\- ()]/g, '_');
  const upload_id = id();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'restore-'));
  const tmpPdf = path.join(tmp, 'in.pdf'), tmpPng = path.join(tmp, 'page.png');
  fs.writeFileSync(tmpPdf, buf);
  let extraction, previewKey = null;
  try {
    try { extraction = await extractUbio(tmpPdf, tmpPng, ai.enabled ? { aiRead: ai.readUbio, merge: ai.mergeReadings } : {}); }
    catch (e) { console.error('extraction failed:', e.message); extraction = { kind: 'unknown', fields: {}, error: e.message }; }
    const stored = await files.put(`uploads/${a.assessment_id}/${upload_id}.pdf`, buf, 'application/pdf');
    if (fs.existsSync(tmpPng)) previewKey = await files.put(`uploads/${a.assessment_id}/${upload_id}.png`, fs.readFileSync(tmpPng), 'image/png');
    const kindHeader = (req.headers['x-kind'] || 'auto').toString();
    const kind = kindHeader !== 'auto' ? kindHeader : extraction.kind;
    if (kindHeader !== 'auto' && extraction.kind !== 'unknown' && extraction.kind !== kindHeader) extraction.warning = `This file looks like a ${extraction.kind} report but was uploaded as ${kindHeader}.`;
    await Uploads.add({ upload_id, assessment_id: a.assessment_id, kind, filename, stored_path: stored, sha256: crypto.createHash('sha256').update(buf).digest('hex'), uploaded_at: now(), extraction, preview_path: previewKey });
    const f = extraction.fields || {};
    if (f.assessed_at?.value) await Assessments.setAssessedAt(a.assessment_id, f.assessed_at.value);
    if (f.age?.value && !a.client_age) await Clients.update(a.client_id, { age: f.age.value });
    if (f.sex?.value && !a.client_sex) await Clients.update(a.client_id, { sex: f.sex.value });
    await Assessments.setStatus(a.assessment_id, 'extracted');
    send(res, 201, { upload_id, kind, filename, extraction });
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
route('GET', '/api/uploads/:uid/file', async (req, res, { params }) => { const u = await Uploads.get(params.uid); const buf = u && await files.get(u.stored_path); if (!buf) return err(res, 404, 'Not found'); sendFile(res, buf, 'application/pdf', u.filename); });
route('GET', '/api/uploads/:uid/preview', async (req, res, { params }) => { const u = await Uploads.get(params.uid); const buf = u?.preview_path && await files.get(u.preview_path); if (!buf) return err(res, 404, 'No preview'); sendFile(res, buf, 'image/png'); });

// Confirm readings → run engine. The engine never runs without this explicit confirmation.
route('POST', '/api/assessments/:aid/confirm', async (req, res, { params }) => {
  const a = await Assessments.get(params.aid); if (!a) return err(res, 404, 'Assessment not found');
  const b = await json(req);
  const v = validateReadings(b.readings || {});
  if (!v.ok) return err(res, 422, 'Please correct the highlighted readings', { errors: v.errors });
  if (b.confirmed !== true) return err(res, 400, 'Readings must be explicitly confirmed');
  const rules = activeRules;
  await Readings.confirm(a.assessment_id, v.clean, b.extracted || null, b.corrections || [], staff(req));
  if (b.assessed_at) await Assessments.setAssessedAt(a.assessment_id, b.assessed_at);
  if (b.client) await Clients.update(a.client_id, { name: b.client.name || null, age: b.client.age ? +b.client.age : null, sex: b.client.sex || null, email: b.client.email || null });
  const result = evaluate(v.clean, rules);
  await Results.save(a.assessment_id, result);
  await Assessments.setRules(a.assessment_id, rules.version);
  await Assessments.setStatus(a.assessment_id, 'calculated');
  send(res, 200, await Assessments.full(a.assessment_id));
});

// Consultant selections: only the permitted OR-options; enhancer optional. Scores are untouched.
route('PUT', '/api/assessments/:aid/selections/:program', async (req, res, { params }) => {
  const a = await Assessments.full(params.aid); if (!a?.result) return err(res, 400, 'Run the engine first');
  const rules = await rulesFor(a); const prog = rules.programs[params.program];
  if (!prog || !a.result.programs.includes(params.program)) return err(res, 400, 'Program is not part of this assessment');
  const b = await json(req);
  const ok2 = !b.component2 || prog.components[1].options.includes(b.component2);
  const ok3 = !b.component3 || prog.components[2].options.includes(b.component3);
  if (!ok2 || !ok3) return err(res, 422, 'Only the permitted OR-options can be selected');
  await Selections.set(a.assessment_id, params.program, { component2: b.component2, component3: b.component3, enhancer: !!b.enhancer });
  send(res, 200, await Assessments.full(a.assessment_id));
});

route('PUT', '/api/assessments/:aid/notes', async (req, res, { params }) => {
  const a = await Assessments.full(params.aid); if (!a?.result) return err(res, 400, 'Run the engine first');
  const b = await json(req);
  await Plans.notes(a.assessment_id, { consultant_notes: b.consultant_notes || '', suitability: b.suitability || {}, contraindication_notes: b.contraindication_notes || '' });
  send(res, 200, await Assessments.full(a.assessment_id));
});

// AI writing help: returns a draft for staff to edit; nothing is saved or sent from here.
const aiDraft = (fn) => async (req, res, { params }) => {
  if (!ai.enabled) return err(res, 400, 'AI is not set up on this server (add OPENAI_API_KEY)');
  const a = await Assessments.full(params.aid); if (!a?.result) return err(res, 400, 'Run the engine first');
  try { send(res, 200, { text: await fn(a, await rulesFor(a)), model: ai.model }); }
  catch (e) { console.error('AI draft failed:', e.message); err(res, 502, 'AI could not write a draft right now: ' + e.message); }
};
route('POST', '/api/assessments/:aid/ai/notes', aiDraft(ai.draftNotes));
route('POST', '/api/assessments/:aid/ai/email', aiDraft(ai.draftEmail));

// Report: HTML preview + PDF generation (saved to the client record, re-downloadable)
route('GET', '/api/assessments/:aid/report.html', async (req, res, { params, url }) => {
  const a = await Assessments.full(params.aid); if (!a?.result) return err(res, 400, 'Run the engine first');
  let html = reportHtml({ assessment: a, rules: await rulesFor(a), selections: a.selections, plan: a.plan });
  if (url.searchParams.get('screen')) {
    // On-screen viewing: grey desk, each page as a sheet, whole page scaled to fit the frame width
    html = html.replace('</head>', `<style>
html { background: #e9e9ee; } body { background: #e9e9ee; padding: 18px 0 24px; }
.page { margin: 0 auto 18px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 10px 30px rgba(0,0,0,.10); }
</style><script>
function fit() { if (!document.body) return; const w = document.documentElement.clientWidth - 36; const z = Math.min(1.6, w / 816); document.body.style.zoom = z; }
addEventListener("DOMContentLoaded", fit); addEventListener("load", fit); addEventListener("resize", fit);
</script></head>`);
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(html);
});
route('POST', '/api/assessments/:aid/report', async (req, res, { params }) => {
  const a = await Assessments.full(params.aid); if (!a?.result) return err(res, 400, 'Run the engine first');
  const rules = await rulesFor(a);
  const report_id = id();
  let pdf;
  try { pdf = await htmlToPdf(reportHtml({ assessment: a, rules, selections: a.selections, plan: a.plan })); }
  catch (e) { console.error(e); return err(res, 500, 'PDF generation failed: ' + e.message); }
  const key = await files.put(`reports/${a.assessment_id}/${report_id}.pdf`, pdf, 'application/pdf');
  await Reports.add({ report_id, assessment_id: a.assessment_id, pdf_path: key, generated_at: now(), rules_version: rules.version, template_version: TEMPLATE_VERSION });
  await Assessments.setStatus(a.assessment_id, 'reported');
  send(res, 201, { report_id, ...await Assessments.full(a.assessment_id) });
});
// Email the generated PDF to the client. Staff-only; the client receives the PDF as an attachment and nothing else.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
route('POST', '/api/reports/:rid/email', async (req, res, { params }) => {
  const r = await Reports.get(params.rid); if (!r) return err(res, 404, 'Report not found');
  const a = await Assessments.full(r.assessment_id);
  const b = await json(req);
  const to = (b.to || '').trim();
  if (!EMAIL_RE.test(to)) return err(res, 422, 'Enter a valid email address for the client');
  if (b.consent !== true) return err(res, 400, 'Please confirm the client has agreed to receive the report by email');
  if (PROD && mailProvider() === 'outbox') return err(res, 503, 'Email sending is not set up on this server yet (add RESEND_API_KEY). Download the PDF instead for now.');
  const pdf = await files.get(r.pdf_path);
  if (!pdf) return err(res, 410, 'The PDF file for this report is missing — generate it again');
  const consultant = staff(req);
  const subject = (b.subject || '').trim() || `Your Elements Restore Profile — ${new Date(a.assessed_at || a.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  const message = (b.message || '').trim() || `Thank you for completing your Restore assessment with us. Attached is your Restore Profile with your Stress Load, Recovery Capacity and Circulation results, and the Restore Plan we discussed.\n\nIf you have any questions, simply reply to this email or speak to us at your next visit.`;
  const html = reportEmailHtml({ clientName: a.client_name, message, consultant: b.fromName || consultant, outlet: b.outlet || '' });
  const text = `Dear ${a.client_name},\n\n${message}\n\nYour Restore Profile and Restore Plan are attached as a PDF.\n\nWarm regards,\n${b.fromName || consultant}\nElements Wellness\n\nFor general wellness guidance only. This report is not a medical diagnosis and does not replace advice from a qualified healthcare professional.`;
  const pdfName = `Elements-Restore-Profile-${a.client_name.replace(/\W+/g, '-')}-${r.generated_at.slice(0, 10)}.pdf`;
  const email_id = id();
  try {
    const out = await sendReportEmail({ to, subject, html, text, pdf, pdfName });
    await Emails.add({ email_id, report_id: r.report_id, assessment_id: a.assessment_id, to_address: to, subject, message, sent_by: consultant, sent_at: now(), provider: out.provider, message_id: out.messageId, status: out.provider === 'outbox' ? 'saved-to-outbox' : 'sent', consent: true });
    await Clients.update(a.client_id, { email: to });
    send(res, 200, { ...await Assessments.full(a.assessment_id), email_id, emailStatus: out.provider === 'outbox' ? 'saved-to-outbox' : 'sent', provider: out.provider, file: out.file || null });
  } catch (e) {
    await Emails.add({ email_id, report_id: r.report_id, assessment_id: a.assessment_id, to_address: to, subject, message, sent_by: consultant, sent_at: now(), status: 'failed', error: e.message, consent: true });
    err(res, 502, 'Email could not be sent: ' + e.message);
  }
});
route('GET', '/api/reports/:rid/email-preview', async (req, res, { params, url }) => {
  const r = await Reports.get(params.rid); if (!r) return err(res, 404, 'Report not found');
  const a = await Assessments.full(r.assessment_id);
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(reportEmailHtml({ clientName: a.client_name, message: url.searchParams.get('message') || 'Thank you for completing your Restore assessment with us. Attached is your Restore Profile with your Stress Load, Recovery Capacity and Circulation results, and the Restore Plan we discussed.\n\nIf you have any questions, simply reply to this email or speak to us at your next visit.', consultant: url.searchParams.get('from') || 'Your Elements consultant', outlet: url.searchParams.get('outlet') || '' }));
});
route('GET', '/api/reports/:rid/file', async (req, res, { params }) => {
  const r = await Reports.get(params.rid); if (!r) return err(res, 404, 'Report not found');
  const a = await Assessments.get(r.assessment_id);
  const buf = await files.get(r.pdf_path); if (!buf) return err(res, 410, 'The PDF file for this report is missing — generate it again');
  sendFile(res, buf, 'application/pdf', `Elements-Restore-${(a?.client_name || 'client').replace(/\W+/g, '-')}-${r.generated_at.slice(0, 10)}.pdf`);
});

/* ---------- Server ---------- */
http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (PROD) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  try {
    for (const r of routes) {
      const m = r.method === req.method && url.pathname.match(r.re);
      if (!m) continue;
      if (auth.enabled && !r.open) {
        req.staff = await auth.currentStaff(req, res);
        if (!req.staff) return err(res, 401, 'Please sign in');
      }
      return await r.handler(req, res, { url, params: m.groups || {} });
    }
    if (url.pathname.startsWith('/api/')) return err(res, 404, 'No such endpoint');
    // Static SPA (no client data in these files; every API call above is behind sign-in)
    let file = path.join(PUBLIC, url.pathname === '/' ? 'index.html' : path.normalize(url.pathname));
    if (!file.startsWith(PUBLIC + path.sep) && file !== PUBLIC) return err(res, 403, 'Forbidden');
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(PUBLIC, 'index.html');
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) err(res, e.status || (e.errors ? 422 : 500), e.message, e.errors ? { errors: e.errors } : {});
  }
}).listen(PORT, () => console.log(`Elements Restore → http://localhost:${PORT}  (rules ${activeRules.version}; database ${db.kind}; files ${files.storageKind}${files.remote ? '' : ' in ' + DATA_DIR}; OCR ${ocrEngine}${ai.enabled ? ' + AI check (' + ai.model + ')' : ''}; sign-in ${auth.enabled ? 'on' : 'off'}; email ${mailProvider()})`));
