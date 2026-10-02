// Shared UI pieces: icons, logo, layout shell (header, menus, finder, footer).
import { site, services, categories, outlets } from './data.mjs';

export const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const icon = {
  arrow: '<svg class="arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M1 8h13M9 3l5 5-5 5"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  close: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 2l14 14M16 2 2 16"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m2 3.5 3 3 3-3"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.5-.2Z"/></svg>',
  ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/></svg>',
  fb: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 8.5V6.8c0-.8.2-1.3 1.4-1.3H17V2.3A21 21 0 0 0 14.6 2C12.2 2 10.6 3.5 10.6 6.2v2.3H8v3.3h2.6V22H14V11.8h2.7l.4-3.3H14Z"/></svg>',
  yt: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 8.2a3 3 0 0 0-2.1-2.1C18 5.6 12 5.6 12 5.6s-6 0-7.9.5A3 3 0 0 0 2 8.2 31 31 0 0 0 1.6 12 31 31 0 0 0 2 15.8a3 3 0 0 0 2.1 2.1c1.9.5 7.9.5 7.9.5s6 0 7.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .4-3.8 31 31 0 0 0-.4-3.8ZM10 15V9l5.2 3L10 15Z"/></svg>',
  tt: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 2h-3.3v13.2a2.8 2.8 0 1 1-2-2.7V9.1a6.2 6.2 0 1 0 5.3 6.1V8.6a7.9 7.9 0 0 0 4.4 1.3V6.6a4.5 4.5 0 0 1-4.4-4.6Z"/></svg>',
  xhs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M7.5 10h9M7.5 14h9M12 8v8"/></svg>',
  // Promise icons
  leaf: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M10 38C10 20 22 10 40 8c-1 18-10 30-28 30Z"/><path d="M10 38 28 20"/></svg>',
  award: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="24" cy="19" r="11"/><path d="m17 28-3 14 10-5 10 5-3-14"/><path d="m24 13 1.8 3.7 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6L24 13Z"/></svg>',
  hands: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8 30c4-2 8-2 12 0l8 4c2 1 2 4-1 4h-8"/><path d="M8 26v14M40 22c-3-6-10-9-16-6"/><circle cx="30" cy="12" r="5"/></svg>',
  pin: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M24 44S10 30 10 19a14 14 0 1 1 28 0c0 11-14 25-14 25Z"/><circle cx="24" cy="19" r="5"/></svg>',
  wave: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 18c5-5 9-5 13 0s8 5 13 0 9-5 14 0M4 28c5-5 9-5 13 0s8 5 13 0 9-5 14 0M4 38c5-5 9-5 13 0s8 5 13 0 9-5 14 0"/></svg>',
};

export const logo = (tag = 'span', cls = '') => `<${tag} class="logo ${cls}"><span class="logo-type l1">Elements</span><span class="logo-type l2">Wellness</span></${tag}>`;

// The five-element ring (木 火 土 金 水) used as the brand motif.
export const ring = (opts = {}) => {
  const els = [['木', 'Wood'], ['火', 'Fire'], ['土', 'Earth'], ['金', 'Metal'], ['水', 'Water']];
  const R = 200, cx = 260, cy = 260;
  const pts = els.map((_, i) => { const a = (-90 + i * 72) * Math.PI / 180; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });
  const star = [0, 2, 4, 1, 3, 0].map((i) => pts[i].join(',')).join(' ');
  const nodes = els.map(([g, n], i) => `<g class="node"><circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="38" fill="${opts.dark ? '#4a0e11' : '#fffcf8'}" stroke="currentColor" stroke-opacity=".3"/><text class="ring-glyph" x="${pts[i][0]}" y="${pts[i][1] + 10}" text-anchor="middle" ${opts.dark ? 'style="fill:#ecd9d2"' : ''}>${g}</text></g>`).join('');
  const labels = els.map(([, n], i) => { const a = (-90 + i * 72) * Math.PI / 180; const x = cx + (R + 62) * Math.cos(a), y = cy + (R + 62) * Math.sin(a) + 4; return `<text class="ring-label" x="${x}" y="${y}" text-anchor="middle" ${opts.dark ? 'style="fill:#c99a8f"' : ''}>${n}</text>`; }).join('');
  return `<div class="elements-ring" data-ring style="color:${opts.dark ? '#ecd9d2' : '#72181b'}">
  <svg viewBox="0 0 520 520" aria-hidden="true">
    <g class="spin">
      <circle class="ring-draw" cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="currentColor" stroke-opacity=".35"/>
      <circle class="ring-draw" cx="${cx}" cy="${cy}" r="${R - 70}" fill="none" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="2 6"/>
      <polyline class="ring-draw" points="${star}" fill="none" stroke="currentColor" stroke-opacity=".22"/>
      ${nodes}
      ${labels}
    </g>
  </svg>
  <div class="ring-center">${opts.center || logo()}</div>
</div>`;
};

