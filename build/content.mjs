// Renders the scraped content blocks of an original elements.com.sg page in the new design language.
// The information stays exactly as on the old site; only presentation changes.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { esc, icon, btn, faqList } from './ui.mjs';

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

const strip = (h = '') => h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#8211;|&#8217;/g, ' ').replace(/\s+/g, ' ').trim();
const isLabel = (t) => t.length > 1 && t.length <= 42 && t === t.toUpperCase() && /[A-Z]/.test(t) && !/[.!?]$/.test(t);
const fixHref = (h = '#') => (/^https?:\/\/(www\.)?elements\.com\.sg/.test(h) ? h.replace(/^https?:\/\/(www\.)?elements\.com\.sg/, '') : h) || '#';
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
const ytEmbed = (u = '') => { const m = u.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{6,})/); return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : u; };

/** Remove blocks that our page hero already shows (label, title, hero image, tagline, book button, price line). */
export function splitHero(page, title) {
  const blocks = [...page.blocks];
  let heroImg = null, tagline = '', price = '', label = '';
  const head = blocks.slice(0, 9);
  let cut = -1;
  head.forEach((b, i) => {
    if (b.t === 'image' && !heroImg) { heroImg = b.src; cut = Math.max(cut, i); }
    if (b.t === 'heading' && strip(b.text).toLowerCase() === strip(title).toLowerCase()) cut = Math.max(cut, i);
    if (b.t === 'html' && isLabel(strip(b.html)) && i < 2) { label = strip(b.html); cut = Math.max(cut, i); }
    if (b.t === 'html' && /U\.P\.|first trial|S\$\s?\d|\d+\s*-?\s*mins?/i.test(strip(b.html)) && strip(b.html).length < 90) { price = strip(b.html); cut = Math.max(cut, i); }
    if (b.t === 'button' && /book/i.test(b.text)) cut = Math.max(cut, i);
    if (b.t === 'html' && !tagline && i > 0 && i <= cut + 1 && strip(b.html).length < 140 && !isLabel(strip(b.html)) && !/U\.P\./.test(strip(b.html))) { tagline = strip(b.html); }
  });
  // Only treat as a "hero group" when a title heading or book button was found near the top
  const hasHero = head.some((b, i) => i <= cut && ((b.t === 'heading' && strip(b.text).toLowerCase() === strip(title).toLowerCase()) || (b.t === 'button' && /book/i.test(b.text))));
  const rest = hasHero ? blocks.slice(cut + 1) : blocks.filter((b) => !(b.t === 'heading' && strip(b.text).toLowerCase() === strip(title).toLowerCase()));
  if (hasHero && tagline && rest[0]?.t === 'html' && strip(rest[0].html) === tagline) rest.shift();
  return { heroImg, tagline: hasHero ? tagline : '', price, label, rest };
}

/** Blocks → HTML in the new design. */
export function renderBlocks(blocks, opts = {}) {
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
        else out.push(`<div class="cf-prose prose" data-reveal>${listify(b.html)}</div>`);
        break;
      }
      case 'image': if (!seenImg.has(b.src)) { seenImg.add(b.src); imgRun.push(b); } break;
      case 'gallery': out.push(`<div class="cf-gallery c3">${b.images.filter((i) => !seenImg.has(i.src)).map((i) => { seenImg.add(i.src); return `<figure data-reveal><img src="${i.src}" alt="${esc(i.alt)}" loading="lazy"></figure>`; }).join('')}</div>`); break;
      case 'button': out.push(`<div class="cf-actions" data-reveal>${btn(bookLink(b.text, b.href), b.text.replace(/\s+/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()))}</div>`); break;
      case 'list': out.push(`<ul class="checklist" data-reveal>${b.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`); break;
      case 'faq': out.push(`<div class="cf-faq">${faqList(b.items.map((i) => ({ q: i.q, a: i.a })))}</div>`); break;
      case 'card': out.push(`<div class="cf-card" data-reveal>${b.img ? `<img src="${b.img}" alt="" loading="lazy">` : ''}<div>${b.title ? `<h3>${esc(b.title)}</h3>` : ''}${b.html ? `<div class="prose">${b.html}</div>` : ''}${b.href ? `<a class="link-arrow" href="${fixHref(b.href)}">Learn more ${icon.arrow}</a>` : ''}</div></div>`); break;
      case 'quote': out.push(`<blockquote class="cf-quote" data-reveal>${esc(b.text)}${b.who ? `<cite>${esc(b.who)}</cite>` : ''}</blockquote>`); break;
      case 'video': if (b.url) out.push(`<div class="cf-video" data-reveal><iframe src="${ytEmbed(b.url)}" title="Video" loading="lazy" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`); break;
      case 'map': if (b.src) out.push(`<div class="cf-video map" data-reveal><iframe src="${b.src}" title="Map" loading="lazy"></iframe></div>`); break;
      case 'stat': out.push(`<div class="cf-stat" data-reveal><b>${esc(b.value)}</b><span>${esc(b.label)}</span></div>`); break;
      case 'form': out.push(`<div class="cf-form" data-reveal><span class="placeholder-note">Enquiry form — connects to the booking system in the backend phase</span></div>`); break;
    }
  }
  flushImgs();
  // Group consecutive cards into a grid
  return out.join('\n').replace(/(<div class="cf-card"[\s\S]*?<\/div><\/div>\n?){2,}/g, (m) => `<div class="cf-cards">${m}</div>`);
}
