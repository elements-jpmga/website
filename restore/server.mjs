// Elements Restore — staff web app server (Node ≥ 22, no framework).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { db, DATA_DIR, id, now, Rules, Clients, Assessments, Uploads, Readings, Results, Selections, Plans, Reports, Emails, Activity } from './src/db.mjs';
import { sendReportEmail, reportEmailHtml, provider as mailProvider } from './src/mail.mjs';
import { evaluate, validateReadings } from './src/engine.mjs';
import { extractUbio } from './src/extract.mjs';
import { reportHtml, htmlToPdf, TEMPLATE_VERSION } from './src/report.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = +process.env.PORT || 4400;
const PUBLIC = path.join(here, 'public');

// Load rule sets from /rules into the versioned config table; the newest file is the active version.
const ruleFiles = fs.readdirSync(path.join(here, 'rules')).filter((f) => f.endsWith('.json')).sort();
let activeRules = null;
for (const f of ruleFiles) { const r = JSON.parse(fs.readFileSync(path.join(here, 'rules', f), 'utf8')); Rules.upsert(r); activeRules = r; }
const rulesFor = (assessment) => (assessment?.rules_version && Rules.get(assessment.rules_version)) || activeRules;

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.pdf': 'application/pdf', '.json': 'application/json', '.woff2': 'font/woff2' };
const send = (res, code, body, headers = {}) => { res.writeHead(code, { 'Content-Type': 'application/json', ...headers }); res.end(JSON.stringify(body)); };
const err = (res, code, message, extra = {}) => send(res, code, { error: message, ...extra });
const readBody = (req) => new Promise((resolve, reject) => { const chunks = []; req.on('data', (c) => chunks.push(c)); req.on('end', () => resolve(Buffer.concat(chunks))); req.on('error', reject); });
const json = async (req) => { const b = await readBody(req); return b.length ? JSON.parse(b.toString('utf8')) : {}; };
const staff = (req) => (req.headers['x-staff'] || 'staff').toString().slice(0, 80);

const routes = [];
const route = (method, pattern, handler) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '/?$'), handler });

/* ---------- Config ---------- */
route('GET', '/api/config', (req, res) => send(res, 200, { rules: activeRules, rulesVersions: Rules.list(), templateVersion: TEMPLATE_VERSION, mailProvider: mailProvider() }));

/* ---------- Clients ---------- */
route('GET', '/api/clients', (req, res, { url }) => send(res, 200, Clients.search(url.searchParams.get('q') || '')));
route('POST', '/api/clients', async (req, res) => { const b = await json(req); if (!b.name?.trim()) return err(res, 400, 'Name is required'); send(res, 201, Clients.create({ name: b.name, age: b.age ? +b.age : null, sex: b.sex || null, contact_ref: b.contact_ref || null, email: b.email || null })); });
route('GET', '/api/clients/:client_id', (req, res, { params }) => { const c = Clients.get(params.client_id); if (!c) return err(res, 404, 'Client not found'); send(res, 200, { ...c, assessments: Assessments.list({ client_id: c.client_id }) }); });

/* ---------- Assessments ---------- */
route('GET', '/api/activity', (req, res) => send(res, 200, Activity.feed(60)));
route('GET', '/api/assessments', (req, res) => send(res, 200, Assessments.list({ limit: 200 })));
route('POST', '/api/assessments', async (req, res) => { const b = await json(req); if (!Clients.get(b.client_id)) return err(res, 400, 'Unknown client'); const a = Assessments.create(b.client_id, staff(req)); send(res, 201, Assessments.full(a.assessment_id)); });
route('GET', '/api/assessments/:aid', (req, res, { params }) => { const a = Assessments.full(params.aid); a ? send(res, 200, a) : err(res, 404, 'Assessment not found'); });

