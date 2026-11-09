// Inner page templates (client sitemap 2026). Each returns { path, html }.
import fs from 'node:fs';
import { productCategories, productsNote, shopOutlets } from '../products.mjs';
import { productInfo, brandInfo } from '../product-info.mjs';
import { site, groups, services, outlets, awards, posts, faqs, promotions, promoTerms, voucherItems, blogTopics, story, policies, etiquette, facialConcerns, massageConcerns, concernPagesAll, productBrands } from '../data.mjs';
import * as SM from '../sitemap.mjs';
import { layout, esc, icon, btn, linkArrow, faqList, logo, crumbs, serviceCard, revealCard, showCard } from '../ui.mjs';
import { oldPage, splitHero, renderBlocks, sectionAfter } from '../content.mjs';
import { googleFor, pressLogos } from '../data.mjs';
import { drafts } from '../drafts.mjs';
// Lucy's mockup pages (basictrout9.chatgpt.site), ported as-is: her <main>, her CSS (scoped under .mk-page), her images. Our header and footer.
const mockDir = new URL('../mock/', import.meta.url);
const mockMap = fs.existsSync(new URL('_map.json', mockDir)) ? JSON.parse(fs.readFileSync(new URL('_map.json', mockDir), 'utf8')) : {};
const mockByUrl = Object.fromEntries(Object.entries(mockMap).map(([site, url]) => [url, site]));
const mockFor = (url) => mockByUrl[url] || null;
// Each ported page lives in its own shadow root so the site's stylesheet and scripts cannot touch her class names (.hero, .btn, .step …). Her CSS was scoped under .mk-page by the porter; inside the shadow root that prefix becomes :host.
const shadowCss = (css) => css.replace(/\.mk-page \*\{/g, '*{').replace(/\.mk-page :root/g, ':host').replace(/\.mk-page\{/g, ':host{').replace(/\.mk-page /g, '');
const mockBase = ':host{display:block;font-family:var(--f-text);color:var(--primary-dark)}h1,h2,h3{font-family:var(--f-head);font-weight:500;letter-spacing:.01em;text-transform:none}.btn{border-radius:0;text-transform:none;letter-spacing:.02em;font-family:var(--f-text)}img{max-width:100%}';
// Attaches the shadow root where the browser has no declarative shadow DOM, and makes her in-page jump links (#about …) scroll inside the shadow tree.
const mockScript = `<script>(function(){var h=document.querySelector('.mk-page');if(!h)return;var t=h.querySelector(':scope>template[shadowrootmode]');if(t){var sr=h.attachShadow({mode:'open'});sr.appendChild(t.content);t.remove()}var r=h.shadowRoot;if(!r)return;var go=function(el){if(window.__ewScrollTo)window.__ewScrollTo(el);else el.scrollIntoView({behavior:'smooth',block:'start'})};r.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a)return;var id=a.getAttribute('href').slice(1);var el=id&&r.getElementById(id);if(el){e.preventDefault();go(el);history.replaceState(null,'','#'+id)}});if(location.hash){var el=r.getElementById(location.hash.slice(1));if(el)setTimeout(function(){go(el)},400)}})();</script>`;
function mockFacts(site) {
  const html = fs.readFileSync(new URL(site + '.html', mockDir), 'utf8');
  const facts = (html.match(/<div class="facts">([\s\S]*?)<\/div>\s*(?:<div class="jump"|<\/div>)/) || [])[1] || '';
  const cells = [...facts.matchAll(/<div>([\s\S]*?)<\/div>/g)].map((m) => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  const dur = cells.find((c) => /^(Your session|Duration)/i.test(c)); const pr = cells.find((c) => /^First[- ]trial/i.test(c));
  return { duration: dur ? (dur.match(/(\d+ minutes(?: per body area)?)/i) || [])[1]?.replace(' minutes', ' min') : '', price: pr ? (pr.match(/S\$\d+(?: nett)?/) || [])[0] : '' };
}
function mockPage({ url, site, title, description, active, trail, treatmentId, bookcard }) {
  const main = fs.readFileSync(new URL(site + '.html', mockDir), 'utf8').replace(/^<main[^>]*>/, '').replace(/<\/main>\s*$/, '');
  const css = shadowCss(fs.readFileSync(new URL(site + '.css', mockDir), 'utf8'));
  if (/\.mk-page/.test(css)) throw new Error('mock css still has .mk-page after rescoping: ' + site);
  const body = `<div class="mk-page" data-mock="${site}"><template shadowrootmode="open"><style>${css}${mockBase}</style>${main}</template></div>${mockScript}` + (bookcard || '');
  return { path: url, html: layout({ title, description, path: url, active, bodyClass: 'page-light page-mock' + (bookcard ? ' page-treatment' : ''), schema: [bc(trail)], body }) };
}
import { googleCard, starRow, fmtNum, gLogo } from '../ui.mjs';

const research = JSON.parse(fs.readFileSync(new URL('../../_research/content.json', import.meta.url), 'utf8'));
const restoreRules = JSON.parse(fs.readFileSync(new URL('../../restore/rules/v1.json', import.meta.url), 'utf8'));

const pageHero = ({ eyebrow, title, lede, trail, img, dark = false, extra = '' }) => `
<section class="page-hero ${dark ? 'dark' : ''}">
  <div class="wrap" style="position:relative">
    ${crumbs(trail)}
    ${eyebrow ? `<span class="eyebrow" data-reveal="drop">${eyebrow}</span>` : ''}
    <h1 data-split style="margin-top:${eyebrow ? '22px' : '0'}">${title}</h1>
    ${lede ? `<p class="lede" data-reveal>${lede}</p>` : ''}
    ${extra}
    ${img ? `<div class="page-hero-media" data-clip><img src="${img}" alt="" fetchpriority="high"></div>` : ''}
  </div>
</section>`;

const ctaBand = (title = 'Ready when you are', sub = 'Book online, call or WhatsApp any of our three outlets.') => `
<section class="section cta-big">
  <div class="dots" aria-hidden="true"></div>
  <div class="wrap" style="position:relative">
    <span class="eyebrow" data-reveal="drop">Your next step</span>
    <div class="h1" data-split>${title}</div>
    <p class="lede" data-reveal>${sub}</p>
    <div class="hero-actions" data-reveal>${btn('/contact/#book', 'Book appointment')}${btn(site.whatsapp, 'WhatsApp us', 'btn-ghost', 'target="_blank" rel="noopener"')}</div>
  </div>
  <div class="ghost" aria-hidden="true">Elements</div>
</section>`;

const bc = (s) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: s.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: site.url + (u || '') })) });
const faqSchema = (list) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: list.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') } })) });

const copyNote = (status, what = 'Page copy') => status === 'new' ? `<p class="placeholder-note copy-note" data-reveal>✦ ${what} to be supplied by Elements</p>` : status === 'adapt' ? `<p class="placeholder-note copy-note" data-reveal>✦ Existing copy carried over — to be updated for the new page</p>` : '';
const groupOf = (id) => groups.find((g) => g.id === id);
const concernsFor = (s) => concernPagesAll.filter((c) => c.treatments.some((t) => t.id === s.id));
const oldBody = (source, title, skip = []) => { const old = source ? oldPage(source) : null; if (!old) return { old: null, h: { rest: [] }, html: '' }; const h = splitHero(old, title); return { old, h, html: h.rest.length ? renderBlocks(h.rest, { skipImages: [h.heroImg, ...skip], photos: false }) : '' }; };
// An old elements.com.sg page shown as it was: its title, hero photo, copy and pictures in the same order — nothing added
const oldView = ({ path, source, title, active = '', form = '', metaTitle = '', description = '', trail }) => {
  const old = oldPage(source); const h = splitHero(old, title, { keepAll: true }); trail = trail || [['Home', '/'], [title]];
  // don't repeat the intro line when the old page says it again in its body
  const restText = h.rest.map((b) => (b.html || b.text || '').replace(/<[^>]+>/g, ' ')).join(' ').replace(/\s+/g, ' ');
  const lede = h.tagline && !restText.includes(h.tagline.slice(0, 40)) ? h.tagline : '';
  const body = pageHero({ title: esc(title), lede: esc(lede), trail, img: h.heroImg }) + `
<section class="section-sm" style="padding-top:0"><div class="content-flow">${renderBlocks(h.rest, { skipImages: [h.heroImg], form, photos: false })}</div></section>`;
  return { path, html: layout({ title: metaTitle || `${title} | Elements Wellness`, description: description || old.description || title, path, active, bodyClass: 'page-light', schema: [bc(trail)], body }) };
};
const tile = (u, label, img) => `<a class="tcard" href="${u}" data-reveal><span class="tcard-media"><img src="${img}" alt="${esc(label)}" loading="lazy"></span><span class="tcard-body"><span class="tcard-name">${esc(label)}</span><span class="link-arrow">Learn More</span></span></a>`;

