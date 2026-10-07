// Checks the values in restore/.env against Supabase (and Resend) before they go into Render.
// Prints only ✅ / ❌ and what to fix — never the values themselves.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ENV = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env');
if (!fs.existsSync(ENV)) { console.log('❌ restore/.env not found'); process.exit(1); }
process.loadEnvFile(ENV);
const e = (k) => (process.env[k] || '').trim();
let failed = 0, warned = 0;
const ok = (m) => console.log('✅ ' + m);
const bad = (m, fix) => { failed++; console.log('❌ ' + m + (fix ? `\n   → ${fix}` : '')); };
const warn = (m, fix) => { warned++; console.log('⚠️  ' + m + (fix ? `\n   → ${fix}` : '')); };
const head = (t) => console.log(`\n${t}`);

/* 1 Database */
head('1. Database connection (DATABASE_URL)');
const dbUrl = e('DATABASE_URL');
let ref = null;
if (!dbUrl) bad('Empty', 'Supabase → Connect → Connection String → URI → Session pooler');
else if (/\[YOUR-PASSWORD\]|YOUR-PASSWORD/i.test(dbUrl)) bad('Still has [YOUR-PASSWORD] in it', 'Replace [YOUR-PASSWORD] (including the brackets) with your database password');
else {
  let u = null; try { u = new URL(dbUrl); } catch { bad('Not a valid link', 'Copy it again from Connect → Session pooler. If your password has symbols like @ # / ?, reset it to letters and numbers only (Project Settings → Database → Reset password)'); }
  if (u) {
    ref = decodeURIComponent(u.username).split('.')[1] || null;
    if (!/pooler\.supabase\.com$/.test(u.hostname)) warn(`Host is ${u.hostname} — this is not the Session pooler`, 'Render needs the "Session pooler" link (the direct db.xxx.supabase.co link does not work from Render)');
    if (u.port && u.port !== '5432') warn(`Port is ${u.port}`, 'Use the Session pooler link (port 5432), not the Transaction pooler (6543)');
    if (/pooler\.supabase\.com$/.test(u.hostname) && !u.hostname.includes('ap-southeast-1')) warn('The database is not in Singapore (ap-southeast-1)', 'Fine to keep, but client data would be stored outside Singapore');
    try {
      const { default: postgres } = await import('postgres');
      const sql = postgres(dbUrl, { ssl: 'require', max: 1, prepare: false, connect_timeout: 15, onnotice: () => {} });
      const [r] = await sql`select current_user as who, split_part(version(), ' ', 2) as v`;
      const [t] = await sql`select count(*)::int as n from information_schema.tables where table_schema = 'public' and table_name in ('clients','assessments','uploads','reports')`;
      await sql.end();
      ok(`Connected to Postgres ${r.v} as ${r.who}` + (t.n ? ` — app tables already created (${t.n}/4)` : ' — tables will be created on first start'));
    } catch (err) {
      const m = String(err.message || err);
      if (/password authentication failed/i.test(m)) bad('Password is wrong', 'Check the password you put in place of [YOUR-PASSWORD], or reset it: Project Settings → Database → Reset database password');
      else if (/ENOTFOUND|getaddrinfo/i.test(m)) bad('Server name not found', 'Copy the Session pooler link again');
      else if (/tenant|user not found/i.test(m)) bad('Supabase does not recognise this project in the link', 'Copy the Session pooler link again — the user part must look like postgres.<project-id>');
      else bad('Could not connect: ' + m.slice(0, 160));
    }
  }
}

/* 2 Project URL */
head('2. Project URL (SUPABASE_URL)');
const base = e('SUPABASE_URL').replace(/\/+$/, '');
const urlRef = (base.match(/^https:\/\/([a-z0-9]+)\.supabase\.co$/) || [])[1];
if (!base) bad('Empty', 'Project Settings → Data API → Project URL');
else if (!urlRef) bad('Does not look like https://<project-id>.supabase.co', 'Copy it from Project Settings → Data API → Project URL (no extra path at the end)');
else if (ref && ref !== urlRef) bad('Project URL and database link are from DIFFERENT projects', 'Copy both from the same Supabase project');
else ok('Format correct' + (ref ? ' and matches the database link' : ''));

