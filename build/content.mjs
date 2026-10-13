// Renders the scraped content blocks of an original elements.com.sg page in the new design language.
// The information stays exactly as on the old site; only presentation changes.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { esc, icon, btn, faqList } from './ui.mjs';
import { resolveUrl } from './data.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, '_research/pages');
export const pageIndex = fs.existsSync(path.join(dir, '_index.json')) ? JSON.parse(fs.readFileSync(path.join(dir, '_index.json'), 'utf8')) : {};
const cache = {};
export const oldPage = (p) => {
  const key = p.replace(/^\/|\/$/g, '').replace(/\//g, '__') || 'home';
  if (cache[key] !== undefined) return cache[key];
  const f = path.join(dir, key + '.json');
  cache[key] = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
  return cache[key];
};

const strip = (h = '') => h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#8211;|&#8217;/g, ' ').replace(/&amp;/g, '&').replace(/&#038;/g, '&').replace(/\s+/g, ' ').trim();
const isLabel = (t) => t.length > 1 && t.length <= 42 && t === t.toUpperCase() && /[A-Z]/.test(t) && !/[.!?]$/.test(t);
// Internal links in old copy point at old URLs: send them to the page that replaced it
const fixHref = (h = '#') => { const local = /^https?:\/\/(www\.)?elements\.com\.sg/.test(h) ? h.replace(/^https?:\/\/(www\.)?elements\.com\.sg/, '') || '/' : h; return (local.startsWith('/') && !/\.(pdf|jpe?g|png|webp)$/i.test(local) ? resolveUrl(local) : local) || '#'; };
const bookLink = (t, h) => (/book|appointment/i.test(t) && (!h || h === '#' || /wpforms|#/.test(h)) ? '/book-appointment/' : fixHref(h));
const listify = (html) => {
  // "– item" / "• item" paragraphs → proper lists
  const parts = html.split(/(?=<p>)/);
  let out = '', buf = [];
  const flush = () => { if (buf.length) { out += `<ul class="checklist">${buf.map((x) => `<li>${x}</li>`).join('')}</ul>`; buf = []; } };
  for (const p of parts) {
    const m = p.match(/^<p>\s*(?:[–\-•·✓]|&#8211;|&ndash;)\s*(.*?)<\/p>\s*$/s);
    if (m) buf.push(m[1]); else { flush(); out += p; }
  }
  flush(); return out;
};
const fixLinks = (html) => html.replace(/href="([^"]*)"/g, (m, h) => `href="${fixHref(h)}"`);
const ytEmbed = (u = '') => { const m = u.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{6,})/); return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : u; };

/** Pick out what the page hero shows (title, first photo, label, price line, book button, tagline) and return everything else
    in its original order — nothing between them is dropped. */
export function splitHero(page, title, { keepAll = false } = {}) {
  const blocks = [...page.blocks];
  const head = blocks.slice(0, 9), drop = new Set();
  let heroImg = null, tagline = '', price = '', label = '';
  const isTitle = (b) => b.t === 'heading' && strip(b.text).toLowerCase() === strip(title).toLowerCase();
  head.forEach((b, i) => {
    if (isTitle(b)) drop.add(i);
    else if (b.t === 'image' && !heroImg && b.w >= 420) { heroImg = b.src; drop.add(i); }
    else if (keepAll) return;
    else if (b.t === 'html' && i < 2 && isLabel(strip(b.html))) { label = strip(b.html); drop.add(i); }
    else if (b.t === 'html' && !price && /U\.P\.|first trial|S\$\s?\d|\d+\s*-?\s*mins?/i.test(strip(b.html)) && strip(b.html).length < 90) { price = strip(b.html); drop.add(i); }
    else if (b.t === 'button' && /book/i.test(b.text)) drop.add(i);
  });
  // tagline: the first short sentence right after the title, if the page opens that way
  const ti = head.findIndex(isTitle);
  if (ti >= 0) { const n = blocks[ti + 1]; if (n && n.t === 'html' && !drop.has(ti + 1) && strip(n.html).length < 140 && !isLabel(strip(n.html)) && !/U\.P\./.test(strip(n.html))) { tagline = strip(n.html); drop.add(ti + 1); } }
  const hasHero = ti >= 0 || head.some((b) => b.t === 'button' && /book/i.test(b.text));
  if (!hasHero) { // not a hero-style page: only the duplicate title goes
    return { heroImg: null, tagline: '', price: '', label: '', rest: blocks.filter((b) => !isTitle(b)) };
  }
  return { heroImg, tagline, price, label, rest: blocks.filter((b, i) => !drop.has(i)) };
}

/** Blocks → HTML in the new design. */
export function renderBlocks(blocks, opts = {}) {
  // Old pages list skin types etc. as a small icon followed by a short heading; keep them together in a row
  const merged = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i], n = blocks[i + 1];
    const nt = n && (n.t === 'heading' ? strip(n.text) : n.t === 'html' ? strip(n.html) : '');
    if (b.t === 'image' && b.w && b.w < 260 && nt && nt.length <= 40) { merged.push({ t: 'iconitem', src: b.src, alt: b.alt, title: nt }); i++; continue; }
    merged.push(b);
  }
  blocks = [];
  for (const b of merged) { const last = blocks[blocks.length - 1]; if (b.t === 'iconitem') { if (last?.t === 'icongroup') last.items.push(b); else blocks.push({ t: 'icongroup', items: [b] }); } else blocks.push(b); }
  const seenImg = new Set(opts.skipImages || []), seenText = new Set();
  const out = []; let imgRun = [];
  const flushImgs = () => { if (!imgRun.length) return;
    const small = imgRun.every((i) => (i.w && i.w < 420) || /\/-[0-9a-f]{12}\.jpg$/.test(i.src) || /\/pages\/(icon|logo)/.test(i.src));
    if (small) { out.push(`<div class="cf-icons">${imgRun.map((i) => `<img class="cf-icon" src="${i.src}" alt="${esc(i.alt)}" loading="lazy" width="${i.w}" height="${i.h}">`).join('')}</div>`); imgRun = []; return; }
    out.push(imgRun.length === 1 ? `<figure class="cf-figure" data-reveal><img src="${imgRun[0].src}" alt="${esc(imgRun[0].alt)}" loading="lazy">${imgRun[0].caption ? `<figcaption>${esc(imgRun[0].caption)}</figcaption>` : ''}</figure>` : `<div class="cf-gallery c${Math.min(imgRun.length, 3)}">${imgRun.map((i) => `<figure data-reveal><img src="${i.src}" alt="${esc(i.alt)}" loading="lazy"></figure>`).join('')}</div>`); imgRun = []; };
  for (const b of blocks) {
    if (b.t !== 'image') flushImgs();
    switch (b.t) {
      case 'heading': {
        const t = strip(b.text); if (!t || seenText.has(t.toLowerCase())) break; seenText.add(t.toLowerCase());
        if (isLabel(t)) out.push(`<span class="cf-label" data-reveal>${esc(t)}</span>`);
        else out.push(b.level <= 2 ? `<h2 class="cf-h2" data-split>${esc(t)}</h2>` : `<h3 class="cf-h3" data-reveal>${esc(t)}</h3>`);
        break;
      }
      case 'html': {
        const t = strip(b.html); if (!t) break;
        if (seenText.has(t.toLowerCase())) break; seenText.add(t.toLowerCase());
        if (isLabel(t)) out.push(`<span class="cf-label" data-reveal>${esc(t)}</span>`);
        else if (/^[“"]/.test(t) && t.length < 320) out.push(`<blockquote class="cf-quote" data-reveal>${esc(t.replace(/^[“"]|[”"]$/g, ''))}</blockquote>`);
        else if (t.length < 60 && !/[.!?:]$/.test(t) && /^<p>(<strong>|<b>)?[^<]{2,60}(<\/strong>|<\/b>)?<\/p>$/.test(b.html.trim())) out.push(`<h3 class="cf-h3 small" data-reveal>${esc(t)}</h3>`);
        else out.push(`<div class="cf-prose prose" data-reveal>${listify(fixLinks(b.html))}</div>`);
        break;
      }
      case 'image': if (!seenImg.has(b.src)) { seenImg.add(b.src); imgRun.push(b); } break;
      case 'gallery': out.push(`<div class="cf-gallery c3">${b.images.filter((i) => !seenImg.has(i.src)).map((i) => { seenImg.add(i.src); return `<figure data-reveal><img src="${i.src}" alt="${esc(i.alt)}" loading="lazy"></figure>`; }).join('')}</div>`); break;
      case 'button': out.push(`<div class="cf-actions" data-reveal>${btn(bookLink(b.text, b.href), b.text.replace(/\s+/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()))}</div>`); break;
      case 'list': out.push(`<ul class="checklist" data-reveal>${b.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`); break;
      case 'faq': out.push(`<div class="cf-faq">${faqList(b.items.map((i) => ({ q: i.q, a: fixLinks(i.a) })))}</div>`); break;
      case 'card': out.push(`<div class="cf-card" data-reveal>${b.img ? `<img src="${b.img}" alt="" loading="lazy">` : ''}<div>${b.title ? `<h3>${esc(b.title)}</h3>` : ''}${b.html ? `<div class="prose">${fixLinks(b.html)}</div>` : ''}${b.href ? `<a class="link-arrow" href="${fixHref(b.href)}">Learn more ${icon.arrow}</a>` : ''}</div></div>`); break;
      case 'icongroup': out.push(`<div class="cf-icon-row" data-reveal>${b.items.map((i) => `<div class="cf-icon-item"><img src="${i.src}" alt="${esc(i.alt || '')}" loading="lazy"><span>${esc(i.title)}</span></div>`).join('')}</div>`); break;
      case 'quote': out.push(`<blockquote class="cf-quote" data-reveal>${esc(b.text)}${b.who ? `<cite>${esc(b.who)}</cite>` : ''}</blockquote>`); break;
      case 'video': if (b.url) out.push(`<div class="cf-video" data-reveal><iframe src="${ytEmbed(b.url)}" title="Video" loading="lazy" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`); break;
      case 'map': if (b.src) out.push(`<div class="cf-video map" data-reveal><iframe src="${b.src}" title="Map" loading="lazy"></iframe></div>`); break;
      case 'stat': out.push(`<div class="cf-stat" data-reveal><b>${esc(b.value)}</b><span>${esc(b.label)}</span></div>`); break;
      case 'form': out.push(opts.form || `<form class="form cf-form" data-demo data-reveal><div class="row"><div class="field"><label>Name</label><input required autocomplete="name"></div><div class="field"><label>Mobile</label><input type="tel" required autocomplete="tel"></div></div><div class="field"><label>Email</label><input type="email" autocomplete="email"></div><button class="btn" type="submit"><span>Submit</span></button></form>`); break;
    }
  }
  flushImgs();
  // Group consecutive cards into a grid
  return out.join('\n').replace(/(<div class="cf-card"[\s\S]*?<\/div><\/div>\n?){2,}/g, (m) => `<div class="cf-cards">${m}</div>`);
}

/** The prose that follows a heading on an old page (until the next heading) — used for single items on shared pages. */
export function sectionAfter(page, re) {
  if (!page) return '';
  const i = page.blocks.findIndex((b) => b.t === 'heading' && re.test(strip(b.text)));
  if (i < 0) return '';
  const out = [];
  for (const b of page.blocks.slice(i + 1)) { if (b.t === 'heading') break; if (b.t === 'html') out.push(fixLinks(b.html)); if (b.t === 'list') out.push(`<ul>${b.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`); }
  return out.join('');
}