/* ---------- Main landing pages: Facials · Massage & Recovery ---------- */
export function treatmentLanding(groupId) {
  const g = groupOf(groupId); const L = groupId === 'facials' ? SM.landing.facials : SM.landing.massage;
  const list = services.filter((s) => s.group === groupId);
  const cps = groupId === 'facials' ? facialConcerns : massageConcerns;
  const trail = [['Home', '/'], [g.label]];
  const { h, html } = oldBody(L.source, groupId === 'facials' ? 'Facial' : 'Massage');
  const focused = groupId === 'facials'
    ? SM.facialShared.filter((p) => p.group === 'focused').map((p) => tile(p.url, p.label, `/assets/img/${p.img}`)).join('')
    : SM.womensWellness.map((id) => list.find((s) => s.id === id)).map(showCard).join('');
  const boost = groupId === 'facials' ? SM.facialShared.find((p) => p.group === 'boosters') : SM.massageBoosters;
  const body = pageHero({ title: esc(g.label), lede: esc(h.tagline || ''), trail }) + `
<section class="section-sm"><div class="wrap"><div class="head-row"><div><h2>By Concern</h2></div></div>
  <div class="tcards">${cps.map((c) => tile(c.url, c.label, c.img)).join('')}</div></div></section>
<section class="section-sm bg-ivory"><div class="wrap"><div class="head-row"><div><h2>${groupId === 'facials' ? 'Focused Care' : 'Women’s Wellness'}</h2></div>${linkArrow(boost.url, esc(boost.title || boost.label))}</div>
  <div class="tcards">${focused}</div></div></section>
<section class="section-sm"><div class="wrap"><div class="head-row"><div><h2>By Treatment</h2></div></div>
  <div class="tcards">${list.map(showCard).join('')}</div></div></section>
${html ? `<section class="section-sm"><div class="content-flow">${html}</div></section>` : ''}`;
  return { path: g.url, html: layout({ title: `${g.label} in Singapore | Elements Wellness`, description: g.blurb, path: g.url, active: groupId, bodyClass: 'page-light', schema: [bc(trail)], body }) };
}

/* ---------- Concern pages (discovery pathways) ---------- */
export function concernPage(c) {
  const g = groupOf(c.group);
  if (mockFor(c.url)) return mockPage({ url: c.url, site: mockFor(c.url), title: `${c.label} | Elements Wellness`, description: c.label, active: c.group, trail: [['Home', '/'], [g.label, g.url], [c.label]] });
  const trail = [['Home', '/'], [g.label, g.url], [c.label]];
  const { old, h, html } = oldBody(c.source, c.label);
  if (old && c.copy !== 'new') {
    const body = pageHero({ title: esc(c.label), lede: esc(h.tagline || ''), trail }) + `
<section class="section-sm" style="padding-top:0"><div class="wrap"><div class="tcards">${c.treatments.map(showCard).join('')}</div></div></section>
${html ? `<section class="section-sm"><div class="content-flow">${html}</div></section>` : ''}`;
    return { path: c.url, html: layout({ title: `${c.label} — ${g.label} in Singapore | Elements Wellness`, description: old.description || c.label, path: c.url, active: c.group, bodyClass: 'page-light', schema: [bc(trail)], body }) };
  }
  const body = pageHero({ title: esc(c.label), trail }) + `
<section class="section-sm" style="padding-top:0"><div class="wrap"><div class="tcards">${c.treatments.map(showCard).join('')}</div></div></section>`;
  return { path: c.url, html: layout({ title: `${c.label} — ${g.label} in Singapore | Elements Wellness`, description: old?.description || c.label, path: c.url, active: c.group, bodyClass: 'page-light', schema: [bc(trail)], body }) };
}

/* ---------- Shared pages: Eye Treatments · Neck Treatments · Facial Boosters · Massage & Recovery Boosters ---------- */
const itemSource = {
  'Bojin Eye Treatment': [/Eye Bojin/i], '24K Pure Gold Eye Treatment': [/24K Pure Gold Eye/i], 'Hydrating Collagen Eye Treatment': [/Hydrating Collagen Eye/i],
  'Infra Ray Moxibustion / Muscle Blade': [/Infra/i], 'Volcanic Mud Mask': [/Volcanic/i], 'Guasha / Bojin': [/Gua ?sha/i], Cupping: [/Cupping/i],
};
export function sharedPage(p, groupId) {
  const g = groupOf(groupId); const title = p.title || p.label;
  if (mockFor(p.url)) return mockPage({ url: p.url, site: mockFor(p.url), title: `${title} | Elements Wellness`, description: title, active: groupId, trail: [['Home', '/'], [g.label, g.url], [title]] });
  const trail = [['Home', '/'], [g.label, g.url], [title]];
  const old = p.source ? oldPage(p.source) : null;
  const intro = old ? splitHero(old, title) : { rest: [] };
  const items = p.items.map((name) => {
    let desc = itemSource[name] ? sectionAfter(old, itemSource[name][0]) : '';
    if (!desc && name === 'Omega Light Therapy' && old) desc = intro.tagline ? `<p>${esc(intro.tagline)}</p>` : '';
    return { name, desc };
  });
  const isBooster = /boosters/.test(p.url);
  if (old && p.copy !== 'new') {
    const body = pageHero({ title: esc(title), lede: esc(intro.tagline || ''), trail, img: intro.heroImg }) + `
<section class="section-sm" style="padding-top:0"><div class="content-flow">${renderBlocks(intro.rest, { skipImages: [intro.heroImg], photos: false })}</div></section>`;
    return { path: p.url, html: layout({ title: `${title} | ${g.label} | Elements Wellness`, description: old.description || title, path: p.url, active: groupId, bodyClass: 'page-light', schema: [bc(trail)], body }) };
  }
  const body = pageHero({ title: esc(title), trail }) + `
<section class="section-sm" style="padding-top:0"><div class="wrap"><ul class="tp-suits">${items.map((i) => `<li data-reveal>${esc(i.name)}${i.desc ? `<div class="prose small-prose">${i.desc}</div>` : ''}</li>`).join('')}</ul></div></section>`;
  return { path: p.url, html: layout({ title: `${title} | ${g.label} | Elements Wellness`, description: `${title}: ${p.items.join(', ')}.`, path: p.url, active: groupId, bodyClass: 'page-light', schema: [bc(trail)], body }) };
}

