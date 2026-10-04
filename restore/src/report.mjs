// Client-facing Restore Profile / Restore Plan → PDF via headless Chromium.
// Layout, colours, fonts and sizes are taken from the client's reference,
// 03_Elements_Restore_Profile_Leslie_v5.pdf (US Letter, Noto Serif):
//   text #383634 · headings #4a4039 · labels #8b8175 / #887e74 · values #3e3731 · ideal copy #625a54
//   meta boxes #f5f0ea · attention card #f3e6ce · favourable card #e6efe3 · priority box #f5f0ea
//   components rows #fbf8f4 / #ffffff · plan cells #e8e1d9 / #f5f0ea · trend header #383634 · trend cells #fbf8f4
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const TEMPLATE_VERSION = 'profile-v5-letterhead-3.0';
const here = path.dirname(fileURLToPath(import.meta.url));
const logoData = (() => { const p = path.join(here, '../public/logo-white.png'); return fs.existsSync(p) ? 'data:image/png;base64,' + fs.readFileSync(p).toString('base64') : ''; })();
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmtDate = (iso) => { if (!iso) return '—'; const d = new Date(iso); return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }); };

// Noto Serif (OFL) embedded so the PDF renders identically on any machine
const fontCss = (() => {
  const dir = path.join(here, '../public/fonts');
  const b64 = (f) => { const p = path.join(dir, f); return fs.existsSync(p) ? fs.readFileSync(p).toString('base64') : null; };
  const reg = b64('NotoSerif.ttf'), ita = b64('NotoSerif-Italic.ttf');
  return `:root{--sans:-apple-system,"Helvetica Neue",Helvetica,Arial,sans-serif;--serif:"Noto Serif",Georgia,serif}` + (reg ? `@font-face{font-family:"Noto Serif";font-style:normal;font-weight:100 900;src:url(data:font/ttf;base64,${reg}) format("truetype")}` : '')
    + (ita ? `@font-face{font-family:"Noto Serif";font-style:italic;font-weight:100 900;src:url(data:font/ttf;base64,${ita}) format("truetype")}` : '');
})();

// Card fill: the sample shows the attention card (severity ≥ 2) in #f3e6ce and favourable (0) in #e6efe3.
// Severity 1 ("Mild" / "Monitor Index") is not in the sample; it uses the same warm tone as attention.
const cardFill = (sev) => (sev >= 1 ? '#f3e6ce' : '#e6efe3');
// "Type: A-B\nIndex: -30 to +5" → label in regular, value in bold (as the sample sets "Stress Index: <25")
const idealHtml = (s) => s.split('\n').map((line) => { const i = line.indexOf(':'); return i > 0 ? `${esc(line.slice(0, i + 1))} <b>${esc(line.slice(i + 1).trim())}</b>` : `<b>${esc(line)}</b>`; }).join('<br>');

