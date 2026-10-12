// Checks every internal link in dist/: each must reach a built page directly (not via a redirect, and never a 404).
// Usage: node build.mjs && node scripts/check-links.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = 'dist';
const redirects = new Map(fs.readFileSync(path.join(root, '_redirects'), 'utf8').trim().split('\n').map((l) => l.split(' ')));
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (f !== 'assets') walk(p); } else if (f.endsWith('.html')) files.push(p); } })(root);
const exists = (clean) => { const p = path.join(root, clean); return fs.existsSync(p) && (fs.statSync(p).isFile() || fs.existsSync(path.join(p, 'index.html'))); };
const broken = new Map(), redirected = new Map();
for (const f of files) {
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/href="(\/[^"#?]*)/g)) {
    const u = m[1]; if (u.startsWith('//') || exists(u)) continue;
    const bucket = redirects.has(u) || redirects.has(u + '/') ? redirected : broken;
    bucket.set(u, [...new Set([...(bucket.get(u) || []), f.slice(root.length).replace(/index\.html$/, '')])]);
  }
}
const show = (label, m) => { console.log(`${label}: ${m.size}`); for (const [u, from] of m) console.log(`  ${u}  ← ${from.slice(0, 3).join(', ')}${from.length > 3 ? ` (+${from.length - 3})` : ''}`); };
console.log(`Checked ${files.length} pages`);
show('Broken links', broken);
show('Links going through a redirect', redirected);
process.exit(broken.size ? 1 : 0);