/* ---------- Treatment & ritual pages ---------- */
export function servicePage(s) {
  const mk = mockFor(s.url);
  if (mk) {
    const g = groupOf(s.group); const trail = [['Home', '/'], [g.label, g.url], [s.name]];
    const d = drafts[s.id] || {};
    // The card's duration and first-trial price are read from her facts strip, so the card never contradicts the page
    const f = mockFacts(mk);
    const card = `<aside class="tp-bookcard" data-bookcard aria-label="Book ${esc(s.name)}"><div><b>${esc(s.name)}</b>${f.duration || f.price ? `<small>${[f.duration, f.price ? 'First trial ' + f.price : ''].filter(Boolean).join(' · ')}</small>` : ''}</div>${btn('/contact/#book', 'Book Now', 'btn-sm')}</aside>`;
    return mockPage({ url: s.url, site: mk, title: d.title || `${s.name} | Elements Wellness`, description: d.description || s.name, active: s.group, trail, bookcard: card });
  }
  if (drafts[s.id]) return draftTreatmentPage(s, drafts[s.id]);
  const g = groupOf(s.group);
  const trail = [['Home', '/'], [g.label, g.url], [s.name]];
  const cps = concernsFor(s);
  const related = services.filter((x) => x.id !== s.id && x.group === s.group && (cps.some((c) => c.treatments.includes(x)) || !cps.length)).slice(0, 3);
  const aw = awards.filter((a) => a.serviceIds?.includes(s.id));
  const avail = outlets.filter((o) => !s.outlets || s.outlets.includes(o.id));
  const old = s.source ? oldPage(s.source) : null;
  const h = old ? splitHero(old, s.name) : { rest: [] };
  const heroImg = h.heroImg || s.img;
  const lede = h.tagline || (s.isNew ? '' : s.short);
  const priceLine = h.price || [s.duration, s.price ? `${s.priceNote || ''} ${s.price}`.trim() : '', s.up ? `U.P. ${s.up}` : ''].filter(Boolean).join(' · ');
  const options = s.options ? `<section class="section-sm bg-ivory"><div class="wrap"><div class="head-row"><div><span class="eyebrow">Options &amp; prices</span><h2 style="margin-top:14px">Choose <span class="thin">your ritual.</span></h2></div></div>
    <div class="opt-table" role="table"><div class="opt-row opt-head" role="row"><span role="columnheader">Option</span><span role="columnheader">Duration</span><span role="columnheader">Price</span><span role="columnheader"></span></div>
    ${s.options.map(([n, d, pr], i) => `<div class="opt-row" role="row" data-reveal><div role="cell"><h3>${esc(n)}</h3></div><span role="cell">${esc(d)}</span><span role="cell">${esc(pr)}</span><span role="cell">${btn('/contact/#book', i === 0 ? 'Book' : 'Buy', 'btn-sm')}</span></div>`).join('')}</div>
    <p class="form-note" style="margin-top:16px">Prices include GST. Inclusions for each option and the online purchase method are to be confirmed by Elements.</p></div></section>` : '';
  if (!old) {
    const body = `
<section class="page-hero"><div class="wrap">
  ${crumbs(trail)}
  <div class="svc-hero">
    <div><h1 data-split style="font-size:clamp(34px,4.8vw,72px)">${esc(s.name)}</h1>
      <div class="hero-actions" style="justify-content:flex-start;margin-top:28px" data-reveal>${btn('/contact/#book', 'Book Now')}</div></div>
    <div class="svc-hero-media" data-clip><img src="${heroImg}" alt="${esc(s.name)} at Elements Wellness"></div>
  </div>
</div></section>`;
    return { path: s.url, html: layout({ title: `${s.name} in Singapore | Elements Wellness`, description: s.name, path: s.url, active: s.group, bodyClass: 'page-light', schema: [bc(trail)], ogImage: heroImg, body }) };
  }
  if (old) {
    const body = `
<section class="page-hero"><div class="wrap">
  ${crumbs(trail)}
  <div class="svc-hero">
    <div>
      ${h.label ? `<span class="eyebrow" data-reveal="drop">${esc(h.label)}</span>` : ''}
      <h1 data-split style="font-size:clamp(34px,4.8vw,72px);margin-top:${h.label ? '18px' : '0'}">${esc(s.name)}</h1>
      ${h.tagline ? `<p class="lede" data-reveal style="margin-top:20px">${esc(h.tagline)}</p>` : ''}
      ${h.price ? `<p class="lede" data-reveal style="margin-top:12px"><b>${esc(h.price)}</b></p>` : ''}
      <div class="hero-actions" style="justify-content:flex-start;margin-top:28px" data-reveal>${btn('/contact/#book', 'Book Now')}</div>
    </div>
    ${h.heroImg ? `<div class="svc-hero-media" data-clip><img src="${h.heroImg}" alt="${esc(s.name)} at Elements Wellness"></div>` : ''}
  </div>
</div></section>
<section class="section-sm"><div class="content-flow">${renderBlocks(h.rest, { skipImages: [h.heroImg], photos: false })}</div></section>`;
    const schema = [bc(trail), { '@context': 'https://schema.org', '@type': 'Service', name: s.name, serviceType: g.label, description: old.description || s.short, provider: { '@type': 'DaySpa', name: 'Elements Wellness', url: site.url }, areaServed: 'Singapore' }];
    return { path: s.url, html: layout({ title: `${s.name} in Singapore | Elements Wellness`, description: old.description || s.short, path: s.url, active: s.group, bodyClass: 'page-light', schema, ogImage: h.heroImg || s.img, body }) };
  }
  const coupleRituals = s.id === 'couple-massage' ? `<section class="section-sm bg-ivory"><div class="wrap"><div class="head-row"><div><span class="eyebrow">For two</span><h2 style="margin-top:14px">Couple <span class="thin">rituals.</span></h2></div>${linkArrow('/spa-experiences/', 'All spa experiences')}</div><div class="cards-3">${services.filter((x) => x.ritual).map((x) => serviceCard(x)).join('')}</div></div></section>` : '';
  const body = `
<section class="page-hero"><div class="wrap">
  ${crumbs(trail)}
  <div class="svc-hero">
    <div>
      <span class="eyebrow" data-reveal="drop">${esc(g.label)}${s.tag ? ' · ' + esc(s.tag) : ''}</span>
      <h1 data-split style="margin-top:18px;font-size:clamp(34px,4.8vw,72px)">${esc(s.name)}</h1>
      ${lede ? `<p class="lede" data-reveal style="margin-top:20px">${esc(lede)}</p>` : ''}
      <div class="svc-facts" data-reveal>
        <div><small>Duration</small><b>${esc(s.duration || (s.isNew ? 'To be confirmed' : 'Ask us'))}</b></div>
        <div><small>${esc(s.priceNote || 'Price')}</small><b>${esc(s.price || (s.isNew ? 'To be confirmed' : 'Enquire'))}</b>${s.up ? ` <s class="muted" style="font-size:13px">U.P. ${esc(s.up)}</s>` : ''}</div>
        <div><small>Available at</small><b style="font-size:14px">${avail.map((o) => esc(o.short)).join(' · ')}</b></div>
      </div>
      <div class="hero-actions" style="justify-content:flex-start;margin-top:28px" data-reveal>${btn('/contact/#book', s.ritual ? 'Book this ritual' : 'Book this treatment')}${btn(site.whatsapp, 'Ask a therapist', 'btn-ghost', 'target="_blank" rel="noopener"')}</div>
      ${priceLine ? `<p class="small muted" data-reveal style="margin-top:14px;font-size:13px">${esc(priceLine)}</p>` : ''}
    </div>
    <div class="svc-hero-media" data-clip><img src="${heroImg}" alt="${esc(s.name)} at Elements Wellness"></div>
  </div>
</div></section>
<div class="reading-bar" aria-hidden="true"></div>
${copyNote(s.copy, 'Treatment description')}
<section class="section-sm"><div class="wrap svc-body">
  <aside class="svc-aside">
    <div class="book-box"><small>${esc(s.priceNote || '')}${s.duration ? ' · ' + esc(s.duration) : ''}</small><div class="price">${esc(s.price || (s.isNew ? 'To be confirmed' : 'Enquire'))}${s.up ? ` <s style="font-size:15px;opacity:.6">${esc(s.up)}</s>` : ''}</div><small>All prices after GST. First-trial offers for first-time local visitors.</small>${btn('/contact/#book', 'Book Now', 'btn-light')}</div>
    ${aw.length ? `<div class="panel-soft"><span class="eyebrow">Award-winning</span><div class="awards-inline" style="margin-top:12px">${aw.map((a) => `<a href="/awards/#${a.slug}" title="${esc(a.title)}">${a.logo ? `<img src="${a.logo}" alt="${esc(a.title)}">` : `<span class="pill-award">${esc(a.publicationShort)} ${a.year}</span>`}</a>`).join('')}</div>${linkArrow('/awards/', 'Awards & Recognition')}</div>` : ''}
  </aside>
  <div class="content-flow" style="padding-inline:0;max-width:none">
    ${old && h.rest.length ? renderBlocks(h.rest, { skipImages: [heroImg] }) : s.isNew ? '<div class="cf-prose prose"><p class="placeholder-note">What the treatment is, who it suits, what to expect and its benefits — to be supplied by Elements.</p></div>' : `
    <div class="cf-prose prose" data-reveal>${(s.description || s.short).split('\n\n').map((p) => `<p>${esc(p)}</p>`).join('')}</div>`}
    ${cps.length ? `<span class="cf-label">Good for</span><div class="suitable" data-reveal>${cps.map((c) => `<a href="${c.url}"><span>${esc(c.label)}</span></a>`).join('')}</div>` : ''}
  </div>
</div></section>
${options}${coupleRituals}
${related.length ? `<section class="section ${options || coupleRituals ? '' : 'bg-ivory'}"><div class="wrap"><div class="head-row"><div><span class="eyebrow">Pairs well with</span><h2 style="margin-top:14px">You may <span class="thin">also like.</span></h2></div>${linkArrow(g.url, 'All ' + g.label.toLowerCase())}</div><div class="cards-3">${related.map((r) => serviceCard(r)).join('')}</div></div></section>` : ''}
` + ctaBand(`Book your ${esc(s.name.replace(/^The /, ''))}`);
  const schema = [bc(trail), { '@context': 'https://schema.org', '@type': 'Service', name: s.name, serviceType: g.label, description: old?.description || s.short, provider: { '@type': 'DaySpa', name: 'Elements Wellness', url: site.url }, areaServed: 'Singapore', ...(s.priceNum ? { offers: { '@type': 'Offer', price: s.priceNum, priceCurrency: 'SGD' } } : {}) }];
  return { path: s.url, html: layout({ title: `${s.name} in Singapore | Elements Wellness`, description: old?.description || s.meta || s.short, path: s.url, active: s.group, bodyClass: 'page-light', schema, ogImage: heroImg, body }) };
}


/* ---------- Treatment page from an Elements draft (copy word for word; layout per the brand guide) ---------- */
function draftTreatmentPage(s, d) {
  const g = groupOf(s.group);
  const trail = [['Home', '/'], [g.label, g.url], [s.name]];
  const old = s.source ? oldPage(s.source) : null; const oh = old ? splitHero(old, s.name) : {};
  const heroImg = d.heroImg || oh.heroImg || s.img;
  const F = d.facts; const outs = F.outlets.map((id) => outlets.find((o) => o.id === id)).filter(Boolean);
  const nameOf = (u) => [...concernPagesAll, ...SM.facialShared, SM.massageBoosters].find((x) => x.url === u) || {};
  const book = '/contact/#book';
  const sid = (t) => 'tp-' + t.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const awardLogos = pressLogos.slice(0, 8);
  const body = `
<section class="tp-hero"><div class="wrap">
  ${crumbs(trail)}
  <div class="tp-hero-grid">
    <div class="tp-hero-copy">
      <h1 data-split>${esc(d.h1)}</h1>
      <p class="lede" data-reveal>${esc(d.lede)}</p>
      <div class="tp-hero-actions" data-reveal>${btn(book, 'Book Now')}<a class="link-arrow" href="#tp-about">Discover the treatment ↓</a></div>
      <dl class="tp-facts" data-reveal>
        <div><dt>Duration</dt><dd>${esc(F.duration)}</dd></div>
        <div><dt>First-trial price</dt><dd>${esc(F.firstTrial)}</dd>${F.webPromo ? `<small>Web promo price ${esc(F.webPromo)}</small>` : ''}${F.usual ? `<small>Usual price ${esc(F.usual)}</small>` : ''}</div>
        <div><dt>Available at</dt><dd class="small">${esc(F.outletNames)}</dd></div>
      </dl>
    </div>
    <figure class="tp-hero-media" data-clip><img src="${heroImg}" alt="${esc(s.name)} at Elements Wellness" fetchpriority="high"></figure>
  </div>
  <nav class="tp-anchors" aria-label="On this page"><a href="#tp-about">About the treatment</a><a href="#tp-benefits">Benefits &amp; results</a><a href="#tp-suits">Who it suits</a><a href="#tp-session">Your session</a><a href="#tp-faq">FAQs</a></nav>
</div></section>

<section class="tp-section" id="tp-about"><div class="wrap tp-cols">
  <div><span class="tp-label">About the treatment</span></div>
  <div class="tp-body">
    <p class="tp-intro" data-reveal>${esc(d.intro)}</p>
    ${d.about.map((a) => `<div class="tp-block" data-reveal><h3>${esc(a.h)}</h3>${a.p.map((x) => `<p>${esc(x)}</p>`).join('')}${a.list ? `<ul class="tp-list">${a.list.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${(a.after || []).map((x) => `<p>${esc(x)}</p>`).join('')}</div>`).join('')}
  </div>