export const btn = (href, label, cls = '', attrs = '') => `<a class="btn ${cls}" href="${href}" ${attrs}><span>${label}</span>${icon.arrow}</a>`;
export const linkArrow = (href, label, attrs = '') => `<a class="link-arrow" href="${href}" ${attrs}>${label} ${icon.arrow}</a>`;

export const crumbs = (items) => `<nav class="crumbs" aria-label="Breadcrumb">${items.map(([l, h], i) => (i ? '<span aria-hidden="true">/</span>' : '') + (h ? `<a href="${h}">${esc(l)}</a>` : `<span>${esc(l)}</span>`)).join('')}</nav>`;

export const faqList = (items) => `<div class="faq">${items.map((f, i) => `
  <div class="faq-item" data-reveal>
    <button class="faq-q" type="button" aria-expanded="false" aria-controls="faq-${i}-${f.q.length}"><span>${esc(f.q)}</span><span class="pm" aria-hidden="true"></span></button>
    <div class="faq-a" id="faq-${i}-${f.q.length}"><div><div>${f.a}</div></div></div>
  </div>`).join('')}</div>`;

export const serviceCard = (s, extra = '') => `
<a class="card" href="${s.url}" data-reveal data-tags="${(s.concerns || []).join(' ')} ${s.category}" data-cursor="View" ${extra}>
  ${s.tag ? `<span class="tag">${esc(s.tag)}</span>` : ''}
  <div class="card-media"><img src="${s.img}" alt="${esc(s.name)} at Elements Wellness" loading="lazy"></div>
  <div class="card-body">
    <h3>${esc(s.name)}</h3>
    <p>${esc(s.short)}</p>
    <div class="meta">${s.duration ? `<span>${esc(s.duration)}</span>` : ''}${s.price ? `<span>${esc(s.price)}</span>` : ''}<span>Discover →</span></div>
  </div>
</a>`;

const megaMenu = () => {
  const cols = categories.map((c) => `<div class="mega-col"><h4><a href="${c.url}">${esc(c.label)}</a></h4>${services.filter((s) => s.category === c.id && !s.hidden).slice(0, 9).map((s) => `<a href="${s.url}">${esc(s.name)}</a>`).join('')}${services.filter((s) => s.category === c.id).length > 9 ? `<a href="${c.url}" style="color:var(--maroon)">View all →</a>` : ''}</div>`).join('');
  return `<div class="mega"><div class="wrap mega-inner">${cols}
    <a class="mega-feature" href="/spa-ritual/onsen-spa/"><img src="/assets/img/couple-onsen-2.jpg" alt="" loading="lazy"><div><span class="eyebrow">Spa Ritual</span><div class="h3" style="margin-top:8px">Koyamaki Onsen Spa @ The Centrepoint</div></div></a>
  </div></div>`;
};