/* 3 Publishable key */
head('3. Publishable key (SUPABASE_PUBLISHABLE_KEY)');
const pub = e('SUPABASE_PUBLISHABLE_KEY') || e('SUPABASE_ANON_KEY');
if (!pub) bad('Empty', 'Project Settings → API Keys → Publishable key');
else if (pub.startsWith('sb_secret_')) bad('This is the SECRET key, not the publishable one', 'Put the key starting with sb_publishable_ here');
else if (urlRef) {
  try {
    const r = await fetch(`${base}/auth/v1/settings`, { headers: { apikey: pub } });
    if (!r.ok) bad(`Supabase rejected the key (${r.status})`, 'Copy the Publishable key again from the same project');
    else {
      const s = await r.json();
      ok('Key works with staff sign-in' + (s.external?.email === false ? '' : ' (email + password enabled)'));
      if (s.external?.email === false) bad('Email sign-in is turned off', 'Authentication → Sign In / Providers → Email → enable');
      if (s.disable_signup) ok('Public sign-up is OFF (only staff you add can sign in)');
      else bad('Public sign-up is ON — anyone could create an account', 'Authentication → Sign In / Providers → turn off "Allow new users to sign up" → Save');
    }
  } catch (err) { bad('Could not reach Supabase: ' + err.message); }
}

/* 4 Secret key */
head('4. Secret key (SUPABASE_SECRET_KEY)');
const sec = e('SUPABASE_SECRET_KEY') || e('SUPABASE_SERVICE_ROLE_KEY');
if (!sec) bad('Empty', 'Project Settings → API Keys → Secret keys → Reveal → copy');
else if (sec.startsWith('sb_publishable_')) bad('This is the PUBLISHABLE key, not the secret one', 'Put the key starting with sb_secret_ here');
else if (urlRef) {
  const h = { apikey: sec, Authorization: `Bearer ${sec}` };
  try {
    const r = await fetch(`${base}/storage/v1/bucket`, { headers: h });
    if (!r.ok) bad(`Supabase rejected the key for file storage (${r.status})`, 'Copy the Secret key again from the same project');
    else {
      const buckets = await r.json();
      const b = buckets.find((x) => x.id === 'restore-files');
      ok('Key works with file storage' + (b ? ` — bucket "restore-files" exists (${b.public ? 'PUBLIC!' : 'private'})` : ' — the private bucket will be created on first start'));
      if (b?.public) bad('The "restore-files" bucket is public', 'Storage → restore-files → Edit bucket → turn off Public');
    }
    const u = await fetch(`${base}/auth/v1/admin/users?per_page=100`, { headers: h });
    if (u.ok) {
      const list = (await u.json()).users || [];
      const confirmed = list.filter((x) => x.email_confirmed_at || x.confirmed_at);
      if (!list.length) bad('No staff accounts yet', 'Authentication → Users → Add user → Create new user (tick Auto Confirm User)');
      else ok(`${list.length} staff account${list.length === 1 ? '' : 's'}: ${list.map((x) => `${x.email}${x.user_metadata?.name ? ` (${x.user_metadata.name})` : ''}`).join(', ')}`);
      if (list.length > confirmed.length) warn(`${list.length - confirmed.length} account(s) not confirmed — they cannot sign in yet`, 'Delete and re-add them with "Auto Confirm User" ticked');
    }
  } catch (err) { bad('Could not reach Supabase: ' + err.message); }
}

