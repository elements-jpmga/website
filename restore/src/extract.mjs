// UBIO PDF extraction: render page 1 → OCR → locate the required fields.
// OCR runs on this server: Apple Vision on a Mac (tools/ocr), Tesseract everywhere else (OCR_ENGINE overrides).
// Every field carries a confidence and the OCR line it came from, so staff can verify against the source.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const OCR_BIN = path.resolve(here, '../tools/ocr');
const PY = process.env.PYTHON || 'python3';
const TESSDATA = path.resolve(here, '../tools/tessdata');
export const ocrEngine = process.env.OCR_ENGINE || (fs.existsSync(OCR_BIN) ? 'apple-vision' : 'tesseract');

export async function renderPage(pdfPath, pngPath, dpi = 200) {
  const script = `import fitz,sys\nd=fitz.open(sys.argv[1]); p=d[0]; p.get_pixmap(dpi=${dpi}).save(sys.argv[2]); print(d.page_count)`;
  await run(PY, ['-c', script, pdfPath, pngPath]);
}

export async function ocr(pngPath) {
  const lines = ocrEngine === 'tesseract' ? await tesseract(pngPath) : await appleVision(pngPath);
  return lines.map((o) => ({ ...o, cy: o.y + o.h / 2, cx: o.x + o.w / 2 }));
}

async function appleVision(pngPath) {
  if (!fs.existsSync(OCR_BIN)) throw new Error('OCR tool not built. Run: npm run setup');
  const { stdout } = await run(OCR_BIN, [pngPath], { maxBuffer: 16 * 1024 * 1024 });
  return JSON.parse(stdout);
}

// Tesseract (Apache-2.0) with the bundled English model — nothing leaves the server.
// Sparse-text mode is needed for the UBIO layout (large coloured numbers, titles); numeric/letter words are
// also returned on their own so a value is found even when Tesseract joins it to neighbouring text.
async function tesseract(pngPath) {
  const { createWorker, PSM } = await import('tesseract.js');
  const worker = await createWorker('eng', 1, { langPath: TESSDATA, cachePath: TESSDATA, gzip: false, cacheMethod: 'none', ...(process.env.OCR_DEBUG ? { logger: (m) => console.log(m) } : {}) });
  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
    const buf = fs.readFileSync(pngPath);
    const W = buf.readUInt32BE(16), H = buf.readUInt32BE(20);
    const { data } = await worker.recognize(pngPath, {}, { blocks: true });
    const box = (text, conf, b) => ({ text, confidence: conf / 100, x: b.x0 / W, y: b.y0 / H, w: (b.x1 - b.x0) / W, h: (b.y1 - b.y0) / H });
    const out = [];
    for (const blk of data.blocks || []) for (const par of blk.paragraphs) for (const ln of par.lines) {
      const text = ln.text.trim(); if (!text) continue;
      out.push(box(text, ln.confidence, ln.bbox));
      if (ln.words.length > 1) for (const w of ln.words) { const t = w.text.trim(); if (/^[-+]?\d+(\.\d+)?$|^[A-G]$/.test(t)) out.push(box(t, w.confidence, w.bbox)); }
    }
    return out;
  } finally { await worker.terminate(); }
}

export async function pdfLines(pdfPath, pngPath) {
  await renderPage(pdfPath, pngPath);
  return ocr(pngPath);
}

const num = (s) => { const m = String(s).replace(/[,–—]/g, '-').match(/-?\d+(?:\.\d+)?/); return m ? Number(m[0]) : null; };
const field = (value, conf, source, note) => ({ value, confidence: conf, source: source || null, note: note || null, needsReview: value == null || conf < 0.6 });
const sameRow = (a, b, tol = 0.02) => Math.abs(a.cy - b.cy) < tol;

function detectKind(lines) {
  const t = lines.map((l) => l.text.toLowerCase()).join(' ');
  if (t.includes('stress index report')) return 'stress';
  if (t.includes('vascular age test report')) return 'vascular';
  return 'unknown';
}

function common(lines) {
  const out = {};
  const dt = lines.find((l) => /\b20\d\d-\d\d-\d\d\s+\d\d:\d\d(:\d\d)?/.test(l.text));
  if (dt) { const m = dt.text.match(/(20\d\d-\d\d-\d\d)\s+(\d\d:\d\d(?::\d\d)?)/); out.assessed_at = field(`${m[1]}T${m[2].length === 5 ? m[2] + ':00' : m[2]}`, dt.confidence, dt.text); }
  else out.assessed_at = field(null, 0, null, 'Date/time not found');
  const who = lines.find((l) => /\/\s*(male|female)\s*\/\s*\d+\s*years?/i.test(l.text));
  if (who) {
    const m = who.text.match(/^(.*?)\s*\/\s*(male|female)\s*\/\s*(\d+)\s*years?/i);
    out.client_name = field(m ? m[1].trim().replace(/^\w/, (c) => c.toUpperCase()) : null, who.confidence, who.text);
    out.sex = field(m ? m[2][0].toUpperCase() + m[2].slice(1).toLowerCase() : null, who.confidence, who.text);
    out.age = field(m ? Number(m[3]) : null, who.confidence, who.text);
  } else {
    out.client_name = field(null, 0, null, 'Name line not found'); out.age = field(null, 0, null, 'Age not found'); out.sex = field(null, 0, null, null);
  }
  return out;
}

