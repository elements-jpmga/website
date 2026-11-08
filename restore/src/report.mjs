// Client-facing Restore Profile / Restore Plan → PDF via headless Chromium.
// Layout follows the client's reference Elements_Restore_Profile_Lucy_v8_Disclaimer_At_Start.pdf (8 Nov 2026):
//   page 1 — brand line, title, subtitle, disclaimer at the start, CLIENT | ASSESSMENT strip, three snapshot cards
//            (outcome, reading, explanation, "How this reading is measured", reference guide on the right, the
//            vascular-type strip for Circulation), Restore Priority with the Restore focus, then "How you're feeling today"
//   page 2 — Treatment recommendation (numbered rows, total duration, program benefits, optional enhancer),
//            Plan duration & frequency, Your next Restore Review with the trend table
//   text #383634 · headings #4a4039 · labels #8b8175 · meta/plan boxes #f5f0ea / #e8e1d9 · attention card #f3e6ce · favourable card #e6efe3
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const TEMPLATE_VERSION = 'profile-v8-1.0';
const here = path.dirname(fileURLToPath(import.meta.url));
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmtDate = (iso) => { if (!iso) return '—'; const d = new Date(iso); return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }); };
// "**Stress Index**" → bold
const md = (s = '') => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

// Noto Serif (OFL) embedded so the PDF renders identically on any machine
const fontCss = (() => {
  const dir = path.join(here, '../public/fonts');
  const b64 = (f) => { const p = path.join(dir, f); return fs.existsSync(p) ? fs.readFileSync(p).toString('base64') : null; };
  const reg = b64('NotoSerif.ttf'), ita = b64('NotoSerif-Italic.ttf');
  return `:root{--sans:-apple-system,"Helvetica Neue",Helvetica,Arial,sans-serif;--serif:"Noto Serif",Georgia,serif}` + (reg ? `@font-face{font-family:"Noto Serif";font-style:normal;font-weight:100 900;src:url(data:font/ttf;base64,${reg}) format("truetype")}` : '')
    + (ita ? `@font-face{font-family:"Noto Serif";font-style:italic;font-weight:100 900;src:url(data:font/ttf;base64,${ita}) format("truetype")}` : '');
})();

// Card fill: attention (severity ≥ 1) warm, favourable (0) green — as in the reference
const cardFill = (sev) => (sev >= 1 ? '#f3e6ce' : '#e6efe3');

// Reference guide lines; the line matching this client's outcome is bold (as the reference prints "60+ - High. Marked stress load")
function referenceGuide(domainRules, d, result) {
  const lines = domainRules.referenceGuide || [];
  const key = d.id === 'circulation' ? circulationIndexKey(domainRules, result.readings.vascular_age_index) : d.outcome;
  return `<div class="ref"><small>Reference guide</small>${domainRules.referenceTitle ? `<div class="ref-title">${esc(domainRules.referenceTitle)}</div>` : ''}${lines.map(([k, text]) => `<div class="${k === key ? 'on' : ''}">${esc(text)}</div>`).join('')}</div>`;
}
const circulationIndexKey = (rules, index) => (rules.indexBands.find((b) => (b.min == null || index >= b.min) && (b.max == null || index < b.max)) || {}).key;

// The UBIO vascular-type strip (A–G) with "YOUR TYPE" on the client's type
function typeChart(chart, type) {
  const cols = chart.types.map(([t, label, colour]) => {
    const i = chart.types.findIndex((x) => x[0] === t); const fill = Math.min(1, i / 6);
    const ring = `<svg viewBox="0 0 40 40" class="ring"><circle cx="20" cy="20" r="14" fill="none" stroke="#f3b7c3" stroke-width="7"/>${fill ? `<path d="${arc(20, 20, 14, 0, fill * 300)}" fill="none" stroke="#f0c86a" stroke-width="7" stroke-linecap="round"/>` : ''}${i >= 5 ? `<circle cx="20" cy="20" r="7" fill="#c9323a" opacity=".55"/>` : ''}</svg>`;
    return `<div class="tcol ${t === type ? 'me' : ''}">${t === type ? '<span class="tag">Your type</span>' : ''}<div class="thead" style="background:${colour}">${t} type</div>${ring}<div class="tlab">${esc(label)}</div></div>`;
  }).join('');
  return `<div class="tchart"><div class="tgrid">${cols}</div><div class="tnote">※ ${esc(chart.note)}</div></div>`;
}
function arc(cx, cy, r, a0, a1) {
  const p = (a) => { const t = (a - 90) * Math.PI / 180; return `${(cx + r * Math.cos(t)).toFixed(2)},${(cy + r * Math.sin(t)).toFixed(2)}`; };
  return `M${p(a0)} A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p(a1)}`;
}