/* 5 Email */
head('5. Email (RESEND_API_KEY) — optional for launch');
const rk = e('RESEND_API_KEY');
const from = e('MAIL_FROM');
if (!rk) warn('Not set — staff can download the PDF, but "Send email" will say email is not set up', 'resend.com → API Keys → Create (Sending access)');
else {
  try {
    const r = await fetch('https://api.resend.com/domains', { headers: { Authorization: `Bearer ${rk}` } });
    const body = await r.json().catch(() => ({}));
    if (r.status === 401 && /restricted/i.test(body.name || body.message || '')) ok('Key is valid (sending only) — check the domain shows "Verified" on resend.com → Domains');
    else if (!r.ok) bad(`Resend rejected the key (${r.status})`, 'Create a new key on resend.com → API Keys');
    else {
      const domain = (from.match(/@([^>\s]+)/) || [])[1];
      const d = (body.data || []).find((x) => x.name === domain);
      if (!d) bad(`Domain ${domain} is not added in Resend`, 'resend.com → Domains → Add domain');
      else if (d.status !== 'verified') warn(`Domain ${domain} is "${d.status}" — emails will fail until it is verified`, 'Add the DNS records Resend shows at GoCloudEasy, then click Verify');
      else ok(`Key works and ${domain} is verified`);
    }
  } catch (err) { bad('Could not reach Resend: ' + err.message); }
}
if (from && !/^[^<>]*<[^\s@<>]+@[^\s@<>]+>$|^[^\s@]+@[^\s@]+$/.test(from)) bad('MAIL_FROM format', 'Use: Elements Wellness <restore@elements.com.sg>');

/* 6 AI */
head('6. AI (OPENAI_API_KEY) — optional');
const ok_ = e('OPENAI_API_KEY'), aiModel = e('OPENAI_MODEL') || 'gpt-5.4-mini';
if (!ok_) warn('Not set — the app works without AI (no AI check on uploads, no "Draft with AI" buttons)', 'platform.openai.com → API keys → Create new secret key');
else if (!ok_.startsWith('sk-')) bad('Does not look like an OpenAI API key (should start with sk-)', 'Create one at platform.openai.com → API keys. A ChatGPT subscription login is not an API key');
else {
  try {
    const r = await fetch(`https://api.openai.com/v1/models/${encodeURIComponent(aiModel)}`, { headers: { Authorization: `Bearer ${ok_}` } });
    const body = await r.json().catch(() => ({}));
    if (r.status === 401) bad('OpenAI rejected the key', 'Check you copied the whole key, or create a new one at platform.openai.com → API keys');
    else if (r.status === 404) {
      const list = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${ok_}` } }).then((x) => x.json()).catch(() => ({}));
      const gpts = (list.data || []).map((m) => m.id).filter((id) => /^gpt-|^o\d/.test(id) && !/audio|realtime|tts|transcribe|search|image/.test(id)).sort().slice(-12);
      bad(`Model "${aiModel}" is not available to this key`, `Set OPENAI_MODEL to one of: ${gpts.join(', ') || '(none listed)'}`);
    } else if (!r.ok) bad(`OpenAI error ${r.status}: ${body.error?.message || ''}`);
    else {
      // tiny test call: checks billing/credits are set up
      const t = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${ok_}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: aiModel, messages: [{ role: 'user', content: 'Reply with OK' }], store: false }) });
      const tb = await t.json().catch(() => ({}));
      if (t.ok) ok(`Key works with ${aiModel} — AI check and writing help will turn on`);
      else if (t.status === 429 && /quota|billing/i.test(tb.error?.message || '')) bad('Key is valid but the OpenAI account has no credit', 'platform.openai.com → Settings → Billing → add credit (a few dollars lasts a long time)');
      else bad(`Test request failed (${t.status}): ${tb.error?.message || ''}`);
    }
  } catch (err) { bad('Could not reach OpenAI: ' + err.message); }
}

console.log(`\n${failed ? `❌ ${failed} thing${failed === 1 ? '' : 's'} to fix` : '✅ Ready — paste these values into Render'}${warned ? ` · ${warned} warning${warned === 1 ? '' : 's'}` : ''}`);
process.exit(failed ? 1 : 0);
