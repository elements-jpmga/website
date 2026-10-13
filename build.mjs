// Static site generator for the Elements Wellness revamp.
// Usage: node build.mjs  →  writes ./dist
import fs from 'node:fs';
import path from 'node:path';
import { site, services, awards, posts, outlets, policies, finderData, facialConcerns, massageConcerns } from './build/data.mjs';
import * as SM from './build/sitemap.mjs';
import home from './build/pages/home.mjs';
import * as P from './build/pages/inner.mjs';
import { pageIndex } from './build/content.mjs';

const out = path.resolve('dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.cpSync('src/assets', path.join(out, 'assets'), { recursive: true });

const pages = [];
const add = ({ path: p, html, file }, opts = {}) => pages.push({ p, html, file, inSitemap: opts.inSitemap !== false });

// ---- Pages in the client sitemap (Elements_Website_Sitemap_2026) ----
add({ path: '/', html: home() });
add(P.treatmentLanding('facials'));
facialConcerns.forEach((c) => add(P.concernPage(c)));
SM.facialShared.forEach((p) => add(P.sharedPage(p, 'facials')));
add(P.treatmentLanding('massage'));
massageConcerns.forEach((c) => add(P.concernPage(c)));
add(P.sharedPage(SM.massageBoosters, 'massage'));
add(P.spaLanding());
services.forEach((s) => add(P.servicePage(s)));
add(P.restorePage());
add(P.productsPage());
add(P.productsPage('skincare'));
add(P.productsPage('supplements'));
add(P.giftVouchers());
add(P.giftThankYou(), { inSitemap: false });
add(P.promotionsPage());
add(P.locationsPage());
outlets.forEach((o) => add(P.outletPage(o)));
add(P.storyPage());
add(P.awardsIndex());
add(P.contactPage());
add(P.faqPage());
policies.forEach((p) => add(P.policyPage(p)));

// ---- Needed but not separate sitemap entries: Book Now destination ----
add(P.bookPage('/book-appointment/'));
add(P.bookPage('/make-an-appointment-form/'), { inSitemap: false });

// ---- Kept live but outside the navigation and sitemap.xml (for Elements to decide) ----
// Campaign pages: "add individual campaign pages only where the campaign needs a dedicated destination"
const redirected = new Set(SM.redirects.map(([a]) => a));
const built = () => new Set(pages.map((x) => x.p));
Object.keys(pageIndex).forEach((p) => { if (!built().has(p) && !redirected.has(p) && !['/home/', '/blog/'].includes(p)) { const m = P.migratedPage(p); if (m) add(m, { inSitemap: false }); } });
// Articles & Guides is an optional future section: existing articles stay reachable, unlinked
add(P.blogIndex(), { inSitemap: false });
posts.forEach((p) => add(P.postPage(p), { inSitemap: false }));
add(P.notFound(), { inSitemap: false });

const seen = new Set();
for (const { p, html, file } of pages) {
  if (seen.has(p)) { console.warn('duplicate path', p); continue; }
  seen.add(p);
  const dest = file ? path.join(out, p) : path.join(out, p, 'index.html');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
}

// Finder data for the browser
fs.writeFileSync(path.join(out, 'assets/js/finder-data.js'), `window.EW_FINDER=${JSON.stringify(finderData())};`);

// Legacy URLs → new pages (301). The old per-award pages are now sections of /awards/.
const redirects = [...SM.redirects, ...awards.map((a) => [a.url, '/awards/'])].filter(([a]) => !seen.has(a));
fs.writeFileSync(path.join(out, '_redirects'), redirects.map(([a, b]) => `${a} ${b} 301`).join('\n') + '\n');
// Vercel reads redirects from vercel.json at the project root
fs.writeFileSync('vercel.json', JSON.stringify({ buildCommand: 'node build.mjs', outputDirectory: 'dist', trailingSlash: true, redirects: redirects.flatMap(([source, destination]) => [source, source.replace(/\/$/, '')].filter((x, i, a) => x && a.indexOf(x) === i).map((src) => ({ source: src, destination, permanent: true }))) }, null, 2) + '\n');

// Copywriting status for Elements (generated from build/sitemap.mjs)
const rows = SM.statusRows();
const csvCell = (v) => `"${String(v).replace(/"/g, '""')}"`;
fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync('docs/sitemap-copy-status.csv', [['Section', 'Page', 'URL', 'Page type', 'Copy status', 'Old page (copy source)', 'Items on page', 'Notes'], ...rows.map((r) => [r.section, r.page, r.url, r.type, SM.STATUS[r.status], r.source, r.items, r.note])].map((r) => r.map(csvCell).join(',')).join('\n') + '\n');

// Sitemap + robots
const urls = pages.filter((x) => x.inSitemap && seen.has(x.p) && !x.p.endsWith('.html')).map((x) => x.p);
fs.writeFileSync(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${site.url}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);
fs.writeFileSync(path.join(out, 'assets/img/favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#72181b"/><text x="32" y="43" text-anchor="middle" font-family="Quicksand,Nunito,Arial" font-weight="700" font-size="30" letter-spacing="2" fill="#fffcf8">E</text></svg>`);

console.log(`Built ${seen.size} pages (${urls.length} in sitemap.xml), ${redirects.length} redirects → dist/`);
