// Elements Restore Interpretation Engine — pure functions, driven entirely by a rules object.
// Each domain is interpreted independently; consultant input never changes these scores.

const inBand = (v, b) => (b.min == null || v >= b.min) && (b.max == null || v < b.max);

export function validateReadings(r) {
  const errors = {};
  const num = (k) => (r[k] === '' || r[k] == null || Number.isNaN(Number(r[k]))) ? null : Number(r[k]);
  const si = num('stress_index'), pc = num('pulse_complexity'), vi = num('vascular_age_index');
  const vt = String(r.vascular_age_type || '').trim().toUpperCase();
  if (si == null || si < 0 || si > 200) errors.stress_index = 'Enter the Stress Index (0-200).';
  if (pc == null || pc < 0 || pc > 200) errors.pulse_complexity = 'Enter the Pulse Complexity (0-200).';
  if (!/^[A-G]$/.test(vt)) errors.vascular_age_type = 'Enter the Vascular Age Type (A-G).';
  if (vi == null || vi < -100 || vi > 100) errors.vascular_age_index = 'Enter the Vascular Age Index (-100 to +100).';
  return { ok: Object.keys(errors).length === 0, errors, clean: { stress_index: si, pulse_complexity: pc, vascular_age_type: vt, vascular_age_index: vi } };
}

function scalar(domainRules, value) {
  const band = domainRules.bands.find((b) => inBand(value, b));
  if (!band) throw new Error(`No band for ${domainRules.label} value ${value}`);
  return { outcome: band.outcome, severity: band.severity };
}

function circulation(rules, type, index) {
  const group = rules.typeGroups[type];
  if (!group) throw new Error(`Unknown Vascular Age Type ${type}`);
  // Index bands: favourable ≤ +5, monitor +6..+20, review > +20 (integers as read from the UBIO device)
  const ib = rules.indexBands.find((b) => inBand(index, b));
  const [outcome, severity] = rules.matrix[group][ib.key];
  return { outcome, severity, group, indexKey: ib.key };
}

export function evaluate(readingsIn, rules) {
  const v = validateReadings(readingsIn);
  if (!v.ok) throw Object.assign(new Error('Invalid readings'), { errors: v.errors });
  const r = v.clean;
  const D = rules.domains;
  const s = scalar(D.stress, r.stress_index);
  const rc = scalar(D.recovery, r.pulse_complexity);
  const c = circulation(D.circulation, r.vascular_age_type, r.vascular_age_index);

  const domains = [
    { id: 'stress', label: D.stress.label, outcome: s.outcome, severity: s.severity, readings: `${D.stress.readingLabel}: ${fmt(r.stress_index)}`, idealRange: D.stress.idealRange, explanation: D.stress.explanations[s.outcome] },
    { id: 'recovery', label: D.recovery.label, outcome: rc.outcome, severity: rc.severity, readings: `${D.recovery.readingLabel}: ${fmt(r.pulse_complexity)}`, idealRange: D.recovery.idealRange, explanation: D.recovery.explanations[rc.outcome] },
    { id: 'circulation', label: D.circulation.label, outcome: c.outcome, severity: c.severity, readings: `Vascular Age Type: ${r.vascular_age_type}   |   Vascular Age Index: ${fmtSigned(r.vascular_age_index)}`, idealRange: D.circulation.idealRange, explanation: D.circulation.explanations[c.outcome] },
  ];

  // Priorities: every domain with severity >= threshold, severity 3 before 2 (display order otherwise stress, recovery, circulation)
  const th = rules.priority.threshold;
  const priorities = domains.filter((d) => d.severity >= th).sort((a, b) => b.severity - a.severity).map((d) => d.id);
  const maintain = priorities.length === 0;
  const programs = maintain ? [rules.priority.maintainProgram] : priorities.map((p) => rules.priority.programByDomain[p]);
  const plan = rules.plan.find((p) => p.priorities === priorities.length);

  return {
    rulesVersion: rules.version,
    readings: r,
    domains,
    priorities,
    maintain,
    priorityLabel: maintain ? 'Maintain' : priorities.map((p) => D[p].label.split(' ')[0]).join(' + '),
    programs,
    plan: { count: priorities.length, ...plan },
    priorityText: priorityText(domains, priorities, rules),
  };
}

function priorityText(domains, priorities, rules) {
  const byId = Object.fromEntries(domains.map((d) => [d.id, d]));
  const fav = domains.filter((d) => !priorities.includes(d.id));
  const name = (d) => d.label;
  const low = (d) => d.outcome.toLowerCase();
  if (!priorities.length) {
    return `Your Stress Load, Recovery Capacity and Circulation readings are all within the no-attention range today, so your Restore Priority is Maintain. ${rules.priority.focus.maintain}`;
  }
  const favPart = fav.length ? `Your ${fav.map(name).join(' and ')} reading${fav.length > 1 ? 's are' : ' is'} favourable. ` : '';
  if (priorities.length === 1) {
    const d = byId[priorities[0]];
    return `${favPart}Your ${d.label} is ${low(d)}, so ${d.label.split(' ')[0]} is your Restore Priority today. The focus is on ${rules.priority.focusLine?.[d.id] || rules.priority.focus[d.id].replace(/\.$/, '').replace(/^./, (c) => c.toLowerCase())}.`;
  }
  const list = priorities.map((p) => `${byId[p].label} (${low(byId[p])})`);
  const names = priorities.map((p) => byId[p].label.split(' ')[0]);
  return `${favPart}Your ${list.slice(0, -1).join(', ')} and ${list.slice(-1)} readings need attention, so your Restore Priorities today are ${names.join(', ')}. The focus is on ${priorities.map((p) => rules.priority.focus[p].replace(/\.$/, '').replace(/^./, (c) => c.toLowerCase())).join('; ')}.`;
}

const fmt = (n) => (Number.isInteger(n) ? String(n) : String(+n.toFixed(2)));
const fmtSigned = (n) => (n > 0 ? '+' : '') + fmt(n);
