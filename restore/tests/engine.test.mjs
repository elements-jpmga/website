import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { evaluate, validateReadings } from '../src/engine.mjs';

const rules = JSON.parse(fs.readFileSync(new URL('../rules/v1.json', import.meta.url)));
const run = (stress_index, pulse_complexity, vascular_age_type, vascular_age_index) => evaluate({ stress_index, pulse_complexity, vascular_age_type, vascular_age_index }, rules);
const out = (r) => Object.fromEntries(r.domains.map((d) => [d.id, [d.outcome, d.severity]]));

test('Leslie sample: Stress 47, PC 30.11, Type B, Index -13', () => {
  const r = run(47, 30.11, 'B', -13);
  assert.deepEqual(out(r), { stress: ['Elevated', 2], recovery: ['Favourable', 0], circulation: ['Favourable', 0] });
  assert.deepEqual(r.priorities, ['stress']);
  assert.deepEqual(r.programs, ['STRESS']);
  assert.equal(r.plan.duration, '3 months');
  assert.equal(r.plan.frequency, '1-2 sessions per week');
  assert.match(r.priorityText, /Stress is your Restore Priority today/);
});

test('Maintain case: Stress <35, Recovery 30+, Circulation severity 0-1', () => {
  const r = run(30, 45, 'A', 12); // Mild (1) + Favourable (0) + Favourable - Monitor Index (1)
  assert.deepEqual(out(r), { stress: ['Mild', 1], recovery: ['Favourable', 0], circulation: ['Favourable - Monitor Index', 1] });
  assert.equal(r.maintain, true);
  assert.equal(r.priorityLabel, 'Maintain');
  assert.deepEqual(r.programs, ['CIRCULATION']);
  assert.equal(r.plan.duration, 'Ongoing maintenance');
  assert.equal(r.plan.frequency, 'Once every 2 weeks');
});

test('Two-priority case: severity 3 listed before 2', () => {
  const r = run(40, 15, 'B', 0); // Stress Elevated (2), Recovery Needs Support (3), Circulation Favourable (0)
  assert.deepEqual(r.priorities, ['recovery', 'stress']);
  assert.deepEqual(r.programs, ['RECOVERY', 'STRESS']);
  assert.equal(r.plan.duration, '6 months');
  assert.equal(r.plan.frequency, 'Month 1: 2 sessions/week; Months 2-6: 1 session/week');
});

test('Three-priority case', () => {
  const r = run(75, 25, 'E', 30);
  assert.deepEqual(r.priorities, ['stress', 'circulation', 'recovery']);
  assert.deepEqual(r.programs, ['STRESS', 'CIRCULATION', 'RECOVERY']);
  assert.equal(r.plan.duration, '6 months');
  assert.equal(r.plan.frequency, 'Months 1-2: 2 sessions/week; Months 3-6: 1 session/week');
});

test('Engine spreadsheet example (Lucy): 60 / 68.86 / B / -9', () => {
  const r = run(60, 68.86, 'B', -9);
  assert.deepEqual(out(r), { stress: ['High', 3], recovery: ['Favourable', 0], circulation: ['Favourable', 0] });
  assert.deepEqual(r.programs, ['STRESS']);
});

test('Stress band edges', () => {
  assert.equal(run(24.99, 40, 'A', 0).domains[0].outcome, 'Low');
  assert.equal(run(25, 40, 'A', 0).domains[0].outcome, 'Mild');
  assert.equal(run(34.99, 40, 'A', 0).domains[0].outcome, 'Mild');
  assert.equal(run(35, 40, 'A', 0).domains[0].outcome, 'Elevated');
  assert.equal(run(59.99, 40, 'A', 0).domains[0].outcome, 'Elevated');
  assert.equal(run(60, 40, 'A', 0).domains[0].outcome, 'High');
});

test('Recovery band edges', () => {
  assert.equal(run(10, 19.99, 'A', 0).domains[1].outcome, 'Needs Support');
  assert.equal(run(10, 20, 'A', 0).domains[1].outcome, 'Reduced');
  assert.equal(run(10, 29.99, 'A', 0).domains[1].outcome, 'Reduced');
  assert.equal(run(10, 30, 'A', 0).domains[1].outcome, 'Favourable');
});

test('Circulation matrix', () => {
  const c = (t, i) => run(10, 40, t, i).domains[2];
  assert.deepEqual([c('A', -30).outcome, c('B', 5).outcome, c('B', 6).outcome, c('B', 20).outcome, c('A', 21).outcome], ['Favourable', 'Favourable', 'Favourable - Monitor Index', 'Favourable - Monitor Index', 'Favourable Pattern - Index Needs Review']);
  assert.equal(c('A', 21).severity, 3);
  assert.deepEqual([c('C', 0).outcome, c('D', 15).outcome, c('C', 25).outcome], ['Monitor', 'Monitor', 'Needs Attention']);
  assert.deepEqual([c('E', -10).severity, c('F', 10).severity, c('G', 50).severity], [3, 3, 3]);
});

test('Invalid readings are rejected, never guessed', () => {
  const v = validateReadings({ stress_index: '', pulse_complexity: 'abc', vascular_age_type: 'H', vascular_age_index: 500 });
  assert.equal(v.ok, false);
  assert.deepEqual(Object.keys(v.errors).sort(), ['pulse_complexity', 'stress_index', 'vascular_age_index', 'vascular_age_type']);
  assert.throws(() => run('', 30, 'B', 0));
});