export const header = (active = '') => `
<a class="skip" href="#main">Skip to content</a>
<header class="header">
  <div class="wrap header-inner">
    <a href="/" aria-label="Elements Wellness — home"><img class="logo-img" src="/assets/img/logo-white.png" alt="Elements Wellness" width="1119" height="253"></a>
    <nav class="nav-left" aria-label="Primary">
      <div class="has-mega"><a class="nav-link" href="/services/" ${active === 'services' ? 'aria-current="page"' : ''}>Treatments ${icon.chev}</a>${megaMenu()}</div>
      <a class="nav-link" href="/spa-ritual/" ${active === 'ritual' ? 'aria-current="page"' : ''}>Spa Ritual</a>
      <a class="nav-link" href="/health-analysis/" ${active === 'health' ? 'aria-current="page"' : ''}>Health Analysis</a>
      <a class="nav-link" href="/promotions/" ${active === 'promotions' ? 'aria-current="page"' : ''}>Promotions</a>
      <a class="nav-link" href="/awards/" ${active === 'awards' ? 'aria-current="page"' : ''}>Awards</a>
    </nav>
    <div class="nav-right">
      <a class="nav-link" href="/gift-vouchers/">Gift Vouchers</a>
      <a class="nav-link" href="/shop/">Shop</a>
      <button class="nav-search" type="button" data-finder aria-label="Find a treatment">${icon.search}<span>Find</span></button>
      <a class="btn btn-sm" href="/book-appointment/"><span>Book</span>${icon.arrow}</a>
      <button class="burger" type="button" aria-label="Menu" aria-expanded="false"><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="mobile-menu" aria-label="Mobile">
  <nav>
    <details><summary>Treatments</summary><div class="sub">${categories.map((c) => `<a href="${c.url}">${esc(c.label)}</a>`).join('')}<a href="/services/">All treatments</a></div></details>
    <a href="/spa-ritual/">Spa Ritual</a>
    <a href="/health-analysis/">Health Analysis</a>
    <a href="/promotions/">Promotions</a>
    <a href="/gift-vouchers/">Gift Vouchers</a>
    <a href="/shop/">Supplements</a>
    <a href="/awards/">Awards</a>
    <a href="/blog/">Journal</a>
    <details><summary>Visit</summary><div class="sub">${outlets.map((o) => `<a href="${o.url}">${esc(o.name)}</a>`).join('')}<a href="/contact-us/">Contact</a></div></details>
  </nav>
  <div class="mm-foot">
    <a class="btn btn-light" href="/book-appointment/"><span>Book Appointment</span>${icon.arrow}</a>
    <div class="socials">${socials()}</div>
  </div>
</div>`;

export const socials = () => site.socials.map((s) => `<a href="${s.url}" target="_blank" rel="noopener" aria-label="${s.label}">${icon[s.icon]}</a>`).join('');

const finder = () => `
<div class="finder" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Treatment finder">
  <div class="finder-bg" data-finder-close></div>
  <div class="finder-panel">
    <div class="wrap">
      <div class="finder-top"><span class="eyebrow">Treatment finder</span><button class="finder-close" type="button" data-finder-close aria-label="Close">${icon.close}</button></div>
      <label class="finder-input">${icon.search}<input type="search" placeholder="Search a treatment or how you feel…" aria-label="Search treatments"></label>
      <div class="finder-tabs" role="group" aria-label="Search by">
        <button class="chip" type="button" data-mode="concern" aria-pressed="true">By concern</button>
        <button class="chip" type="button" data-mode="category" aria-pressed="false">By treatment type</button>
        <button class="chip" type="button" data-mode="outlet" aria-pressed="false">By outlet</button>
      </div>
      <div class="finder-grid">
        <div><div class="finder-label">Choose one</div><div class="finder-opts"></div></div>
        <div><div class="finder-label finder-results-label">All treatments</div><div class="finder-results"></div></div>
      </div>
      <p class="finder-note">Treatment and concern lists are managed by Elements Wellness in the CMS. Not sure? <a class="link-arrow" href="/health-analysis/">Start with a Health Analysis</a></p>
    </div>
  </div>
</div>`;