function stressFields(lines) {
  const out = common(lines);
  // Stress Index: the large number in the left column beneath the "Stress Index" tab
  const label = lines.filter((l) => /^stress index$/i.test(l.text.trim())).sort((a, b) => a.y - b.y)[0];
  let si = null;
  if (label) {
    const cands = lines.filter((l) => l.x < 0.2 && l.y > label.y && l.y < label.y + 0.12 && /^-?\d+(\.\d+)?$/.test(l.text.trim())).sort((a, b) => a.y - b.y);
    if (cands[0]) si = field(num(cands[0].text), cands[0].confidence, cands[0].text);
  }
  // Fallback anchor when the white-on-black label isn't read: the number sits directly above "(38%)"
  const pct = lines.find((l) => l.x < 0.2 && /^\(\d+\s*%\)/.test(l.text.trim()));
  if (!si && pct) {
    const cands = lines.filter((l) => l.x < 0.2 && l.y < pct.y && l.y > pct.y - 0.08 && /^-?\d+(\.\d+)?$/.test(l.text.trim())).sort((a, b) => b.y - a.y);
    if (cands[0]) si = field(num(cands[0].text), cands[0].confidence, cands[0].text, 'Located above the stress percentage');
  }
  out.stress_index = si || field(null, 0, null, 'Stress Index number not found beneath the Stress Index label');
  const pc = lines.find((l) => /complexity\s*=\s*-?\d/i.test(l.text));
  out.pulse_complexity = pc ? field(num(pc.text.match(/complexity\s*=\s*(-?\d+(?:\.\d+)?)/i)[1]), pc.confidence, pc.text) : field(null, 0, null, 'Pulse Complexity not found');
  // Archived-only values (not used by the engine)
  out.archive = { stress_percent: pct ? num(pct.text) : null };
  return out;
}

function vascularFields(lines) {
  const out = common(lines);
  const rows = (re) => lines.filter((l) => re.test(l.text.trim()) && l.x < 0.15); // row labels sit in the left table column
  // Measurement column sits between x≈0.18 and 0.33
  const measurement = (labelRe, valueRe) => {
    for (const lab of rows(labelRe)) {
      const v = lines.filter((l) => l.x > 0.17 && l.x < 0.34 && sameRow(l, lab, 0.03) && valueRe.test(l.text.trim())).sort((a, b) => Math.abs(a.cy - lab.cy) - Math.abs(b.cy - lab.cy))[0];
      if (v) return v;
    }
    return null;
  };
  const vi = measurement(/^vascular age index$/i, /^[-+]?\d+(\.\d+)?$/);
  out.vascular_age_index = vi ? field(num(vi.text), vi.confidence, vi.text) : field(null, 0, null, 'Vascular Age Index measurement not found');
  const vt = measurement(/^vascular age type$/i, /^[A-G]$/i);
  out.vascular_age_type = vt ? field(vt.text.trim().toUpperCase(), vt.confidence, vt.text) : field(null, 0, null, 'Vascular Age Type measurement not found');
  // Cross-check with "Previous Test Results" table (e.g. "B type", "-13") and the type strip highlight
  const prev = lines.filter((l) => /^[A-G]\s*type$/i.test(l.text.trim()) && l.y > 0.6);
  const prevTypes = [...new Set(prev.map((l) => l.text.trim()[0].toUpperCase()))];
  if (out.vascular_age_type.value && prevTypes.length && !prevTypes.includes(out.vascular_age_type.value)) { out.vascular_age_type.needsReview = true; out.vascular_age_type.note = `Previous-results table shows ${prevTypes.join('/')} type — please verify`; }
  else if (out.vascular_age_type.value && prevTypes.includes(out.vascular_age_type.value)) out.vascular_age_type.note = 'Matches previous-results table';
  const ap = measurement(/^average pulse$/i, /^\d+$/);
  out.archive = { average_pulse: ap ? num(ap.text) : null, signal_level: (lines.find((l) => /signal level/i.test(l.text))?.text.match(/(\d+)%/) || [])[1] || null, previous_types: prevTypes };
  return out;
}

export async function extractUbio(pdfPath, pngPath) {
  const lines = await pdfLines(pdfPath, pngPath);
  const kind = detectKind(lines);
  const fields = kind === 'stress' ? stressFields(lines) : kind === 'vascular' ? vascularFields(lines) : common(lines);
  return { kind, fields, lineCount: lines.length, engine: ocrEngine };
}

// Field rules applied to OCR lines from any engine ({text, confidence 0-1, x, y, w, h} normalised to the page)
export function fieldsFromLines(lines) {
  lines = lines.map((o) => ({ ...o, cy: o.y + o.h / 2, cx: o.x + o.w / 2 }));
  const kind = detectKind(lines);
  const fields = kind === 'stress' ? stressFields(lines) : kind === 'vascular' ? vascularFields(lines) : common(lines);
  return { kind, fields, lineCount: lines.length };
}
