// Optional OpenAI assistance (OPENAI_API_KEY). Three jobs, all reviewed by staff before anything is used:
//   1. readUbio  — second reader for the four engine readings (page image cropped so no name/age/date is sent)
//   2. draftNotes — internal consultant notes from the engine results
//   3. draftEmail — the message paragraph of the client email
// The AI never changes readings, scores, priorities, programmes or the plan: those come only from the rules engine.
// No client name or contact details are sent for the writing jobs.
import fs from 'node:fs';

const KEY = process.env.OPENAI_API_KEY || '';
export const model = process.env.OPENAI_MODEL || 'gpt-5-mini';
const BASE = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
export const enabled = Boolean(KEY);

async function call({ system, user, schema, name }) {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      response_format: { type: 'json_schema', json_schema: { name, strict: true, schema } },
      store: false,
    }),
    signal: AbortSignal.timeout(60e3),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${body.error?.message || res.statusText}`);
  const msg = body.choices?.[0]?.message;
  if (msg?.refusal) throw new Error('OpenAI declined: ' + msg.refusal);
  return JSON.parse(msg?.content || '{}');
}

/* ---------- 1. Second reader for UBIO PDFs ---------- */
const nullable = (type, extra = {}) => ({ type: [type, 'null'], ...extra });
const READ_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['kind', 'stress_index', 'pulse_complexity', 'vascular_age_type', 'vascular_age_index'],
  properties: {
    kind: { type: 'string', enum: ['stress', 'vascular', 'unknown'] },
    stress_index: nullable('number'),
    pulse_complexity: nullable('number'),
    vascular_age_type: { anyOf: [{ type: 'string', enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] }, { type: 'null' }] },
    vascular_age_index: nullable('number'),
  },
};
const READ_SYSTEM = `You read values from a cropped page of a UBIO health-screening report for a spa's staff. Copy numbers exactly as printed; never estimate, round or infer. If a value is not clearly visible, return null.
Two layouts exist:
- Stress report (shows a "Stress Index" panel and "Pulse Variability (Complexity = …)"): kind = "stress".
  stress_index = the large number in the Stress Index panel (NOT the percentage in brackets under it, NOT the interpretation ranges).
  pulse_complexity = the number after "Complexity =" on the Pulse Variability line.
  Return null for both vascular fields.
- Vascular report (shows "Result of Measurement" with Vascular Age Index and Vascular Age Type rows): kind = "vascular".
  vascular_age_index = the number in the Measurement column of the "Vascular Age Index" row (keep its sign, e.g. -13). Not the "Average Index" and not the scale labels.
  vascular_age_type = the single letter A–G in the Measurement column of the "Vascular Age Type" row (the highlighted type). Not the previous-results table.
  Return null for both stress fields.