export function reportHtml({ assessment, rules, selections = [], plan = {} }) {
  const R = assessment.result; const rep = rules.report;
  const client = assessment.client_name; const date = fmtDate(assessment.assessed_at || assessment.created_at);
  const selFor = (p) => selections.find((s) => s.program === p) || {};
  const comp = (c, chosen) => {
    const label = chosen && c.options.includes(chosen) ? chosen : c.options.join(' OR ');
    return `<tr><td class="k">${c.n}. ${esc(label)} — ${esc(c.duration)}</td><td class="v">${esc(c.blurb)}</td></tr>`;
  };
  const programs = R.programs.map((code) => {
    const p = rules.programs[code]; const s = selFor(code);
    return `<div class="program-name">${esc(p.name)}</div>
      <table class="comps">${comp(p.components[0])}${comp(p.components[1], s.component2)}${comp(p.components[2], s.component3)}</table>
      <p class="body">${esc(rep.sessionNote)} ${s.enhancer ? `Enhancer selected: ${esc(p.enhancer)}.` : `Optional enhancer: ${esc(p.enhancer)}.`}</p>`;
  }).join('');
  const first = rules.programs[R.programs[0]];
  const everyday = first.everyday.map(([k, v]) => `<p class="every"><b>${esc(k)}:</b> ${esc(v)}</p>`).join('');

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Elements Restore — ${esc(client)}</title>
<style>
${fontCss}
@page { size: 612pt 792pt; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; }
body { font-family: var(--sans); color: #383634; font-size: 9pt; line-height: 1.45; }
.letterhead { background: #72181b; height: 58pt; margin: 0 -47pt 18pt; display: flex; align-items: center; justify-content: center; }
.letterhead img { height: 26pt; width: auto; }
.letterhead.small { height: 40pt; } .letterhead.small img { height: 20pt; }
.page { position: relative; width: 612pt; height: 792pt; padding: 0 47pt 0; page-break-after: always; overflow: hidden; }
.page:last-child { page-break-after: auto; }
.brand { text-align: center; font-family: var(--sans); font-weight: 700; font-size: 8.5pt; letter-spacing: .18em; color: #8b8175; }
.brand.p2 { font-size: 8.5pt; }
h1 { text-align: center; font-family: var(--serif); font-size: 24pt; font-weight: 400; color: #4a4039; margin: 4pt 0 2pt; letter-spacing: -.005em; line-height: 1.2; }
h1.p2 { font-size: 21pt; }
.sub-i { text-align: center; font-family: var(--serif); font-style: italic; font-size: 9.5pt; color: #8b8175; margin: 0 0 10pt; }
.meta { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0; margin-bottom: 14pt; }
.meta div { background: #f5f0ea; height: 36pt; padding: 7pt 5pt 0; }
.meta small { display: block; font-size: 7pt; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: #8b8175; line-height: 1.2; }
.meta b { display: block; font-size: 10pt; font-weight: 700; color: #383634; margin-top: 3pt; }
h2 { font-size: 8.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .16em; color: #8b8175; margin: 0 0 6pt; line-height: 1.3; }
.card { display: flex; margin-bottom: 15pt; padding: 8pt 4pt 8pt 4pt; }
.card .main { flex: 1; padding-right: 8pt; }
.card .dom { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .14em; color: #8b8175; }
.card .out { font-family: var(--serif); font-size: 18pt; font-weight: 400; color: #4a4039; line-height: 1.15; margin: 5pt 0 3pt; letter-spacing: .01em; }
.card .raw { font-size: 9.5pt; font-weight: 700; color: #383634; margin-bottom: 4pt; white-space: pre; }
.card p { margin: 0 0 0 9pt; font-size: 9pt; color: #383634; line-height: 1.5; }
.card .ideal { width: 114pt; border-left: .75pt solid #cfc6bc; padding: 6pt 0 0 10pt; text-align: right; align-self: stretch; }
.card .ideal small { display: block; font-size: 7pt; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: #887e74; margin-bottom: 4pt; }
.card .ideal div { font-size: 9.5pt; color: #625a54; line-height: 1.5; }
.card .ideal b { font-size: 10pt; color: #3e3731; }
.priority { background: #f5f0ea; padding: 11pt 8pt 9pt; margin-left: -6pt; margin-right: 6pt; }
.priority .out { font-family: var(--serif); font-size: 16pt; font-weight: 400; color: #4a4039; margin-bottom: 6pt; }
.priority p { margin: 0; font-size: 9pt; line-height: 1.5; }
.program-name { font-family: var(--serif); font-size: 14pt; font-weight: 400; color: #4a4039; margin: 0 0 6pt; }
.comps { width: 100%; border-collapse: collapse; margin-bottom: 10pt; }
.comps td { vertical-align: top; padding: 6pt 6pt 6pt 5pt; width: 50%; line-height: 1.4; }
.comps tr:nth-child(odd) td { background: #fbf8f4; } .comps tr:nth-child(even) td { background: #ffffff; }
.comps .k { font-size: 9pt; font-weight: 700; color: #383634; }
.comps .v { font-size: 8.5pt; color: #383634; line-height: 1.5; }
.body { font-size: 9pt; color: #383634; margin: 0 0 10pt; line-height: 1.5; }
.plan { display: grid; grid-template-columns: 1fr 1fr; margin: 0 6pt 0 -6pt; }
.plan .k { background: #e8e1d9; height: 25pt; padding: 8pt 9pt 0; font-size: 7pt; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: #887e74; }
.plan .v { background: #f5f0ea; height: 25pt; padding: 6pt 8pt 0; font-size: 10pt; font-weight: 700; color: #3e3731; }
.basis { font-family: var(--serif); font-style: italic; font-size: 8.5pt; color: #887e74; margin: 6pt 0 10pt; }
.subhead { font-family: var(--serif); font-size: 13pt; font-weight: 400; color: #4a4039; margin: 0 0 3pt; }
.every { margin: 0 0 2pt; font-size: 9pt; } .every b { color: #383634; }
.trend { width: 100%; border-collapse: collapse; margin-top: 8pt; }
.trend th { background: #383634; color: #fff; height: 32pt; font-size: 7.5pt; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.trend td { background: #fbf8f4; height: 31pt; text-align: center; font-size: 8.5pt; color: #383634; } .trend td.l { font-weight: 700; }
.disc { font-family: var(--serif); font-style: italic; font-size: 7.5pt; color: #8b8175; margin: 14pt 0 0; }
.foot { position: absolute; left: 0; right: 0; bottom: 30pt; text-align: center; font-size: 7pt; letter-spacing: .06em; color: #8b8175; }
</style></head><body>
<section class="page">
  <div class="letterhead">${logoData ? `<img src="${logoData}" alt="Elements Wellness">` : '<b style="color:#fff;letter-spacing:.22em">ELEMENTS WELLNESS</b>'}</div>
  <div class="brand">ELEMENTS RESTORE</div>
  <h1>${esc(rep.profileTitle)}</h1>
  <p class="sub-i">${esc(rep.profileSub)}</p>
  <div class="meta"><div><small>Client</small><b>${esc(client)}</b></div><div><small>Assessment date</small><b>${esc(date)}</b></div><div><small>Age</small><b>${esc(assessment.client_age ?? '—')}</b></div></div>
  <h2>Your Restore Snapshot</h2>
  ${R.domains.map((d) => `<div class="card" style="background:${cardFill(d.severity)}"><div class="main"><div class="dom">${esc(d.label)}</div><div class="out">${esc(d.outcome).toUpperCase()}</div><div class="raw">${esc(d.readings)}</div><p>${esc(d.explanation)}</p></div><div class="ideal"><small>Ideal range</small><div>${idealHtml(d.idealRange)}</div></div></div>`).join('')}
  <h2 style="margin-top:2pt">Your Restore Priorit${R.priorities.length > 1 ? 'ies' : 'y'}</h2>
  <div class="priority"><div class="out">${esc(R.priorityLabel).toUpperCase()}</div><p>${esc(R.priorityText)}</p></div>
  <div class="foot">ELEMENTS RESTORE &nbsp;|&nbsp; ${esc(rep.brandLine)}</div>
</section>
<section class="page">
  <div class="letterhead small">${logoData ? `<img src="${logoData}" alt="Elements Wellness">` : '<b style="color:#fff;letter-spacing:.22em">ELEMENTS WELLNESS</b>'}</div>
  <div class="brand p2">ELEMENTS RESTORE</div>
  <h1 class="p2">${esc(rep.planTitle)}</h1>
  <h2 style="margin-top:10pt">Treatment recommendation</h2>
  ${programs}
  <h2 style="font-size:9pt">Plan duration &amp; frequency</h2>
  <div class="plan"><div class="k">Plan duration</div><div class="v">${esc(plan.duration || R.plan.duration)}</div><div class="k">Recommended frequency</div><div class="v">${esc(plan.frequency || R.plan.frequency)}</div></div>
  <p class="basis">${esc(R.plan.basis)}</p>
  <h2>Supplement support</h2>
  <div class="subhead">${esc(first.supplement.title)}</div>
  <p class="body">${esc(first.supplement.text)}</p>
  <h2>Everyday support</h2>
  ${everyday}
  <h2 style="margin-top:10pt">Your next Restore Review</h2>
  <div class="subhead">Suggested review: ${esc(rep.reviewWindow)}</div>
  <p class="body" style="margin-bottom:0">${esc(rep.reviewText)}</p>
  <table class="trend"><tr><th></th>${R.domains.map((d) => `<th>${esc(d.label)}</th>`).join('')}</tr><tr><td class="l">Today</td>${R.domains.map((d) => `<td>${esc(d.outcome)}</td>`).join('')}</tr></table>
  <p class="disc">${esc(rep.disclaimer)}</p>
  <div class="foot">ELEMENTS RESTORE &nbsp;|&nbsp; ${esc(rep.brandLine)}</div>
</section>
</body></html>`;
}

// PDF via Chromium (playwright-core). On a Mac: the Chrome for Testing build or Google Chrome; on the server: the
// Chromium bundled in the Playwright Docker image. Returns the PDF bytes.
export async function htmlToPdf(html) {
  const { chromium } = await import('playwright-core');
  const candidates = [
    process.env.CHROME_PATH,
    path.join(process.env.HOME || '', 'Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  const executablePath = candidates.find((p) => fs.existsSync(p));
  const browser = await chromium.launch(executablePath ? { executablePath } : process.platform === 'darwin' ? { channel: 'chrome' } : { args: ['--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    return await page.pdf({ format: 'Letter', printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  } finally { await browser.close(); }
}

export { here };