</div></section>

<section class="tp-section tp-tint" id="tp-benefits"><div class="wrap">
  <span class="tp-label">Benefits and results</span>
  <div class="tp-two ${d.benefits.length > 2 ? 'tp-three' : ''}">${d.benefits.map((b) => `<div data-reveal><h3>${esc(b.h)}</h3>${b.list ? `<ul class="tp-list">${b.list.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${(b.p || []).map((x) => `<p>${esc(x)}</p>`).join('')}</div>`).join('')}</div>
</div></section>

<section class="tp-section" id="tp-suits"><div class="wrap tp-cols">
  <div><h2 data-split>Who it suits</h2></div>
  <ul class="tp-suits">${d.suits.map((x) => `<li data-reveal>${esc(x)}</li>`).join('')}</ul>
</div></section>

<section class="tp-section tp-session" id="tp-session"><div class="wrap">
  <span class="tp-label">${esc(F.duration)}</span>
  <h2 data-split>What happens during your session</h2>
  ${d.session.numbered ? `<ol class="tp-steps">${d.session.steps.map((x, i) => `<li data-reveal><span>${String(i + 1).padStart(2, '0')}</span><p>${esc(x)}</p></li>`).join('')}</ol>` : `<ul class="tp-suits tp-session-list">${d.session.steps.map((x) => `<li data-reveal>${esc(x)}</li>`).join('')}</ul>`}
  ${d.session.note ? `<p class="tp-note" data-reveal>${esc(d.session.note)}</p>` : ''}
</div></section>

<section class="tp-awards"><div class="wrap">
  <p class="tp-awards-line" data-reveal>${esc(d.awardsLine)}</p>
  ${d.awardNote ? `<p class="tp-award-note" data-reveal>${esc(d.awardNote)}</p>` : ''}
  <div class="tp-award-logos logo-wall" data-logo-wall>${awardLogos.map((l, i) => `<div class="logo-cell" data-i="${i}">${l.url ? `<a href="${l.url}" title="${esc(l.title)}">` : ''}<img class="award-logo" src="${l.img}" alt="${esc(l.title)}" loading="lazy">${l.url ? '</a>' : ''}</div>`).join('')}</div>
  <script>window.EW_LOGOS=${JSON.stringify(pressLogos.map((a) => ({ img: a.img, title: a.title, url: a.url || '' })))}</script>
  <a class="link-arrow" href="/awards/">${d.awardNote ? 'See all awards' : 'Awards &amp; Recognition'}</a>
</div></section>

<section class="tp-section" id="tp-faq"><div class="wrap tp-cols">
  <div><h2 data-split>Your questions answered</h2></div>
  <div>${faqList(d.faq)}</div>
</div></section>

<section class="tp-section tp-related"><div class="wrap">
  <h2 data-split>${esc(d.related.title || 'Related treatments and concern guides')}</h2>
  <div class="tp-related-grid">${d.related.treatments.map((r) => { const t = services.find((x) => x.id === r.id); return t ? `<a class="tp-rel" href="${t.url}" data-reveal><h3>${esc(t.name)}</h3><p>${esc(r.text)}</p><span class="link-arrow">Explore treatment</span></a>` : ''; }).join('')}</div>
  ${d.related.guides.length + d.related.boosters.length ? '' : '<!-- no guides -->'}<div class="tp-chips" data-reveal>${[...d.related.guides, ...d.related.boosters].map((r) => `<a class="chip" href="${r.url}">${esc(r.label)}</a>`).join('')}</div>
</div></section>

<section class="tp-book bg-deep" id="tp-book"><div class="wrap">
  <h2 data-split>Book at your preferred outlet</h2>
  <p class="tp-book-facts">${esc(F.duration)} · First-trial price ${esc(F.firstTrial)}${F.usual ? ` · Usual price ${esc(F.usual)}` : ''}</p>
  <div class="tp-outlets">${outs.map((o) => `<div class="tp-outlet" data-reveal><h3>${esc(o.name)}</h3><a href="tel:+65${o.phone.replace(/\s/g, '')}">+65 ${esc(o.phone)}</a><a class="tp-wa" href="https://wa.me/65${o.whatsapp.replace(/\s/g, '')}" target="_blank" rel="noopener">WhatsApp</a></div>`).join('')}</div>
  <div class="tp-book-actions">${btn(book, 'Book Now', 'btn-light')}<a class="link-arrow" href="/appointment-booking-cancellation-policy/">Booking information &amp; terms</a></div>
</div></section>

<aside class="tp-bookcard" data-bookcard aria-label="Book ${esc(s.name)}">
  <div><b>${esc(s.name)}</b><small>${esc(F.duration)} · First trial ${esc(F.firstTrial)}</small></div>
  ${btn(book, 'Book Now', 'btn-sm')}
</aside>`;
  const schema = [bc(trail), { '@context': 'https://schema.org', '@type': 'Service', name: s.name, serviceType: g.label, description: d.description, provider: { '@type': 'DaySpa', name: 'Elements Wellness', url: site.url }, areaServed: 'Singapore' }, faqSchema(d.faq)];
  return { path: s.url, html: layout({ title: d.title, description: d.description, path: s.url, active: s.group, bodyClass: 'page-light page-treatment', schema, ogImage: heroImg, body }) };
}

/* ---------- Spa Experiences overview ---------- */
export function spaLanding() {
  const g = groupOf('spa');
  const trail = [['Home', '/'], [g.label]];
  const list = services.filter((s) => s.group === 'spa');
  const body = pageHero({ title: esc(g.label), trail }) + `
<section class="section-sm" style="padding-top:0"><div class="wrap"><div class="cards-4">${list.map((s) => serviceCard(s)).join('')}</div></div></section>`;
  return { path: g.url, html: layout({ title: 'Spa Experiences | Elements Wellness', description: list.map((s) => s.name).join(', '), path: g.url, active: 'spa', bodyClass: 'page-light', schema: [bc(trail)], body }) };
}

// One panel per product: the photo with a small cart icon at its top right, then inside the same panel the name with the size flush right
// and the price in the title face. The panel itself opens the product's own page.
const productCard = (it) => `<article class="pd" data-reveal data-sku="${esc(it.sku)}" data-brand="${esc(it.brand)}">
    <button class="pd-cart" type="button" data-add="${esc(it.sku)}" aria-label="Add ${esc(it.name)} to cart">${icon.bag}</button>
    <a class="pd-link" href="${it.url}">
      <div class="pd-media">${it.img.map((src, j) => `<img src="${src}" alt="${esc(it.name)}" loading="lazy" ${j ? 'class="pd-alt"' : ''}>`).join('')}</div>
      <div class="pd-body">
        <div class="pd-row"><h4 class="pd-name">${esc(it.name)}</h4><span class="pd-size">${esc(it.size)}</span></div>
        ${it.sub ? `<p class="pd-sub">${esc(it.sub)}</p>` : ''}
        <div class="pd-row pd-foot"><b class="pd-price">${esc(it.priceLabel)}</b></div>
      </div>
    </a></article>`;

// Manufacturer-published information (build/product-info.mjs). Only the fields the brand publishes are rendered.
const productDetails = (it) => {
  const i = productInfo[it.sku], b = brandInfo[it.brand]; if (!i && !b) return '';
  const list = (arr) => `<ul class="pp-list">${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const inci = !i?.inci ? '' : Array.isArray(i.inci) ? `<p class="pp-inci">${esc(i.inci.join(', '))}</p>` : Object.entries(i.inci).map(([k, v]) => `<p class="pp-inci"><b>${esc(k)}:</b> ${esc(v.join(', '))}</p>`).join('');
  const notes = [...(i?.notes || []), ...(b?.notes || [])];
  return `<div class="pp-details">
    ${i?.desc ? `<p class="pp-desc">${esc(i.desc)}</p>` : ''}
    ${b?.line ? `<p class="pp-line">${esc(b.line)}</p>` : ''}
    ${notes.length ? `<ul class="pp-chips">${notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
    ${i?.target || i?.skin ? `<dl class="pp-facts">${i.target ? `<dt>Targets</dt><dd>${esc(i.target)}</dd>` : ''}${i.skin ? `<dt>Suitable for</dt><dd>${esc(i.skin)}</dd>` : ''}</dl>` : ''}
    ${i?.actives ? `<section class="pp-sec"><h2>Key ingredients</h2>${list(i.actives)}</section>` : ''}
    ${i?.use ? `<section class="pp-sec"><h2>How to use</h2><p>${esc(i.use)}</p></section>` : ''}
    ${inci ? `<details class="pp-sec pp-ingredients"><summary>Ingredients</summary>${inci}</details>` : ''}
  </div>`;
};

/* ---------- One page per product: the client's data only (brand, name, line, size, price, photos) + Add to cart; no written copy yet ---------- */
export function productPage(it) {
  const trail = [['Home', '/'], ['Products', '/products/'], [it.brandName, `/products/#${it.brand}`], [it.name]];
  const others = productCategories.flatMap((c) => c.brands).find((b) => b.id === it.brand).items.filter((x) => x.sku !== it.sku).slice(0, 4);
  const body = `
<section class="page-hero pp-hero"><div class="wrap">${crumbs(trail)}
  <div class="pp" data-pp data-sku="${esc(it.sku)}">
    <div class="pp-gallery" data-pp-gallery>
      <div class="pp-main"><img src="${it.img[0]}" alt="${esc(it.name)}" fetchpriority="high" data-pp-main></div>
      ${it.img.length > 1 ? `<div class="pp-thumbs">${it.img.map((src, i) => `<button type="button" class="pp-thumb ${i ? '' : 'is-on'}" data-pp-thumb="${src}" aria-label="Photo ${i + 1}"><img src="${src}" alt=""></button>`).join('')}</div>` : ''}
    </div>
    <div class="pp-info">
      <span class="pp-brand">${esc(it.brandName)}</span>
      <h1 class="pp-name">${esc(it.name)}</h1>
      ${it.sub ? `<p class="pp-sub">${esc(it.sub)}</p>` : ''}
      <div class="pp-meta"><span class="pp-size">${esc(it.size)}</span><b class="pp-price">${esc(it.priceLabel)}</b></div>
      <div class="pp-buy">
        <div class="qty" aria-label="Quantity"><button type="button" data-pp-qty="-1" aria-label="Decrease">−</button><span data-pp-qty-n>1</span><button type="button" data-pp-qty="1" aria-label="Increase">+</button></div>
        <button class="btn pp-add" type="button" data-add="${esc(it.sku)}" data-add-qty><span>Add to cart</span></button>
      </div>
      <p class="pp-note">${esc(productsNote)}</p>
      ${productDetails(it)}
    </div>
  </div>
</div></section>
${others.length ? `<section class="section-sm pp-more"><div class="wrap"><div class="pb-head"><h2 class="pb-name">${esc(it.brandName)}</h2><a class="pb-count" href="/products/#${it.brand}">All ${esc(it.brandName)} products</a></div><div class="pd-grid">${others.map(productCard).join('')}</div></div></section>` : ''}`;
  const schema = [bc(trail), { '@context': 'https://schema.org', '@type': 'Product', name: it.name, brand: { '@type': 'Brand', name: it.brandName }, image: it.img.map((i) => site.url + i), offers: { '@type': 'Offer', priceCurrency: 'SGD', price: it.price, availability: 'https://schema.org/InStock', url: site.url + it.url } }];
  return { path: it.url, html: layout({ title: `${it.name} | ${it.brandName} | Elements Wellness`, description: `${it.name} — ${it.brandName}, ${it.size}, ${it.priceLabel}.`, path: it.url, active: 'products', bodyClass: 'page-light', schema, ogImage: it.img[0], body }) };
}

/* ---------- Products: two categories, sorted by brand (names, sizes, prices and photos supplied by Elements) ---------- */
export function productsPage(kind = '') {
  const cats = kind ? productCategories.filter((c) => c.id === kind) : productCategories;
  const label = kind ? cats[0].label : 'Products';
  const url = kind ? `/products/${kind}/` : '/products/';
  const trail = kind ? [['Home', '/'], ['Products', '/products/'], [label]] : [['Home', '/'], ['Products']];
  const item = productCard;
  const brand = (b) => `<section class="pb" id="${b.id}"><div class="pb-head"><h3 class="pb-name">${esc(b.name)}</h3>${b.items.length ? `<span class="pb-count">${b.items.length} products</span>` : ''}</div>${b.items.length ? `<div class="pd-grid">${b.items.map(item).join('')}</div>` : ''}</section>`;
  const cat = (c) => `<section class="pcat" id="${c.id}">${kind ? '' : `<h2 class="pcat-title">${esc(c.label)}</h2>`}${c.brands.map(brand).join('')}</section>`;
  const body = pageHero({ title: esc(label), trail }) + `
<section class="section-sm" style="padding-top:0"><div class="wrap">${cats.map(cat).join('')}<p class="pd-note">${esc(productsNote)}</p></div></section>`;
  return { path: url, html: layout({ title: `${label} | Elements Wellness`, description: label, path: url, active: 'products', bodyClass: 'page-light', schema: [bc(trail)], body }) };
}

/* ---------- Cart → Checkout (Stripe Checkout via the Elements staff system, like gift vouchers) → Thank you ---------- */
// Functional UI labels only (field names, buttons, totals). The cart keeps itself in the browser; shop.js fills these shells.
export function cartPage() {
  const trail = [['Home', '/'], ['Products', '/products/'], ['Cart']];
  const body = pageHero({ title: 'Cart', trail }) + `
<section class="section-sm" style="padding-top:0"><div class="wrap">
  <div class="cart-empty" data-cart-empty hidden><p class="lede">Your cart is empty.</p>${btn('/products/', 'Products', 'btn-ghost')}</div>
  <div class="cart-grid" data-cart-page hidden>
    <div class="cart-lines" data-cart-lines></div>
    <aside class="cart-side">
      <div class="co-sum" data-cart-summary></div>
      <a class="btn co-pay" href="/checkout/"><span>Checkout</span></a>
      <a class="co-back" href="/products/">Continue shopping</a>
    </aside>
  </div>
</div></section>`;
  return { path: '/cart/', html: layout({ title: 'Cart | Elements Wellness', description: 'Your cart.', path: '/cart/', active: 'products', bodyClass: 'page-light', schema: [bc(trail)], noindex: true, body }) };
}
export function checkoutPage() {
  const trail = [['Home', '/'], ['Products', '/products/'], ['Cart', '/cart/'], ['Checkout']];
  const outlet = (o, i) => `<label class="co-outlet"><input type="radio" name="outlet" value="${esc(o.id)}" ${i === 0 ? 'checked' : ''} required><span class="co-outlet-name">${esc(o.name)}</span><span class="co-outlet-addr">${esc(o.address)}</span></label>`;
  const body = pageHero({ title: 'Checkout', trail }) + `
<div class="wrap"><div class="warn-box gv-notice" data-co-notice hidden></div></div>
<section class="section-sm" style="padding-top:0"><div class="wrap">
  <div class="cart-empty" data-cart-empty hidden><p class="lede">Your cart is empty.</p>${btn('/products/', 'Products', 'btn-ghost')}</div>
  <form class="co-grid" data-checkout hidden novalidate autocomplete="on">
    <div class="co-main">
      <section class="co-block"><h2 class="co-h">Contact</h2>
        <div class="form">
          <div class="field"><label for="co-name">Full name</label><input id="co-name" name="buyer_name" required maxlength="80" autocomplete="name"></div>
          <div class="row">
            <div class="field"><label for="co-email">Email</label><input id="co-email" name="buyer_email" type="email" required autocomplete="email" inputmode="email"></div>
            <div class="field"><label for="co-phone">Mobile</label><input id="co-phone" name="buyer_phone" type="tel" required maxlength="30" autocomplete="tel" inputmode="tel"></div>
          </div>
        </div></section>
      <section class="co-block"><h2 class="co-h">Collection</h2>
        <div class="co-methods" data-co-methods hidden>
          <label class="co-method"><input type="radio" name="fulfilment" value="collect" checked><span>Collect at an outlet</span><b>Free</b></label>
          <label class="co-method"><input type="radio" name="fulfilment" value="delivery"><span>Delivery</span><b data-co-delivery-fee></b></label>
        </div>
        <div class="co-outlets" data-co-outlets>${shopOutlets.map(outlet).join('')}</div>
        <div class="form co-address" data-co-address hidden>
          <div class="field"><label for="co-l1">Address</label><input id="co-l1" name="line1" maxlength="120" autocomplete="address-line1"></div>
          <div class="row">
            <div class="field"><label for="co-l2">Unit number</label><input id="co-l2" name="line2" maxlength="120" autocomplete="address-line2"></div>
            <div class="field"><label for="co-pc">Postal code</label><input id="co-pc" name="postal" maxlength="6" inputmode="numeric" autocomplete="postal-code"></div>
          </div>
        </div></section>
      <section class="co-block"><h2 class="co-h">Note <span class="muted">(optional)</span></h2>
        <div class="form"><div class="field"><textarea id="co-note" name="note" maxlength="300" rows="2"></textarea></div></div></section>
    </div>
    <aside class="co-side">
      <div class="co-items" data-co-items></div>
      <div class="co-sum" data-co-summary></div>
      <button class="btn co-pay" type="submit" data-co-pay><span>Pay</span></button>
      <p class="form-note co-err" data-co-error></p>
      <p class="co-secure">Payment is processed securely by Stripe.</p>
      <a class="co-back" href="/cart/">Back to cart</a>
    </aside>
  </form>
</div></section>`;
  return { path: '/checkout/', html: layout({ title: 'Checkout | Elements Wellness', description: 'Checkout.', path: '/checkout/', active: 'products', bodyClass: 'page-light', schema: [bc(trail)], noindex: true, body }) };
}
export function checkoutThankYou() {
  const trail = [['Home', '/'], ['Products', '/products/'], ['Thank you']];
  const body = pageHero({ title: 'Thank you', trail }) + `<section class="section-sm" style="padding-top:0"><div class="wrap ty-wrap" data-co-thanks><p class="lede"><span class="spin"></span></p></div></section>`;
  return { path: '/checkout/thank-you/', html: layout({ title: 'Thank you | Elements Wellness', description: 'Your order confirmation.', path: '/checkout/thank-you/', active: 'products', bodyClass: 'page-light', schema: [bc(trail)], noindex: true, body }) };
}

/* ---------- Awards & Recognition: verified awards by year, awarding organisation, category and treatment ---------- */
export function awardsIndex() {
  const trail = [['Home', '/'], ['Awards & Recognition']];
  const years = [...new Set(awards.map((a) => a.year))].sort((a, b) => b - a);
  const orgs = [...new Set(awards.map((a) => a.publicationShort))].sort();
  const orgKey = (o) => 'o-' + o.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const AP = research.awardsPage || {};
  const body = pageHero({ title: 'Awards &amp; Recognition', lede: esc(AP.intro || ''), trail, dark: true }) + `
<section class="section-sm"><div class="wrap">
  <div class="cat-filter" data-filter-group="#award-list" role="group" aria-label="Filter by year"><button class="chip" type="button" data-filter="all" aria-pressed="true">All</button>${years.map((y) => `<button class="chip" type="button" data-filter="y${y}" aria-pressed="false">${y}</button>`).join('')}</div>
  <div class="cat-filter" data-filter-group="#award-list" role="group" aria-label="Filter by organisation">${orgs.map((o) => `<button class="chip" type="button" data-filter="${orgKey(o)}" aria-pressed="false">${esc(o)}</button>`).join('')}</div>
  <div id="award-list" class="award-table">${awards.map((a) => { const s = services.find((x) => a.serviceIds?.includes(x.id)); return `
    <div class="award-row" id="${a.slug}" data-tags="y${a.year} ${orgKey(a.publicationShort)}" data-reveal>
      <span class="yr">${a.year}</span>
      ${a.logo ? `<img src="${a.logo}" alt="" loading="lazy">` : `<span class="award-mono">${esc(a.publicationShort.split(' ').map((w) => w[0]).join('').slice(0, 3))}</span>`}
      <div><h3>${esc(a.title)}</h3><p>${esc(a.publication)}${a.category && a.category !== a.title ? ' · ' + esc(a.category) : ''}${a.label ? ' · <em style="font-style:normal;color:var(--maroon)">' + esc(a.label) + '</em>' : ''}</p></div>
      ${s ? `<a class="link-arrow" href="${s.url}">${esc(s.name)} ${icon.arrow}</a>` : `<span class="small muted">${esc(a.treatment || '')}</span>`}
    </div>`; }).join('')}
  </div>
</div></section>`;
  return { path: '/awards/', html: layout({ title: 'Awards & Recognition | Elements Wellness Singapore', description: 'Elements Wellness awards from Daily Vanity, Beauty Insider, Harper’s Bazaar, Her World, Women’s Weekly and more — and the treatments that won them.', path: '/awards/', bodyClass: 'page-light', schema: [bc(trail)], body }) };
}

/* ---------- Blog ---------- */
export function blogIndex() {
  return oldView({ path: '/blog/', source: '/blog/', title: 'Blog', metaTitle: 'Blog | Elements Wellness' });
}

export function postPage(p) {
  const trail = [['Home', '/'], ['Journal', '/blog/'], [p.title]];
  const rel = services.filter((s) => p.serviceIds?.includes(s.id));
  const more = posts.filter((x) => x.slug !== p.slug).slice(0, 3);
  const body = `
<div class="reading-bar" aria-hidden="true"></div>
<section class="page-hero"><div class="wrap-narrow">
  ${crumbs(trail)}
  ${p.dateLabel ? `<span class="small muted" data-reveal>${esc(p.dateLabel)}</span>` : ''}
  <h1 data-split style="margin-top:22px;font-size:clamp(32px,4.4vw,66px);max-width:none">${esc(p.title)}</h1>
  <p class="lede" data-reveal style="margin-top:24px">${esc(p.excerpt)}</p>
</div>
<div class="wrap"><div class="post-hero-media" data-clip><img src="${p.img}" alt=""></div></div>
<div class="wrap-narrow">
  <article class="article prose">${p.body}</article>
</div></section>`;
  const schema = [bc(trail), { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.excerpt, image: site.url + p.img, datePublished: p.date, author: { '@type': 'Organization', name: 'Elements Wellness' }, publisher: { '@type': 'Organization', name: 'Elements Wellness' } }];
  return { path: p.url, html: layout({ title: `${p.title} | Elements Wellness Journal`, description: p.excerpt, path: p.url, bodyClass: 'page-light', schema, ogImage: p.img, body }) };
}

/* ---------- Promotions ---------- */
export function promotionsPage() {
  return oldView({ path: '/promotions/', source: '/promotions/', title: 'Promotions', active: 'promotions', metaTitle: 'Spa Promotions & First Trial Offers in Singapore | Elements Wellness' });
}

/* ---------- Gift vouchers (buy online via the Elements staff system + Stripe) ---------- */
// Gift Vouchers: the old page was the heading plus the Gift Up widget. Same flow here — pick a voucher, one short form, pay —
// with the widget's own wording (item names, prices, descriptions, "A Gift For You — GIFT VOUCHER").
export function giftVouchers() {
  const trail = [['Home', '/'], ['Gift Vouchers']];
  // Same steps as the Gift Up widget on the old page (voucher → details → your details → pay) with one more step: choose the card design.
  // Static fallback list (from the old widget) until the live catalogue loads.
  const fallback = voucherItems.map((v) => `<article class="gv-item"><h3 class="gv-item-name">${esc(v.name)}</h3>${v.desc ? `<p class="gv-item-desc">${esc(v.desc)}</p>` : ''}<button type="button" class="btn gv-buy" disabled><span>Buy ${esc(v.price).replace('S$', 'SGD ')}</span></button></article>`).join('');
  const body = pageHero({ title: 'Gift Vouchers', trail }) + `
<div class="wrap"><div class="warn-box gv-notice" data-gift-notice hidden></div></div>
<section class="section-sm" style="padding-top:0" data-gift-shop><div class="wrap gv-wrap">
  <div class="gv-card" data-gift-card><div class="gv-card-head"><span>Elements Wellness</span><b>A Gift For You</b></div><div class="gv-card-art"><img data-gift-card-art alt="" hidden></div><div class="gv-card-ribbon">Gift Voucher</div></div>
  <ol class="gv-dots" aria-label="Steps"><li class="is-on" data-dot="1"></li><li data-dot="2"></li><li data-dot="3"></li><li data-dot="4"></li></ol>

  <div class="gv-stage is-on" data-stage="1">
    <div class="gv-items" data-gift-items>${fallback}</div>
  </div>

  <div class="gv-stage" data-stage="2">
    <div class="gv-chosen" data-gift-chosen></div>
    <span class="gv-label">Choose a design</span>
    <div class="gv-designs" data-gift-designs></div>
    <div class="gv-actions"><button class="btn btn-ghost" type="button" data-gift-back>Back</button><button class="btn" type="button" data-gift-next="2"><span>Continue</span></button></div>
  </div>

  <div class="gv-stage" data-stage="3">
    <div class="gv-chosen" data-gift-chosen></div>
    <form class="form gv-form" data-gift-form autocomplete="on" novalidate>
      <div class="field"><label for="gv-qty">Quantity</label><select id="gv-qty" name="qty">${[1,2,3,4,5,6,7,8,9,10].map((n) => `<option>${n}</option>`).join('')}</select></div>
      <div class="field"><label for="gv-bn">Your name</label><input id="gv-bn" name="buyer_name" required maxlength="80" autocomplete="name"></div>
      <div class="field"><label for="gv-rn">Recipient name</label><input id="gv-rn" name="recipient_name" maxlength="80"></div>
      <div class="field"><label for="gv-msg">Message <span class="muted">optional</span></label><textarea id="gv-msg" name="message" maxlength="240" rows="4"></textarea></div>
      <div class="gv-toggle" role="radiogroup" aria-label="Delivery"><label><input type="radio" name="delivery" value="email" checked><span>By email</span></label><label><input type="radio" name="delivery" value="print"><span>Print</span></label></div>
      <div data-gift-email-fields>
        <div class="field"><label for="gv-re">What email address should we send the gift voucher to?</label><input id="gv-re" name="recipient_email" type="email" inputmode="email"></div>
        <div class="field gv-when"><select name="when" aria-label="When to send"><option value="now">Send instantly</option><option value="date">Send on a date</option></select><input type="date" name="send_at" aria-label="Send date" hidden></div>
      </div>
      <p class="form-note" data-gift-print-note hidden>The voucher PDF will be emailed to you to print.</p>
      <div class="gv-actions"><button class="btn btn-ghost" type="button" data-gift-back>Back</button><button class="btn" type="button" data-gift-next="3"><span>Continue</span></button></div>
      <p class="form-note gv-err" data-gift-error></p>
    </form>
  </div>

  <div class="gv-stage" data-stage="4">
    <div class="form gv-form"><div class="field"><label for="gv-be">Your email address (for the receipt)</label><input id="gv-be" name="buyer_email" type="email" required autocomplete="email" inputmode="email"></div></div>
    <div class="gv-summary" data-gift-summary></div>
    <div class="gv-actions"><button class="btn btn-ghost" type="button" data-gift-back>Back</button><button class="btn" type="button" data-gift-pay><span>Pay</span></button></div>
    <p class="form-note gv-err" data-gift-pay-error></p>
  </div>
  <details class="gv-terms" data-gift-terms hidden><summary>Terms &amp; conditions</summary><div data-gift-terms-text></div></details>
</div></section>
`;
  return { path: '/gift-vouchers/', html: layout({ title: 'Gift Vouchers | Elements Wellness', description: 'Gift Vouchers — Elements Wellness.', path: '/gift-vouchers/', active: 'gift', bodyClass: 'page-light', schema: [bc(trail)], scripts: ['/assets/js/gift.js'], body }) };
}
export function giftThankYou() {
  const trail = [['Home', '/'], ['Gift Vouchers', '/gift-vouchers/'], ['Thank you']];
  const body = pageHero({ title: 'Thank you', trail }) + `<section class="section-sm" style="padding-top:0"><div class="wrap gv-wrap" data-gift-thanks><p class="lede"><span class="spin"></span></p></div></section>`;
  return { path: '/gift-vouchers/thank-you/', html: layout({ title: 'Thank you | Elements Wellness Gift Vouchers', description: 'Your gift voucher order confirmation.', path: '/gift-vouchers/thank-you/', active: 'gift', bodyClass: 'page-light', schema: [bc(trail)], scripts: ['/assets/js/gift.js'], noindex: true, body }) };
}

/* ---------- Locations ---------- */
export function outletPage(o) {
  const trail = [['Home', '/'], ['Locations', '/locations/'], [o.name]];
  const list = services.filter((s) => !s.outlets || s.outlets.includes(o.id));
  const exclusive = services.filter((s) => s.outlets && s.outlets.length === 1 && s.outlets[0] === o.id);
  const others = outlets.filter((x) => x.id !== o.id);
  const tel = o.phone.replace(/\s/g, ''), wa = o.whatsapp.replace(/\s/g, '');
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent('Elements Wellness ' + o.mapQuery)}`;
  // 313: the walk-in plays with the scroll — frame by frame — from the shopfront (name, address, hours over it) into the reception (the 313-only treatments over the final scene)
  const walkIn = o.id === '313' ? `<section class="walk" data-walk data-frames="60" data-src="/assets/img/313-walk/f%03d.jpg" data-src-sm="/assets/img/313-walk-sm/f%03d.jpg">
    <div class="walk-pin">
      <canvas class="walk-canvas" width="1440" height="810" aria-hidden="true"></canvas>
      <img class="walk-fallback" src="/assets/img/313-walk/f001.jpg" alt="Elements Wellness 313@somerset" fetchpriority="high">
      <div class="walk-shade" aria-hidden="true"></div>
      <div class="wrap walk-start" data-walk-start>
        ${crumbs(trail)}
        <h1 data-split>${esc(o.name)}</h1>
        <p class="outlet-walkin-addr">${o.address}</p>
        <span class="walk-cue" aria-hidden="true">Scroll</span>
      </div>
      <div class="wrap walk-end" data-walk-end>
        <div class="walk-visit">
          <span class="walk-label">Visit us</span>
          <h2>${esc(o.name)}</h2>
          <p class="outlet-walkin-addr">${o.address}</p>
          <dl class="walk-dl">
            <div><dt>Hours</dt><dd>${o.hours.map(([d, h]) => `${esc(d)}: ${esc(h)}`).join('<br>')}</dd></div>
            <div><dt>Phone</dt><dd><a href="tel:+65${tel}">${esc(o.phone)}</a></dd></div>
            <div><dt>WhatsApp</dt><dd><a href="https://wa.me/65${wa}" target="_blank" rel="noopener">${esc(o.whatsapp)}</a></dd></div>
            <div><dt>Email</dt><dd><a href="mailto:${o.email}">${esc(o.email)}</a></dd></div>
          </dl>
          <div class="hero-actions" style="justify-content:flex-start;margin-top:26px">${btn('/contact/#book', 'Book Now', 'btn-light')}<a class="link-arrow walk-maps" href="${mapsUrl}" target="_blank" rel="noopener">Open in Maps</a></div>
        </div>
        <div class="walk-map"><iframe title="Map to Elements Wellness ${esc(o.name)}" src="https://maps.google.com/maps?q=${encodeURIComponent('Elements Wellness ' + o.mapQuery)}&t=m&z=16&output=embed&iwloc=near" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
      </div>
    </div>
  </section>` : '';
  const body = walkIn + (o.id === '313' ? '' : pageHero({ title: esc(o.name), trail,
    extra: `<div class="hero-actions" style="justify-content:flex-start;margin-top:28px" data-reveal>${btn('/contact/#book', 'Book Now')}${btn(`https://wa.me/65${wa}`, 'WhatsApp ' + o.whatsapp, 'btn-ghost', 'target="_blank" rel="noopener"')}</div>` })) + `
${o.id === '313' ? (exclusive.length ? `<section class="section-sm"><div class="wrap"><div class="svc-list">${exclusive.map((s) => serviceCard(s)).join('')}</div></div></section>` : '') : `<section class="section-sm" style="padding-top:0"><div class="wrap outlet-find">
  <div class="outlet-info" data-reveal>
    <div><small>Address</small><p>${o.address}</p></div>
    <div><small>Opening hours</small>${o.hours.map(([d, h]) => `<p class="row"><span>${d}</span><b>${h}</b></p>`).join('')}</div>
    <div><small>Contact</small><p><a href="tel:${tel}">Tel ${esc(o.phone)}</a><br><a href="https://wa.me/65${wa}" target="_blank" rel="noopener">WhatsApp ${esc(o.whatsapp)}</a><br><a href="mailto:${o.email}">${esc(o.email)}</a></p></div>
    <div class="hero-actions" style="justify-content:flex-start">${btn(mapsUrl, 'Directions in Google Maps', 'btn-ghost btn-sm', 'target="_blank" rel="noopener"')}</div>
  </div>
  <div class="outlet-map tall" data-reveal="fade"><iframe title="Map to Elements Wellness ${esc(o.name)}" src="https://maps.google.com/maps?q=${encodeURIComponent('Elements Wellness ' + o.mapQuery)}&t=m&z=16&output=embed&iwloc=near" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
</div></section>
${o.gallery?.length ? `<section class="section-sm bg-ivory"><div class="wrap"><div class="outlet-gallery">${[o.img.replace('/assets/img/', ''), ...o.gallery].filter((g, i, a) => a.indexOf(g) === i).slice(0, 4).map((g, i) => `<figure data-reveal${i === 0 ? ' class="lead"' : ''}><img src="/assets/img/${g}" alt="Elements Wellness ${esc(o.name)}" loading="lazy"></figure>`).join('')}</div></div></section>` : ''}`}`;
  const schema = [bc(trail), { '@context': 'https://schema.org', '@type': 'DaySpa', name: 'Elements Wellness ' + o.name, telephone: '+65' + tel, email: o.email, address: { '@type': 'PostalAddress', streetAddress: o.street, postalCode: o.postal, addressLocality: 'Singapore', addressCountry: 'SG' }, openingHours: o.schemaHours, url: site.url + o.url, image: site.url + o.img, hasMap: mapsUrl, parentOrganization: { '@type': 'Organization', name: 'Elements Wellness' } }];
  return { path: o.url, html: layout({ title: `Elements Wellness ${o.name} — Spa on Orchard Road`, description: `Elements Wellness ${o.name}: ${o.addressPlain}. Call ${o.phone}.`, path: o.url, bodyClass: 'page-light', schema, ogImage: o.img, body }) };
}

// Whole-card link to the outlet page; phone / WhatsApp stay separately clickable
const outletCard = (o) => revealCard({ href: o.url, title: o.name, short: o.addressPlain, img: o.img, meta: [o.phone], cls: 'rcard-outlet' });

export function locationsPage() {
  const trail = [['Home', '/'], ['Locations']];
  const body = pageHero({ title: 'Locations', trail }) + `
<section class="section-sm" style="padding-top:0"><div class="wrap"><div class="cards-3">${outlets.map(outletCard).join('')}</div></div></section>`;
  return { path: '/locations/', html: layout({ title: 'Locations — ION Orchard, 313@somerset, The Centrepoint | Elements Wellness', description: outlets.map((o) => o.addressPlain).join(' · '), path: '/locations/', bodyClass: 'page-light', schema: [bc(trail)], body }) };
}

const contactForm = `<form class="form cf-form" data-demo>
    <div class="row"><div class="field"><label for="c-name">Name</label><input id="c-name" required autocomplete="name"></div><div class="field"><label for="c-phone">Mobile</label><input id="c-phone" type="tel" autocomplete="tel"></div></div>
    <div class="field"><label for="c-email">Email</label><input id="c-email" type="email" required autocomplete="email"></div>
    <div class="field"><label for="c-msg">Message</label><textarea id="c-msg" required></textarea></div>
    <button class="btn" type="submit"><span>Send</span></button>
  </form>`;
// Contact: the old page's content — Locations line, the three outlets (photo, address, phone, WhatsApp, email, hours),
// then "Contact Us" with its line and form. A card opens its outlet page with the photo expanding to fill the screen;
// 313@somerset plays the walk-in video (supplied by the user) as it expands.
const contactOutlets = () => {
  const old = oldPage('/contact-us/'); const bl = old.blocks; const out = [];
  bl.forEach((b, i) => { if (b.t === 'heading' && outlets.some((o) => o.name === b.text)) { const o = outlets.find((x) => x.name === b.text); const imgB = [...bl.slice(0, i)].reverse().find((x) => x.t === 'image' && x.w >= 400); const list = bl[i + 1]?.t === 'list' ? bl[i + 1].items : []; const hours = bl[i + 2]?.t === 'html' ? bl[i + 2].html : ''; out.push({ o, img: imgB?.src, list, hours }); } });
  return out;
};
export function contactPage() {
  const trail = [['Home', '/'], ['Contact Us']];
  const old = oldPage('/contact-us/'), oldBook = oldPage('/book-appointment/');
  const intro = old.blocks.find((b) => b.t === 'html' && /To make a booking/.test(b.html))?.html.replace('/make-an-appointment-form/', '#book') || '';
  const contactLine = old.blocks.find((b) => b.t === 'html' && /partnership/.test(b.html))?.html || '';
  // the old "Make An Appointment" page: its lines, then its form (now on this page)
  const bookLines = oldBook ? oldBook.blocks.filter((b) => b.t === 'html' && !/Elements – /.test(b.html)).map((b) => b.html).filter((h, i, a) => a.indexOf(h) === i).join('') : '';
  const video = { '313': { first: '/assets/img/313-walk/f001.jpg' } }; // the 313 card shows the walk-in's first frame; the walk itself plays on the 313 page as you scroll
  const cards = contactOutlets().map(({ o, img, list, hours }) => {
    const [addr, tel, wa, mail] = list; const v = video[o.id];
    return `<article class="ct-card" data-reveal>
      <a class="ct-media" href="${o.url}" data-expand="${o.id}" aria-label="${esc(o.name)}"><img src="${v ? v.first : img}" alt="Elements Wellness ${esc(o.name)}" loading="lazy"></a>
      <h2 class="ct-name"><a href="${o.url}" data-expand-link="${o.id}">${esc(o.name)}</a></h2>
      <ul class="ct-list">
        <li>${icon.mappin}<span>${esc(addr || '')}</span></li>
        <li>${icon.phone}<a href="tel:+65${(tel || '').replace(/\s/g, '')}">${esc(tel || '')}</a></li>
        <li>${icon.wa}<a href="https://wa.me/65${(wa || '').replace(/\s/g, '')}" target="_blank" rel="noopener">${esc(wa || '')}</a></li>
        <li>${icon.mail}<a href="mailto:${esc(mail || '')}">${esc(mail || '')}</a></li>
      </ul>
      <div class="ct-hours">${hours}</div>
    </article>`;
  }).join('');
  // Make An Appointment: four steps down the middle — outlet (with its photo), treatment, date & time, your details
  const times = ['11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
  const byGroup = groups.map((g) => ({ g, list: services.filter((s) => s.group === g.id) })).filter((x) => x.list.length);
  const bookForm = `<form class="bk" data-book id="book-form" novalidate>
    <ol class="bk-steps" aria-label="Steps"><li class="is-on" data-step-dot="1"><span>1</span>Outlet</li><li data-step-dot="2"><span>2</span>Treatment</li><li data-step-dot="3"><span>3</span>Date &amp; time</li><li data-step-dot="4"><span>4</span>Your details</li></ol>

    <section class="bk-step is-on" data-step="1">
      <h3 class="bk-h">Choose your outlet</h3>
      <div class="bk-outlets">${outlets.map((o, i) => `<label class="bk-outlet"><input type="radio" name="outlet" value="${o.id}" ${i === 0 ? 'checked' : ''} required><span class="bk-outlet-card"><img src="${o.id === '313' ? '/assets/img/313-walk/f001.jpg' : o.img}" alt="Elements Wellness ${esc(o.name)}" loading="lazy"><span class="bk-outlet-body"><b>${esc(o.name)}</b><small>${esc(o.addressPlain)}</small></span></span></label>`).join('')}</div>
      <div class="bk-nav"><button class="btn" type="button" data-next>Next</button></div>
    </section>

    <section class="bk-step" data-step="2">
      <h3 class="bk-h">Choose your treatment</h3>
      <div class="bk-groups">${byGroup.map(({ g, list }, i) => `<details class="bk-group" ${i === 0 ? 'open' : ''}><summary>${esc(g.label)}</summary><div class="bk-list">${list.map((s) => `<label class="bk-item"><input type="radio" name="treatment" value="${s.id}" required><span><b>${esc(s.name)}</b>${[s.duration, s.price ? `${s.priceNote === 'First trial' ? 'First trial ' : s.priceNote === 'Per couple' ? 'Per couple ' : 'From '}${s.price}` : ''].filter(Boolean).length ? `<small>${[s.duration, s.price ? `${s.priceNote === 'First trial' ? 'First trial ' : s.priceNote === 'Per couple' ? 'Per couple ' : 'From '}${s.price}` : ''].filter(Boolean).map(esc).join(' · ')}</small>` : ''}</span></label>`).join('')}</div></details>`).join('')}</div>
      <div class="bk-nav"><button class="btn btn-ghost" type="button" data-back>Back</button><button class="btn" type="button" data-next>Next</button></div>
    </section>

    <section class="bk-step" data-step="3">
      <h3 class="bk-h">Choose your date and time</h3>
      <div class="bk-when">
        <div class="field"><label for="b-date">Date</label><input id="b-date" name="date" type="date" required></div>
        <div class="field"><label>Time</label><div class="bk-times">${times.map((t, i) => `<label class="bk-time"><input type="radio" name="time" value="${t}" ${i === 0 ? 'checked' : ''}><span>${t}</span></label>`).join('')}</div></div>
      </div>
      <div class="bk-nav"><button class="btn btn-ghost" type="button" data-back>Back</button><button class="btn" type="button" data-next>Next</button></div>
    </section>

    <section class="bk-step" data-step="4">
      <h3 class="bk-h">Your details</h3>
      <div class="bk-summary" data-summary></div>
      <div class="row"><div class="field"><label for="b-name">Name</label><input id="b-name" name="name" required autocomplete="name"></div><div class="field"><label for="b-phone">Mobile</label><input id="b-phone" name="phone" type="tel" required autocomplete="tel"></div></div>
      <div class="field"><label for="b-email">Email</label><input id="b-email" name="email" type="email" autocomplete="email"></div>
      <div class="bk-nav"><button class="btn btn-ghost" type="button" data-back>Back</button><button class="btn" type="submit">Submit</button></div>
    </section>
    <div class="bk-done" hidden></div>
  </form>`;
  const body = pageHero({ title: 'Contact Us', trail }) + `
<section class="section-sm bg-sand" id="book" style="padding-top:0"><div class="wrap bk-wrap">
  <h2 class="ct-h bk-title">Make An Appointment</h2>
  <div class="prose ct-book-lines bk-lines">${bookLines}</div>
  ${bookForm}
</div></section>
<section class="section-sm"><div class="wrap">
  <h2 class="ct-h">Locations</h2>
  <div class="ct-intro prose">${intro}</div>
  <div class="ct-grid">${cards}</div>
</div></section>
<div class="ct-stage" data-ct-stage aria-hidden="true"></div>`;
  return { path: '/contact/', html: layout({ title: 'Contact Elements Wellness — ION Orchard, 313@somerset, The Centrepoint', description: old.description || 'Contact Elements Wellness.', path: '/contact/', bodyClass: 'page-light page-contact', schema: [bc(trail)], body }) };
}

export function bookPage() { return null; } // merged into the Contact page (/contact/#book)

export function faqPage() {
  return oldView({ path: '/faq-spa-etiquette/', source: '/faq-spa-etiquette/', title: 'FAQ & Spa Etiquette' });
}

export function storyPage() {
  return oldView({ path: '/about-elements/', source: '/our-story/', title: 'Our Story', trail: [['Home', '/'], ['About Elements']], metaTitle: 'About Elements | Elements Wellness Singapore' });
}

export function policyPage(p) {
  const trail = [['Home', '/'], [p.title]];
  const old = oldPage(p.url); const oh = old ? splitHero(old, p.title) : { rest: [] };
  const body = pageHero({ title: esc(p.title), trail }) + `<section class="section-sm" style="padding-top:0">${old && old.blocks.length ? `<div class="content-flow">${renderBlocks(old.blocks.filter((b) => !(b.t === 'heading' && b.text.toLowerCase() === p.title.toLowerCase())))}</div>` : `<div class="wrap-narrow prose">${p.body}</div>`}</section>`;
  return { path: p.url, html: layout({ title: `${p.title} | Elements Wellness`, description: p.description, path: p.url, bodyClass: 'page-light', schema: [bc(trail)], body }) };
}

export function notFound() {
  const body = pageHero({ eyebrow: '404', title: 'Lost in<br><span class="thin">the steam</span>', lede: 'This page has moved or no longer exists. Try the treatment finder, or head home.', trail: [['Home', '/'], ['Not found']],
    extra: `<div class="hero-actions" style="justify-content:flex-start;margin-top:32px">${btn('/', 'Back home')}<button class="btn btn-ghost" type="button" data-finder><span>Find a treatment</span>${icon.arrow}</button></div>` });
  return { path: '/404.html', file: true, html: layout({ title: 'Page not found | Elements Wellness', description: 'Page not found.', path: '/404.html', bodyClass: 'page-light', body }) };
}

// Any other page of the old site (campaign pages, referral, legacy treatment pages…) — same content, new layout.
export function migratedPage(pathname) {
  const old = oldPage(pathname); if (!old) return null;
  const title = old.title.replace(/\s*\|.*$/, '');
  const h = splitHero(old, title);
  const trail = [['Home', '/'], [title]];
  const body = pageHero({ title: esc(title), lede: esc(h.tagline || ''), trail, img: h.heroImg }) + `
<section class="section-sm" style="padding-top:0"><div class="content-flow">${renderBlocks(h.rest, { skipImages: [h.heroImg] })}</div></section>`;
  return { path: pathname, html: layout({ title: `${title} | Elements Wellness`, description: old.description || title, path: pathname, bodyClass: 'page-light', schema: [bc(trail)], body }) };
}