export function reportHtml({ assessment, rules, selections = [], plan = {} }) {
  const R = assessment.result; const rep = rules.report; const D = rules.domains;
  const client = assessment.client_name; const date = fmtDate(assessment.assessed_at || assessment.created_at);
  const age = assessment.client_age ? ` · Age ${esc(assessment.client_age)}` : '';

  // "How you're feeling today" — the three answers taken at the start of the session; shown only, never interpreted
  const pain = assessment.pain_today === 'Yes' ? (assessment.pain_location || 'Yes') : assessment.pain_today === 'No' ? (rep.feelingNone || 'None reported') : null;
  const energy = assessment.energy_level || null;
  const feeling = (pain || energy) ? `<h2 style="margin-top:9pt">${esc(rep.feelingTitle || "How you're feeling today")}</h2>
  <div class="feel"><p><b>${esc(rep.feelingPain || 'Pain / discomfort')}:</b> ${esc(pain || '—')}</p><p><b>${esc(rep.feelingEnergy || 'Energy level')}:</b> ${esc(energy || '—')}</p></div>` : '';

  // Treatment recommendation — the fixed protocol exactly as the client's sheet prints it: alternatives joined with OR
  const programBlock = (code) => {
    const p = rules.programs[code];
    return `<div class="pblock"><div class="program-name">${esc(p.name)}</div>
      <table class="comps">${p.components.map((c) => `<tr><td class="n">${c.n}</td><td class="k">${esc(c.options.join(' OR '))} - ${esc(c.duration)}</td></tr>`).join('')}</table>
      <p class="total"><b>${esc(rep.totalLabel || 'Total duration')}:</b> ${esc(p.total || '')}</p>
      <h2 style="margin-top:8pt">${esc(rep.benefitsTitle || 'Program benefits')}</h2>
      <ul class="benefits">${(p.benefits || [p.benefit]).map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      <div class="enh"><span>${esc(rep.enhancerTitle || 'Optional enhancer')}</span><b>${esc(p.enhancer)}</b></div></div>`;
  };
  const programs = R.programs.map(programBlock).join('<div style="height:10pt"></div>');

  // Restore priority + focus line(s)
  const focus = R.maintain ? rules.priority.focus.maintain : R.priorities.map((id) => rules.priority.focus[id]).join(' ');

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Elements Restore — ${esc(client)}</title>
<style>
${fontCss}
@page { size: 612pt 792pt; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; }
body { font-family: var(--serif); color: #383634; font-size: 8.5pt; line-height: 1.38; }
.page { position: relative; width: 612pt; height: 792pt; padding: 30pt 44pt 0; page-break-after: always; overflow: hidden; }
.page:last-child { page-break-after: auto; }
/* two or three Restore Priorities: longer outcomes and focus lines — page 1 is set a little denser so it still fits one page */
.page.dense { font-size: 8pt; } .page.dense .card { padding: 6pt 10pt 6pt 12pt; margin-bottom: 5pt; } .page.dense .card p { font-size: 8pt; line-height: 1.32; } .page.dense .card .out { font-size: 15pt; } .page.dense .card .ref div { font-size: 7.6pt; line-height: 1.42; } .page.dense .tchart { width: 300pt; margin-top: 4pt; } .page.dense .tcol .ring { width: 17pt; height: 17pt; } .page.dense .priority p, .page.dense .feel p { font-size: 8.5pt; line-height: 1.4; } .page.dense .priority .out { font-size: 14pt; }
.pblock { break-inside: avoid; }
.page.grow { height: auto; min-height: 792pt; padding-bottom: 30pt; overflow: visible; } .page.grow .foot { position: static; margin-top: 22pt; }
.brand { text-align: center; font-weight: 700; font-size: 9.5pt; letter-spacing: .04em; color: #4a4039; }
h1 { text-align: center; font-size: 22pt; font-weight: 700; color: #4a4039; margin: 0 0 1pt; line-height: 1.2; }
.sub-i { text-align: center; font-style: italic; font-size: 9.5pt; color: #8b8175; margin: 0 0 4pt; }
.disc { text-align: center; font-style: italic; font-size: 7.2pt; color: #8b8175; margin: 0 0 8pt; }
.meta { display: grid; grid-template-columns: 1.1fr 2.4fr; margin-bottom: 9pt; }
.meta small { display: block; background: #e8e1d9; padding: 4pt 10pt; font-size: 8pt; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #8b8175; }
.meta b { display: block; background: #f5f0ea; padding: 5pt 10pt 6pt; font-size: 10pt; font-weight: 700; color: #383634; }
h2 { font-size: 9.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: #8b8175; margin: 0 0 3pt 8pt; line-height: 1.3; }
.card { display: flex; margin-bottom: 6pt; padding: 7pt 10pt 7pt 12pt; }
.card .main { flex: 1; padding-right: 10pt; }
.card .dom { font-size: 8.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: #8b8175; }
.card .out { font-size: 16pt; font-weight: 700; color: #4a4039; line-height: 1.1; margin: 0 0 1pt; }
.card .raw { font-size: 9pt; font-weight: 700; color: #383634; margin-bottom: 1pt; }
.card p { margin: 0; font-size: 8.5pt; color: #383634; line-height: 1.38; }
.card h3 { font-size: 7.8pt; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: #8b8175; margin: 4pt 0 0; }
.card .ref { width: 150pt; border-left: .75pt solid #cfc6bc; padding: 0 0 0 10pt; text-align: right; align-self: stretch; }
.card .ref small { display: block; font-size: 8pt; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: #8b8175; margin-bottom: 4pt; }
.card .ref .ref-title { font-size: 8.5pt; font-weight: 700; color: #383634; margin-bottom: 1pt; }
.card .ref div { font-size: 8pt; color: #625a54; line-height: 1.5; } .card .ref div.on { font-weight: 700; color: #383634; }
.tchart { background: #fff; padding: 4pt 8pt 3pt; margin-top: 5pt; width: 320pt; }
.tgrid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2pt; }
.tcol { position: relative; text-align: center; font-family: var(--sans); padding-top: 7pt; }
.tcol.me { outline: 1.5pt solid #5a5452; outline-offset: -1pt; }
.tcol .tag { position: absolute; top: -4pt; left: 50%; transform: translateX(-50%); background: #5a5452; color: #fff; font-size: 5pt; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; padding: 1.5pt 4pt; white-space: nowrap; border-radius: 1pt; }
.tcol .thead { color: #fff; font-size: 6.5pt; font-weight: 700; padding: 2pt 0; }
.tcol .ring { width: 20pt; height: 20pt; display: block; margin: 2pt auto 0; }
.tcol .tlab { font-size: 5.6pt; color: #383634; padding: 0 1pt 2pt; line-height: 1.15; }
.tnote { font-family: var(--sans); font-size: 6.5pt; color: #383634; text-align: center; margin-top: 2pt; }
.priority { display: flex; align-items: center; gap: 20pt; background: #f5f0ea; padding: 8pt 14pt; }
.priority .out { font-size: 16pt; font-weight: 700; color: #4a4039; min-width: 110pt; }
.priority p { margin: 0; font-size: 9pt; line-height: 1.45; }
.feel { background: #f5f0ea; padding: 7pt 14pt; }
.feel p { margin: 0; font-size: 9pt; line-height: 1.55; }
.program-name { font-size: 12.5pt; font-weight: 700; color: #4a4039; margin: 0 0 6pt 8pt; }
.comps { width: 100%; border-collapse: separate; border-spacing: 0 3pt; margin: 0 0 4pt; }
.comps td { background: #f5f0ea; padding: 7pt 8pt; font-size: 9.5pt; font-weight: 700; color: #383634; }
.comps td.n { width: 30pt; text-align: center; }
.total { margin: 2pt 0 8pt 8pt; font-size: 9.5pt; }
.benefits { margin: 0 0 8pt 10pt; padding: 0 0 0 10pt; font-size: 9.5pt; line-height: 1.55; }
.enh { display: flex; align-items: center; gap: 24pt; background: #f5f0ea; padding: 8pt 8pt; margin-bottom: 12pt; }
.enh span { font-size: 9.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: #8b8175; min-width: 120pt; } .enh b { font-size: 10pt; }
.plan { display: grid; grid-template-columns: 1fr 1fr; }
.plan .k { background: #e8e1d9; padding: 8pt 8pt; font-size: 9pt; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: #8b8175; }
.plan .v { background: #f5f0ea; padding: 7pt 8pt; font-size: 10pt; font-weight: 700; color: #3e3731; }
.basis { font-style: italic; font-size: 8.5pt; color: #887e74; margin: 6pt 0 12pt 8pt; }
.subhead { font-size: 13pt; font-weight: 700; color: #4a4039; margin: 0 0 3pt 8pt; }
.body { font-size: 9.5pt; color: #383634; margin: 0 0 12pt 8pt; line-height: 1.5; }
.trend { width: 100%; border-collapse: collapse; }
.trend th { background: #383634; color: #fff; height: 28pt; font-size: 8.5pt; font-weight: 700; }
.trend td { background: #f5f0ea; height: 28pt; text-align: center; font-family: var(--sans); font-size: 9pt; color: #383634; } .trend td.l { font-family: var(--serif); font-weight: 700; }
.foot { position: absolute; left: 0; right: 0; bottom: 30pt; text-align: center; font-size: 7pt; letter-spacing: .04em; color: #8b8175; }
</style></head><body>
<section class="page${R.priorities.length > 1 ? ' dense' : ''}">
  <div class="brand">ELEMENTS RESTORE</div>
  <h1>${esc(rep.profileTitle)}</h1>
  <p class="sub-i">${esc(rep.profileSub)}</p>
  <p class="disc">${esc(rep.disclaimer)}</p>
  <div class="meta"><div><small>Client</small><b>${esc(client)}${age}</b></div><div><small>Assessment</small><b>${esc(date)}</b></div></div>
  <h2>Your Restore Snapshot</h2>
  ${R.domains.map((d) => { const dr = D[d.id]; return `<div class="card" style="background:${cardFill(d.severity)}"><div class="main"><div class="dom">${esc(d.label)}</div><div class="out">${esc(d.outcome).toUpperCase()}</div><div class="raw">${esc(d.readings).replace(/\s{2,}\|\s{2,}/, ' | ')}</div><p>${esc(d.explanation.split('. ')[0])}${d.explanation.includes('. ') ? '.' : ''}</p>
    ${dr.measured ? `<h3>How this reading is measured</h3><p>${md(dr.measured)}</p>` : ''}
    ${d.id === 'circulation' && dr.typeChart ? `<h3>${esc(dr.typeChart.title)}</h3>${typeChart(dr.typeChart, R.readings.vascular_age_type)}` : ''}</div>${referenceGuide(dr, d, R)}</div>`; }).join('')}
  <h2 style="margin-top:6pt">Your Restore Priorit${R.priorities.length > 1 ? 'ies' : 'y'}</h2>
  <div class="priority"><div class="out">${esc(R.priorityLabel).toUpperCase()}</div><p><b>${esc(rep.focusLabel || 'Restore focus')}:</b> ${esc(focus)}</p></div>
  ${feeling}
  <div class="foot">ELEMENTS RESTORE &nbsp;|&nbsp; ${esc(rep.brandLine)}</div>
</section>
<section class="page${R.programs.length > 1 ? ' grow' : ''}">
  <div class="brand">ELEMENTS RESTORE</div>
  <h1>${esc(rep.planTitle)}</h1>
  <h2 style="margin-top:6pt">Treatment recommendation</h2>
  ${programs}
  <h2>Plan duration &amp; frequency</h2>
  <div class="plan"><div class="k">Plan duration</div><div class="v">${esc(plan.duration || R.plan.duration)}</div><div class="k">Recommended frequency</div><div class="v">${esc(plan.frequency || R.plan.frequency)}</div></div>
  <p class="basis">${esc(R.plan.basis)}</p>
  <h2>Your next Restore Review</h2>
  <div class="subhead">Suggested review: ${esc(rep.reviewWindow)}</div>
  <p class="body">${esc(rep.reviewText)}</p>
  <table class="trend"><tr><th></th>${R.domains.map((d) => `<th>${esc(d.label)}</th>`).join('')}</tr><tr><td class="l">Today</td>${R.domains.map((d) => `<td>${esc(d.outcome)}</td>`).join('')}</tr></table>
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