Anything else: kind = "unknown" and all values null.`;

export async function readUbio(pngPath) {
  const b64 = fs.readFileSync(pngPath).toString('base64');
  return call({
    name: 'ubio_readings', schema: READ_SCHEMA, system: READ_SYSTEM,
    user: [{ type: 'text', text: 'Read the values from this report page.' }, { type: 'image_url', image_url: { url: `data:image/png;base64,${b64}`, detail: 'high' } }],
  });
}

// Combines the built-in reader's fields with the AI's: agreement raises confidence, any difference is flagged for staff.
export function mergeReadings(kind, fields, ai) {
  if (!ai) return { kind, fields };
  if (ai.error) return { kind, fields, ai: { error: ai.error } };
  const useKind = kind !== 'unknown' ? kind : ai.kind;
  const keys = useKind === 'stress' ? ['stress_index', 'pulse_complexity'] : useKind === 'vascular' ? ['vascular_age_type', 'vascular_age_index'] : [];
  const out = { ...fields };
  const same = (a, b) => (typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) < 1e-9 : String(a).toUpperCase() === String(b).toUpperCase());
  for (const k of keys) {
    const ocr = fields[k] || { value: null, confidence: 0 };
    const a = ai[k];
    if (a == null) { out[k] = { ...ocr, note: [ocr.note, 'AI could not read this value'].filter(Boolean).join(' · ') }; continue; }
    if (ocr.value == null) { out[k] = { value: a, confidence: 0.8, source: `AI (${model})`, note: 'Read by AI only — please check against the PDF', needsReview: true }; continue; }
    if (same(ocr.value, a)) { out[k] = { ...ocr, confidence: Math.max(ocr.confidence, 0.97), note: [ocr.note, 'AI check agrees'].filter(Boolean).join(' · '), needsReview: false }; continue; }
    out[k] = { value: a, confidence: 0.5, source: `AI (${model})`, note: `Built-in reader read ${ocr.value}, AI read ${a} — please check against the PDF`, needsReview: true };
  }
  return { kind: useKind, fields: out, ai: { model, kind: ai.kind, agreed: keys.every((k) => out[k]?.note?.includes('AI check agrees')) } };
}

/* ---------- 2 & 3. Writing help (results only — no client name or contact details) ---------- */
const STYLE = `You write for Elements Wellness, an award-winning spa and wellness group in Singapore. Warm, calm, professional, British/Singapore English spelling. Wellness language only: never diagnose, never claim to treat or cure a medical condition, never mention medication. Do not invent readings, outcomes, treatments, durations or frequencies — use only what is given. Do not change or second-guess any result, priority or plan.`;

function brief(a, rules) {
  const r = a.result;
  const progs = r.programs.map((code) => {
    const p = rules.programs[code]; const s = (a.selections || []).find((x) => x.program === code) || {};
    const comps = p.components.map((c, i) => (i === 0 ? c.options[0] : i === 1 ? s.component2 || c.options.join(' or ') : s.component3 || c.options.join(' or ')));
    return `${p.name}: ${comps.join(' + ')}${s.enhancer ? ` + optional enhancer ${p.enhancer}` : ''}. Benefit: ${p.benefit}`;
  });
  const flags = Object.entries(a.plan?.suitability || {}).filter(([, v]) => v).map(([k]) => k);
  return [
    `Client: ${a.client_age ? `age ${a.client_age}` : 'age not recorded'}${a.client_sex ? `, ${a.client_sex.toLowerCase()}` : ''}.`,
    'Restore results (from the rules engine — final):',
    ...r.domains.map((d) => `- ${d.label}: ${d.outcome} (${d.readings}; ideal ${d.idealRange.replace(/\n/g, ', ')})`),
    `Restore Priority: ${r.priorityLabel}. ${r.priorityText}`,
    `Programme(s): ${progs.join(' | ')}`,
    `Restore Plan: ${r.plan.duration}, ${r.plan.frequency}. Next review in ${rules.report.reviewWindow}.`,
    flags.length ? `Suitability points the consultant ticked: ${flags.join(', ')}.` : '',
  ].filter(Boolean).join('\n');
}

export async function draftNotes(a, rules) {
  const out = await call({
    name: 'consultant_notes', schema: { type: 'object', additionalProperties: false, required: ['notes'], properties: { notes: { type: 'string' } } },
    system: `${STYLE}\nYou are drafting INTERNAL notes for the consultant (the client does not see them). Plain text, no markdown headings. Under 160 words. Sections as short lines: "Focus:", "Talking points:" (2–4 bullets with "- "), "During treatment:" (1–2 bullets), "Next review:". Practical and specific to these results.`,
    user: brief(a, rules),
  });
  return out.notes.trim();
}

export async function draftEmail(a, rules) {
  const out = await call({
    name: 'client_email', schema: { type: 'object', additionalProperties: false, required: ['message'], properties: { message: { type: 'string' } } },
    system: `${STYLE}\nWrite ONLY the body paragraphs of an email to the client that accompanies their attached Restore Profile PDF. No greeting line (no "Dear …"), no sign-off, no name, no subject. 2–3 short paragraphs, under 120 words, separated by a blank line. Thank them, explain their Restore Priority and plan in simple encouraging words, and invite them to reply or speak to the team at their next visit. Do not quote numbers unless helpful; never alarm.`,
    user: brief(a, rules),
  });
  return out.message.trim();
}
