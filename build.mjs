// Static site generator for the Elements Wellness revamp.
// Usage: node build.mjs  →  writes ./dist
import fs from 'node:fs';
import path from 'node:path';
import { site, categories, services, awards, posts, products, outlets, policies, finderData } from './build/data.mjs';
import home from './build/pages/home.mjs';
import * as P from './build/pages/inner.mjs';
import { pageIndex } from './build/content.mjs';
import { shopProducts } from './build/data.mjs';

const out = path.resolve('dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.cpSync('src/assets', path.join(out, 'assets'), { recursive: true });

const pages = [];
const add = ({ path: p, html, file }) => pages.push({ p, html, file });

add({ path: '/', html: home() });
add(P.servicesIndex());
categories.filter((c) => c.id !== 'spa-ritual').forEach((c) => add(P.categoryPage(c)));
categories.find((c) => c.id === 'facial').subpages.forEach((sp) => add(P.concernPage(categories.find((c) => c.id === 'facial'), sp)));
services.filter((s) => !s.alias).forEach((s) => add(P.servicePage(s)));
shopProducts.forEach((p) => add(P.wcProductPage(p)));
add(P.spaRitual());
add(P.awardsIndex());
awards.forEach((a) => add(P.awardPage(a)));
add(P.blogIndex());
posts.forEach((p) => add(P.postPage(p)));
add(P.healthAnalysis());
add(P.shopIndex());
products.forEach((p) => add(P.productPage(p)));
add(P.promotionsPage());
add(P.giftVouchers());
outlets.forEach((o) => add(P.outletPage(o)));
add(P.contactPage());
add(P.bookPage('/book-appointment/'));
add(P.bookPage('/make-an-appointment-form/'));
add(P.faqPage());
add(P.storyPage());
policies.forEach((p) => add(P.policyPage(p)));
// Every remaining page of the old site keeps its URL and content
Object.keys(pageIndex).forEach((p) => { if (![...pages.map((x) => x.p)].includes(p) && !['/services/', '/spa-ritual/', '/shop/', '/blog/', '/home/'].includes(p)) { const m = P.migratedPage(p); if (m) add(m); } });
add(P.notFound());

const seen = new Set();
for (const { p, html, file } of pages) {
  if (seen.has(p)) { console.warn('duplicate path', p); continue; }
  seen.add(p);
  const dest = file ? path.join(out, p) : path.join(out, p, 'index.html');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
}

// Finder data for the browser (CMS-managed in production)
fs.writeFileSync(path.join(out, 'assets/js/finder-data.js'), `window.EW_FINDER=${JSON.stringify(finderData())};`);

// Legacy URLs referenced by old award cards → 301 targets (Netlify/Vercel-style _redirects)
const redirects = [
  ['/onsen/', '/spa-ritual/onsen-spa/'], ['/massage/', '/services/massage/'], ['/facial/', '/services/facial/'], ['/therapy/', '/services/wellness/'],
  ['/prenatal-massage/', '/services/massage/prenatal-massage/'], ['/sports-massage/', '/services/massage/sports-massage/'],
  ['/lpg-mobilift-facial/', '/services/facial/lpg-mobilift-facial/'], ['/24k-pure-gold-facial/', '/services/facial/24k-pure-gold-facial/'],
  ['/ha-glutathione-power-dose-facial/', '/services/facial/power-dose-facial/'], ['/ginseng-bojin-meridian/', '/services/massage/ginseng-bojin-meridian-massage/'],
  ['/services/massage/menopause-massage/', '/services/massage/'], ['/shop/', '/shop/'],
].filter(([a, b]) => a !== b);
fs.writeFileSync(path.join(out, '_redirects'), redirects.map(([a, b]) => `${a} ${b} 301`).join('\n') + '\n');

// Sitemap + robots
const urls = [...seen].filter((p) => !p.endsWith('.html'));
fs.writeFileSync(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${site.url}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);
fs.writeFileSync(path.join(out, 'assets/img/favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#72181b"/><text x="32" y="43" text-anchor="middle" font-family="Quicksand,Nunito,Arial" font-weight="700" font-size="30" letter-spacing="2" fill="#fffcf8">E</text></svg>`);

console.log(`Built ${seen.size} pages → dist/`);