const footer = () => `
<footer class="footer">
  <div class="wrap">
    <div class="footer-grid">
      <div>
        ${logo('div')}
        <p style="margin-top:24px;max-width:340px">${esc(site.footerBlurb)}</p>
        <form class="newsletter" data-demo aria-label="Newsletter"><input type="email" required placeholder="Your email for rituals & offers" aria-label="Email"><button type="submit">Join</button></form>
        <div class="form-success" style="background:transparent;color:var(--blush);padding:12px 0">Thank you — you're on the list.</div>
        <div class="socials">${socials()}</div>
      </div>
      <div><h4>Treatments</h4><ul>${categories.map((c) => `<li><a href="${c.url}">${esc(c.label)}</a></li>`).join('')}<li><a href="/health-analysis/">Health Analysis</a></li></ul></div>
      <div><h4>Visit</h4><ul>${outlets.map((o) => `<li><a href="${o.url}">${esc(o.name)}</a></li>`).join('')}<li><a href="/contact-us/">Contact</a></li><li><a href="/book-appointment/">Book Appointment</a></li></ul></div>
      <div><h4>Elements</h4><ul><li><a href="/our-story/">Our Story</a></li><li><a href="/awards/">Awards</a></li><li><a href="/blog/">Journal</a></li><li><a href="/promotions/">Promotions</a></li><li><a href="/gift-vouchers/">Gift Vouchers</a></li><li><a href="/shop/">Supplements</a></li></ul></div>
      <div><h4>Help</h4><ul><li><a href="/faq-spa-etiquette/">FAQ &amp; Spa Etiquette</a></li><li><a href="/appointment-booking-cancellation-policy/">Booking &amp; Cancellation</a></li><li><a href="/customer-assurance-privacy/">Customer Assurance &amp; Privacy</a></li><li><a href="mailto:${site.email}">${site.email}</a></li></ul></div>
    </div>
    <div class="footer-word" aria-hidden="true">Elements</div>
    <div class="footer-bottom"><span>© ${new Date().getFullYear()} Elements Wellness Pte. Ltd. All rights reserved.</span><nav><a href="/customer-assurance-privacy/">Privacy</a><a href="/appointment-booking-cancellation-policy/">Policies</a><a href="/sitemap.xml">Sitemap</a></nav></div>
  </div>
</footer>
<div class="fab"><a class="wa" href="${site.whatsapp}" target="_blank" rel="noopener" aria-label="WhatsApp us">${icon.wa}</a><a class="bk" href="/book-appointment/" aria-label="Book now">${icon.arrow}<span>Book now</span></a></div>`;

export const layout = ({ title, description, path, body, active = '', bodyClass = '', schema = [], ogImage = '/assets/img/onsen-1.jpg' }) => `<!doctype html>
<html lang="en-SG" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${site.url}${path}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${site.url}${path}">
<meta property="og:image" content="${site.url}${ogImage}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#72181b">
${process.env.LIVE_REVIEWS ? '<meta name="ew-live-reviews" content="1">' : ''}
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://api.fontshare.com"><link rel="preconnect" href="https://cdn.fontshare.com" crossorigin>
<link href="https://api.fontshare.com/v2/css?f[]=switzer@300,400,500,600&display=swap" rel="stylesheet">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,300..600&family=Urbanist:wght@300;400;500;600;700&family=Quicksand:wght@600;700&family=Noto+Serif+SC:wght@500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/vendor/lenis.css">
<link rel="stylesheet" href="/assets/css/main.css">
<script>document.documentElement.className='js'</script>
${schema.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n')}
</head>
<body class="${bodyClass}">
<div class="loader" aria-hidden="true"><img class="loader-logo" src="/assets/img/logo-white.png" alt="Elements Wellness" width="1119" height="253"></div>
<div class="curtain" aria-hidden="true"><img class="loader-logo" src="/assets/img/logo-white.png" alt="" width="1119" height="253"></div>
${header(active)}
<main id="main">
${body}
</main>
${footer()}
${finder()}
<script src="/assets/js/finder-data.js" defer></script>
<script src="/assets/vendor/gsap.min.js" defer></script>
<script src="/assets/vendor/ScrollTrigger.min.js" defer></script>
<script src="/assets/vendor/SplitText.min.js" defer></script>
<script src="/assets/vendor/lenis.min.js" defer></script>
<script src="/assets/js/main.js" defer></script>
</body>
</html>`;

/* ---------- Google reviews (shared by homepage + outlet pages) ---------- */
const stars = (r) => { const full = Math.floor(r), half = r - full >= .25 && r - full < .75 ? 1 : 0, f2 = r - full >= .75 ? 1 : 0; return '★'.repeat(full + f2) + (half ? '<span class="half">★</span>' : '') + '<span class="off">' + '★'.repeat(Math.max(0, 5 - full - f2 - half)) + '</span>'; };
export const starRow = (r) => `<span class="g-stars-row" aria-label="${r} out of 5 stars">${stars(r)}</span>`;
export const fmtNum = (n) => Number(n).toLocaleString('en-SG');
const initials = (n) => n.replace(/\./g, '').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
export const googleCard = (r, outletName) => `<article class="g-review"><div class="g-head"><span class="g-avatar">${initials(r.author)}</span><div><b>${esc(r.author)}</b><small>${esc(r.when)}${outletName ? ' · ' + esc(outletName) : ''}</small></div><span class="g-mark" aria-hidden="true">G</span></div><div class="g-stars">${'★'.repeat(r.rating)}</div><p>${esc(r.text)}</p></article>`;
export const gLogo = '<span class="g"><i></i></span>';