// Upload: raw PDF bytes in the body; kind in x-kind (stress|vascular|auto), filename in x-filename
route('POST', '/api/assessments/:aid/uploads', async (req, res, { params }) => {
  const a = Assessments.get(params.aid); if (!a) return err(res, 404, 'Assessment not found');
  const buf = await readBody(req);
  if (!buf.length || buf.subarray(0, 4).toString() !== '%PDF') return err(res, 400, 'Please upload a PDF file');
  if (buf.length > 25 * 1024 * 1024) return err(res, 413, 'PDF is larger than 25 MB');
  const filename = decodeURIComponent((req.headers['x-filename'] || 'ubio.pdf').toString()).replace(/[^\w.\- ()]/g, '_');
  const upload_id = id();
  const dir = path.join(DATA_DIR, 'uploads', a.assessment_id); fs.mkdirSync(dir, { recursive: true });
  const stored = path.join(dir, `${upload_id}.pdf`); fs.writeFileSync(stored, buf); // originals are never overwritten
  const preview = path.join(dir, `${upload_id}.png`);
  let extraction;
  try { extraction = await extractUbio(stored, preview); }
  catch (e) { extraction = { kind: 'unknown', fields: {}, error: e.message }; }
  const kindHeader = (req.headers['x-kind'] || 'auto').toString();
  const kind = kindHeader !== 'auto' ? kindHeader : extraction.kind;
  if (kindHeader !== 'auto' && extraction.kind !== 'unknown' && extraction.kind !== kindHeader) extraction.warning = `This file looks like a ${extraction.kind} report but was uploaded as ${kindHeader}.`;
  const u = { upload_id, assessment_id: a.assessment_id, kind, filename, stored_path: stored, sha256: crypto.createHash('sha256').update(buf).digest('hex'), uploaded_at: now(), extraction, preview_path: fs.existsSync(preview) ? preview : null };
  Uploads.add(u);
  const f = extraction.fields || {};
  if (f.assessed_at?.value) Assessments.setAssessedAt(a.assessment_id, f.assessed_at.value);
  if (f.age?.value && !a.client_age) Clients.update(a.client_id, { age: f.age.value });
  if (f.sex?.value && !a.client_sex) Clients.update(a.client_id, { sex: f.sex.value });
  Assessments.setStatus(a.assessment_id, 'extracted');
  send(res, 201, { upload_id, kind, filename, extraction });
});
route('GET', '/api/uploads/:uid/file', (req, res, { params }) => { const u = Uploads.get(params.uid); if (!u) return err(res, 404, 'Not found'); res.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${u.filename}"` }); fs.createReadStream(u.stored_path).pipe(res); });
route('GET', '/api/uploads/:uid/preview', (req, res, { params }) => { const u = Uploads.get(params.uid); if (!u?.preview_path || !fs.existsSync(u.preview_path)) return err(res, 404, 'No preview'); res.writeHead(200, { 'Content-Type': 'image/png' }); fs.createReadStream(u.preview_path).pipe(res); });

// Confirm readings → run engine. The engine never runs without this explicit confirmation.
route('POST', '/api/assessments/:aid/confirm', async (req, res, { params }) => {
  const a = Assessments.get(params.aid); if (!a) return err(res, 404, 'Assessment not found');
  const b = await json(req);
  const v = validateReadings(b.readings || {});
  if (!v.ok) return err(res, 422, 'Please correct the highlighted readings', { errors: v.errors });
  if (b.confirmed !== true) return err(res, 400, 'Readings must be explicitly confirmed');
  const rules = activeRules;
  Readings.confirm(a.assessment_id, v.clean, b.extracted || null, b.corrections || [], staff(req));
  if (b.assessed_at) Assessments.setAssessedAt(a.assessment_id, b.assessed_at);
  if (b.client) Clients.update(a.client_id, { name: b.client.name || null, age: b.client.age ? +b.client.age : null, sex: b.client.sex || null, email: b.client.email || null });
  const result = evaluate(v.clean, rules);
  Results.save(a.assessment_id, result);
  Assessments.setRules(a.assessment_id, rules.version);
  Assessments.setStatus(a.assessment_id, 'calculated');
  send(res, 200, Assessments.full(a.assessment_id));
});

// Consultant selections: only the permitted OR-options; enhancer optional. Scores are untouched.
route('PUT', '/api/assessments/:aid/selections/:program', async (req, res, { params }) => {
  const a = Assessments.full(params.aid); if (!a?.result) return err(res, 400, 'Run the engine first');
  const rules = rulesFor(a); const prog = rules.programs[params.program];
  if (!prog || !a.result.programs.includes(params.program)) return err(res, 400, 'Program is not part of this assessment');
  const b = await json(req);
  const ok2 = !b.component2 || prog.components[1].options.includes(b.component2);
  const ok3 = !b.component3 || prog.components[2].options.includes(b.component3);
  if (!ok2 || !ok3) return err(res, 422, 'Only the permitted OR-options can be selected');
  Selections.set(a.assessment_id, params.program, { component2: b.component2, component3: b.component3, enhancer: !!b.enhancer });
  send(res, 200, Assessments.full(a.assessment_id));
});

route('PUT', '/api/assessments/:aid/notes', async (req, res, { params }) => {
  const a = Assessments.full(params.aid); if (!a?.result) return err(res, 400, 'Run the engine first');
  const b = await json(req);
  Plans.notes(a.assessment_id, { consultant_notes: b.consultant_notes || '', suitability: b.suitability || {}, contraindication_notes: b.contraindication_notes || '' });
  send(res, 200, Assessments.full(a.assessment_id));
});

// Report: HTML preview + PDF generation (saved to the client record, re-downloadable)
route('GET', '/api/assessments/:aid/report.html', (req, res, { params, url }) => {
  const a = Assessments.full(params.aid); if (!a?.result) return err(res, 400, 'Run the engine first');
  let html = reportHtml({ assessment: a, rules: rulesFor(a), selections: a.selections, plan: a.plan });
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
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(html);
});
route('POST', '/api/assessments/:aid/report', async (req, res, { params }) => {
  const a = Assessments.full(params.aid); if (!a?.result) return err(res, 400, 'Run the engine first');
  const rules = rulesFor(a);
  const report_id = id();
  const dir = path.join(DATA_DIR, 'reports', a.assessment_id); fs.mkdirSync(dir, { recursive: true });
  const pdf = path.join(dir, `${report_id}.pdf`);
  try { await htmlToPdf(reportHtml({ assessment: a, rules, selections: a.selections, plan: a.plan }), pdf); }
  catch (e) { return err(res, 500, 'PDF generation failed: ' + e.message); }
  Reports.add({ report_id, assessment_id: a.assessment_id, pdf_path: pdf, generated_at: now(), rules_version: rules.version, template_version: TEMPLATE_VERSION });
  Assessments.setStatus(a.assessment_id, 'reported');
  send(res, 201, { report_id, ...Assessments.full(a.assessment_id) });
});
// Email the generated PDF to the client. Staff-only; the client receives the PDF as an attachment and nothing else.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
route('POST', '/api/reports/:rid/email', async (req, res, { params }) => {
  const r = Reports.get(params.rid); if (!r) return err(res, 404, 'Report not found');
  const a = Assessments.full(r.assessment_id);
  const b = await json(req);
  const to = (b.to || '').trim();
  if (!EMAIL_RE.test(to)) return err(res, 422, 'Enter a valid email address for the client');
  if (b.consent !== true) return err(res, 400, 'Please confirm the client has agreed to receive the report by email');
  if (!fs.existsSync(r.pdf_path)) return err(res, 410, 'The PDF file for this report is missing — generate it again');
  const consultant = staff(req);
  const subject = (b.subject || '').trim() || `Your Elements Restore Profile — ${new Date(a.assessed_at || a.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  const message = (b.message || '').trim() || `Thank you for completing your Restore assessment with us. Attached is your Restore Profile with your Stress Load, Recovery Capacity and Circulation results, and the Restore Plan we discussed.\n\nIf you have any questions, simply reply to this email or speak to us at your next visit.`;
  const html = reportEmailHtml({ clientName: a.client_name, message, consultant: b.fromName || consultant, outlet: b.outlet || '' });
  const text = `Dear ${a.client_name},\n\n${message}\n\nYour Restore Profile and Restore Plan are attached as a PDF.\n\nWarm regards,\n${b.fromName || consultant}\nElements Wellness\n\nFor general wellness guidance only. This report is not a medical diagnosis and does not replace advice from a qualified healthcare professional.`;
  const pdfName = `Elements-Restore-Profile-${a.client_name.replace(/\W+/g, '-')}-${r.generated_at.slice(0, 10)}.pdf`;
  const email_id = id();
  try {
    const out = await sendReportEmail({ to, subject, html, text, pdfPath: r.pdf_path, pdfName });
    Emails.add({ email_id, report_id: r.report_id, assessment_id: a.assessment_id, to_address: to, subject, message, sent_by: consultant, sent_at: now(), provider: out.provider, message_id: out.messageId, status: out.provider === 'outbox' ? 'saved-to-outbox' : 'sent', consent: true });
    Clients.update(a.client_id, { email: to });
    send(res, 200, { ...Assessments.full(a.assessment_id), email_id, emailStatus: out.provider === 'outbox' ? 'saved-to-outbox' : 'sent', provider: out.provider, file: out.file || null });
  } catch (e) {
    Emails.add({ email_id, report_id: r.report_id, assessment_id: a.assessment_id, to_address: to, subject, message, sent_by: consultant, sent_at: now(), status: 'failed', error: e.message, consent: true });
    err(res, 502, 'Email could not be sent: ' + e.message);
  }
});
route('GET', '/api/reports/:rid/email-preview', (req, res, { params, url }) => {
  const r = Reports.get(params.rid); if (!r) return err(res, 404, 'Report not found');
  const a = Assessments.full(r.assessment_id);
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(reportEmailHtml({ clientName: a.client_name, message: url.searchParams.get('message') || 'Thank you for completing your Restore assessment with us. Attached is your Restore Profile with your Stress Load, Recovery Capacity and Circulation results, and the Restore Plan we discussed.\n\nIf you have any questions, simply reply to this email or speak to us at your next visit.', consultant: url.searchParams.get('from') || 'Your Elements consultant', outlet: url.searchParams.get('outlet') || '' }));
});
route('GET', '/api/reports/:rid/file', (req, res, { params }) => {
  const r = Reports.get(params.rid); if (!r) return err(res, 404, 'Report not found');
  const a = Assessments.get(r.assessment_id);
  res.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="Elements-Restore-${(a?.client_name || 'client').replace(/\W+/g, '-')}-${r.generated_at.slice(0, 10)}.pdf"` });
  fs.createReadStream(r.pdf_path).pipe(res);
});

/* ---------- Server ---------- */
http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    for (const r of routes) {
      const m = r.method === req.method && url.pathname.match(r.re);
      if (m) return await r.handler(req, res, { url, params: m.groups || {} });
    }
    if (url.pathname.startsWith('/api/')) return err(res, 404, 'No such endpoint');
    // Static SPA
    let file = path.join(PUBLIC, url.pathname === '/' ? 'index.html' : url.pathname);
    if (!file.startsWith(PUBLIC)) return err(res, 403, 'Forbidden');
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(PUBLIC, 'index.html');
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) err(res, e.errors ? 422 : 500, e.message, e.errors ? { errors: e.errors } : {});
  }
}).listen(PORT, () => console.log(`Elements Restore → http://localhost:${PORT}  (rules ${activeRules.version}, data in ${DATA_DIR})`));
