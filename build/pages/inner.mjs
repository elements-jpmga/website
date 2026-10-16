// Inner page templates (client sitemap 2026). Each returns { path, html }.
import fs from 'node:fs';
import { site, groups, services, outlets, awards, posts, faqs, promotions, promoTerms, voucherItems, blogTopics, story, policies, etiquette, facialConcerns, massageConcerns, concernPagesAll, productBrands } from '../data.mjs';
import * as SM from '../sitemap.mjs';
import { layout, esc, icon, btn, linkArrow, faqList, logo, crumbs, serviceCard, revealCard } from '../ui.mjs';
import { oldPage, splitHero, renderBlocks, sectionAfter } from '../content.mjs';
import { googleFor, pressLogos } from '../data.mjs';
import { drafts } from '../drafts.mjs';
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
    <div class="hero-actions" data-reveal>${btn('/book-appointment/', 'Book appointment')}${btn(site.whatsapp, 'WhatsApp us', 'btn-ghost', 'target="_blank" rel="noopener"')}</div>
  </div>
  <div class="ghost" aria-hidden="true">Elements</div>
</section>`;

const bc = (s) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: s.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: site.url + (u || '') })) });
const faqSchema = (list) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: list.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') } })) });

const copyNote = (status, what = 'Page copy') => status === 'new' ? `<p class="placeholder-note copy-note" data-reveal>✦ ${what} to be supplied by Elements</p>` : status === 'adapt' ? `<p class="placeholder-note copy-note" data-reveal>✦ Existing copy carried over — to be updated for the new page</p>` : '';
const groupOf = (id) => groups.find((g) => g.id === id);
const concernsFor = (s) => concernPagesAll.filter((c) => c.treatments.some((t) => t.id === s.id));
const oldBody = (source, title, skip = []) => { const old = source ? oldPage(source) : null; if (!old) return { old: null, h: { rest: [] }, html: '' }; const h = splitHero(old, title); return { old, h, html: h.rest.length ? renderBlocks(h.rest, { skipImages: [h.heroImg, ...skip] }) : '' }; };
// An old elements.com.sg page shown as it was: its title, hero photo, copy and pictures in the same order — nothing added
const oldView = ({ path, source, title, active = '', form = '', metaTitle = '', description = '', trail }) => {
  const old = oldPage(source); const h = splitHero(old, title, { keepAll: true }); trail = trail || [['Home', '/'], [title]];
  // don't repeat the intro line when the old page says it again in its body
  const restText = h.rest.map((b) => (b.html || b.text || '').replace(/<[^>]+>/g, ' ')).join(' ').replace(/\s+/g, ' ');
  const lede = h.tagline && !restText.includes(h.tagline.slice(0, 40)) ? h.tagline : '';
  const body = pageHero({ title: esc(title), lede: esc(lede), trail, img: h.heroImg }) + `
<section class="section-sm" style="padding-top:0"><div class="content-flow">${renderBlocks(h.rest, { skipImages: [h.heroImg], form })}</div></section>`;
  return { path, html: layout({ title: metaTitle || `${title} | Elements Wellness`, description: description || old.description || title, path, active, bodyClass: 'page-light', schema: [bc(trail)], body }) };
};
const tile = (u, label, img) => revealCard({ href: u, title: label, img });

/* ---------- Main landing pages: Facials · Massage & Recovery ---------- */
export function treatmentLanding(groupId) {
  const g = groupOf(groupId); const L = groupId === 'facials' ? SM.landing.facials : SM.landing.massage;
  const list = services.filter((s) => s.group === groupId);
  const cps = groupId === 'facials' ? facialConcerns : massageConcerns;
  const trail = [['Home', '/'], [g.label]];
  const { h, html } = oldBody(L.source, groupId === 'facials' ? 'Facial' : 'Massage');
  const focused = groupId === 'facials'
    ? SM.facialShared.filter((p) => p.group === 'focused').map((p) => tile(p.url, p.label, `/assets/img/${p.img}`)).join('')
    : SM.womensWellness.map((id) => list.find((s) => s.id === id)).map((s) => serviceCard(s)).join('');
  const boost = groupId === 'facials' ? SM.facialShared.find((p) => p.group === 'boosters') : SM.massageBoosters;
  const body = pageHero({ title: esc(g.label), lede: esc(h.tagline || ''), trail, img: h.heroImg }) + `
${html ? `<section class="section-sm"><div class="content-flow wide">${html}</div></section>` : ''}
<section class="section-sm"><div class="wrap"><div class="head-row"><div><h2>By Concern</h2></div></div>
  <div class="cards-4">${cps.map((c) => tile(c.url, c.label, c.img)).join('')}</div></div></section>
<section class="section-sm bg-ivory"><div class="wrap"><div class="head-row"><div><h2>${groupId === 'facials' ? 'Focused Care' : 'Women’s Wellness'}</h2></div>${linkArrow(boost.url, esc(boost.title || boost.label))}</div>
  <div class="cards-${groupId === 'facials' ? '2' : '4'}">${focused}</div></div></section>
<section class="section-sm"><div class="wrap"><div class="head-row"><div><h2>By Treatment</h2></div></div>
  <div class="svc-list">${list.map((s) => serviceCard(s)).join('')}</div></div></section>`;
  return { path: g.url, html: layout({ title: `${g.label} in Singapore | Elements Wellness`, description: g.blurb, path: g.url, active: groupId, bodyClass: 'page-light', schema: [bc(trail)], body }) };
}

/* ---------- Concern pages (discovery pathways) ---------- */
export function concernPage(c) {
  const g = groupOf(c.group);
  const trail = [['Home', '/'], [g.label, g.url], [c.label]];
  const { old, h, html } = oldBody(c.source, c.label);
  if (old && c.copy !== 'new') {
    const body = pageHero({ title: esc(c.label), lede: esc(h.tagline || ''), trail, img: h.heroImg }) + `
${html ? `<section class="section-sm"><div class="content-flow wide">${html}</div></section>` : ''}
<section class="section-sm"><div class="wrap"><div class="svc-list">${c.treatments.map((s) => serviceCard(s)).join('')}</div></div></section>`;
    return { path: c.url, html: layout({ title: `${c.label} — ${g.label} in Singapore | Elements Wellness`, description: old.description || c.label, path: c.url, active: c.group, bodyClass: 'page-light', schema: [bc(trail)], body }) };
  }
  const body = pageHero({ title: esc(c.label), trail }) + `
<section class="section-sm" style="padding-top:0"><div class="wrap"><div class="svc-list">${c.treatments.map((s) => serviceCard(s)).join('')}</div></div></section>`;
  return { path: c.url, html: layout({ title: `${c.label} — ${g.label} in Singapore | Elements Wellness`, description: old?.description || c.label, path: c.url, active: c.group, bodyClass: 'page-light', schema: [bc(trail)], body }) };
}

/* ---------- Shared pages: Eye Treatments · Neck Treatments · Facial Boosters · Massage & Recovery Boosters ---------- */
const itemSource = {
  'Bojin Eye Treatment': [/Eye Bojin/i], '24K Pure Gold Eye Treatment': [/24K Pure Gold Eye/i], 'Hydrating Collagen Eye Treatment': [/Hydrating Collagen Eye/i],
  'Infra Ray Moxibustion / Muscle Blade': [/Infra/i], 'Volcanic Mud Mask': [/Volcanic/i], 'Guasha / Bojin': [/Gua ?sha/i], Cupping: [/Cupping/i],
};
export function sharedPage(p, groupId) {
  const g = groupOf(groupId); const title = p.title || p.label;
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
<section class="section-sm" style="padding-top:0"><div class="content-flow">${renderBlocks(intro.rest, { skipImages: [intro.heroImg] })}</div></section>`;
    return { path: p.url, html: layout({ title: `${title} | ${g.label} | Elements Wellness`, description: old.description || title, path: p.url, active: groupId, bodyClass: 'page-light', schema: [bc(trail)], body }) };
  }
  const body = pageHero({ title: esc(title), trail }) + `
<section class="section-sm" style="padding-top:0"><div class="wrap"><ul class="tp-suits">${items.map((i) => `<li data-reveal>${esc(i.name)}${i.desc ? `<div class="prose small-prose">${i.desc}</div>` : ''}</li>`).join('')}</ul></div></section>`;
  return { path: p.url, html: layout({ title: `${title} | ${g.label} | Elements Wellness`, description: `${title}: ${p.items.join(', ')}.`, path: p.url, active: groupId, bodyClass: 'page-light', schema: [bc(trail)], body }) };
}

/* ---------- Treatment & ritual pages ---------- */
export function servicePage(s) {
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
    ${s.options.map(([n, d, pr], i) => `<div class="opt-row" role="row" data-reveal><div role="cell"><h3>${esc(n)}</h3></div><span role="cell">${esc(d)}</span><span role="cell">${esc(pr)}</span><span role="cell">${btn(`/book-appointment/?treatment=${s.id}&option=${i}`, i === 0 ? 'Book' : 'Buy', 'btn-sm')}</span></div>`).join('')}</div>
    <p class="form-note" style="margin-top:16px">Prices include GST. Inclusions for each option and the online purchase method are to be confirmed by Elements.</p></div></section>` : '';
  if (!old) {
    const body = `
<section class="page-hero"><div class="wrap">
  ${crumbs(trail)}
  <div class="svc-hero">
    <div><h1 data-split style="font-size:clamp(34px,4.8vw,72px)">${esc(s.name)}</h1>
      <div class="hero-actions" style="justify-content:flex-start;margin-top:28px" data-reveal>${btn(`/book-appointment/?treatment=${s.id}`, 'Book Now')}</div></div>
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
      <div class="hero-actions" style="justify-content:flex-start;margin-top:28px" data-reveal>${btn(`/book-appointment/?treatment=${s.id}`, 'Book Now')}</div>
    </div>
    ${h.heroImg ? `<div class="svc-hero-media" data-clip><img src="${h.heroImg}" alt="${esc(s.name)} at Elements Wellness"></div>` : ''}
  </div>
</div></section>
<section class="section-sm"><div class="content-flow">${renderBlocks(h.rest, { skipImages: [h.heroImg] })}</div></section>`;
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
      <div class="hero-actions" style="justify-content:flex-start;margin-top:28px" data-reveal>${btn(`/book-appointment/?treatment=${s.id}`, s.ritual ? 'Book this ritual' : 'Book this treatment')}${btn(site.whatsapp, 'Ask a therapist', 'btn-ghost', 'target="_blank" rel="noopener"')}</div>
      ${priceLine ? `<p class="small muted" data-reveal style="margin-top:14px;font-size:13px">${esc(priceLine)}</p>` : ''}
    </div>
    <div class="svc-hero-media" data-clip><img src="${heroImg}" alt="${esc(s.name)} at Elements Wellness"></div>
  </div>
</div></section>
<div class="reading-bar" aria-hidden="true"></div>
${copyNote(s.copy, 'Treatment description')}
<section class="section-sm"><div class="wrap svc-body">
  <aside class="svc-aside">
    <div class="book-box"><small>${esc(s.priceNote || '')}${s.duration ? ' · ' + esc(s.duration) : ''}</small><div class="price">${esc(s.price || (s.isNew ? 'To be confirmed' : 'Enquire'))}${s.up ? ` <s style="font-size:15px;opacity:.6">${esc(s.up)}</s>` : ''}</div><small>All prices after GST. First-trial offers for first-time local visitors.</small>${btn(`/book-appointment/?treatment=${s.id}`, 'Book Now', 'btn-light')}</div>
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
  const book = `/book-appointment/?treatment=${s.id}`;
  const sid = (t) => 'tp-' + t.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const awardLogos = pressLogos.filter((l) => !/TheSmartLocal|Mothership/.test(l.title)).slice(0, 8);
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
  <div class="tp-award-logos" data-reveal>${awardLogos.map((l) => `<img src="${l.img}" alt="${esc(l.title)}" loading="lazy">`).join('')}</div>
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

/* ---------- Products (catalogue structure; inventory from Elements) ---------- */
export function productsPage(kind = '') {
  const label = kind === 'skincare' ? 'Skincare' : kind === 'supplements' ? 'Supplements' : 'Products';
  const url = kind ? `/products/${kind}/` : '/products/';
  const trail = kind ? [['Home', '/'], ['Products', '/products/'], [label]] : [['Home', '/'], ['Products']];
  const body = pageHero({ title: esc(label), trail }) + (kind ? '' : `
<section class="section-sm" style="padding-top:0"><div class="wrap"><div class="cards-2">${tile('/products/skincare/', 'Skincare', '/assets/img/facial-mask.jpg')}${tile('/products/supplements/', 'Supplements', '/assets/img/herbal-flatlay.jpg')}</div></div></section>`);
  return { path: url, html: layout({ title: `${label} | Elements Wellness`, description: label, path: url, active: 'products', bodyClass: 'page-light', schema: [bc(trail)], body }) };
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
const giftFaq = [
  { q: 'How does the recipient get the voucher?', a: 'By email, as a PDF with their code — straight away, or on the date you choose. You receive a receipt with the code as well.' },
  { q: 'Where can vouchers be redeemed?', a: 'At all three Elements Wellness outlets: ION Orchard, 313@somerset and The Centrepoint. Call or WhatsApp the outlet to book, and show the voucher on the day.' },
  { q: 'How long is a voucher valid?', a: '12 months from the issue date. The expiry date is printed on the voucher, and we send a reminder a month before it expires.' },
  { q: 'Can a voucher be used in parts?', a: 'No — each voucher is used in one visit. A spa credit voucher can be put towards any treatment; a treatment voucher is for that treatment.' },
  { q: 'Can I check a voucher?', a: 'Yes — use the “Check a voucher” box on this page to see its status and expiry date.' },
  { q: 'What if I need help?', a: 'Email ask@elements.com.sg with your order number, or WhatsApp any outlet.' },
];
export function giftVouchers() {
  const trail = [['Home', '/'], ['Gift Vouchers']];
  const gv = SM.supportPages.find((x) => x.url === '/gift-vouchers/');
  const fallback = voucherItems.map((v) => /Spa Voucher/.test(v.name) ? `<div class="gv-amount"><b>${esc(v.price)}</b><span>Spa credit · any treatment</span></div>` : `<div class="gv-item"><span class="gv-kind">Treatment</span><b>${esc(v.name)}</b><span class="gv-price">${esc(v.price)}</span></div>`).join('');
  const body = pageHero({ eyebrow: 'Gift vouchers', title: 'The gift of<br><span class="thin">feeling well</span>', lede: 'Pick an amount or a treatment, choose a card and the words on it, and we email it to them beautifully — today or on the day you choose. Redeemable at all three Orchard Road outlets.', trail,
    extra: `<ul class="gv-trust" data-reveal><li>Emailed instantly or on a date</li><li>Valid 12 months</li><li>ION Orchard · 313@somerset · Centrepoint</li><li>Secure payment by Stripe</li></ul>` }) + `
${copyNote(gv.copy)}
<div class="wrap"><div class="warn-box gv-notice" data-gift-notice hidden></div></div>
<section class="section-sm gv-shop" style="padding-top:0" data-gift-shop><div class="wrap gv-layout">
  <div class="gv-step gv-s1" id="choose"><div class="gv-step-head"><span class="num">1</span><h2>What would you like to gift?</h2></div>
    <div class="gv-tabs" role="tablist" data-gift-tabs><button type="button" class="on" data-kind="value" role="tab" aria-selected="true">Spa credit<small>Choose an amount · any treatment</small></button><button type="button" data-kind="treatment" role="tab" aria-selected="false">A treatment<small>Massage, facial or onsen ritual</small></button></div>
    <div class="gv-grid" data-gift-items>${fallback}</div>
  </div>
  <aside class="gv-side" data-gift-side hidden><div class="gv-sticky"><div data-gift-preview></div><p class="small muted gv-side-note">This is how the card arrives — as a PDF with their unique code and QR, plus the same words in the email.</p></div></aside>
  <div class="gv-step gv-s2" id="design" data-gift-step hidden><div class="gv-step-head"><span class="num">2</span><h2>Make it personal</h2></div>
    <div class="gv-block"><span class="gv-label">The occasion</span><div class="gv-chips" data-gift-occasions></div></div>
    <div class="gv-block"><span class="gv-label">Card design</span><div class="gv-designs" data-gift-designs><p class="muted small">Card designs load in a moment…</p></div></div>
    <form class="form gv-words" data-gift-words>
      <div class="row"><div class="field"><label for="gv-head">Headline on the card</label><input id="gv-head" name="headline" maxlength="40" placeholder="A gift for you"></div></div>
      <div class="field"><label for="gv-msg">Your message <span class="muted">(printed on the voucher, optional)</span></label><textarea id="gv-msg" name="message" maxlength="240" placeholder="Take an hour for yourself…"></textarea><span class="gv-count"><span data-gift-count>0</span>/240</span></div>
    </form>
  </div>
  <div class="gv-step gv-s3" id="details" data-gift-step hidden><div class="gv-step-head"><span class="num">3</span><h2>Send it &amp; pay</h2></div>
    <form class="form" data-gift-form autocomplete="on">
      <div class="gv-recipient" data-gift-recipient>
        <div class="row"><div class="field"><label for="gv-rn">Recipient's name</label><input id="gv-rn" name="recipient_name" maxlength="80"></div><div class="field"><label for="gv-re">Recipient's email</label><input id="gv-re" name="recipient_email" type="email" placeholder="Leave blank to send it to yourself"></div></div>
        <div class="row"><div class="field"><label for="gv-when">Send it</label><select id="gv-when" name="send_when"><option value="now">Now</option><option value="later">On a date (e.g. their birthday)</option></select></div><div class="field" data-send-date hidden><label for="gv-date">Send on</label><input id="gv-date" name="send_date" type="date"></div></div>
        <div class="divider"></div>
      </div>
      <div class="row"><div class="field"><label for="gv-bn">Your name</label><input id="gv-bn" name="buyer_name" required maxlength="80" autocomplete="name"></div><div class="field"><label for="gv-be">Your email <span class="muted">(for your receipt)</span></label><input id="gv-be" name="buyer_email" type="email" required autocomplete="email"></div></div>
      <div class="row"><div class="field" data-gift-from><label for="gv-from">Sign it from</label><input id="gv-from" name="from_name" maxlength="80" placeholder="Defaults to your name"></div><div class="field"><label for="gv-bp">Mobile <span class="muted">(optional)</span></label><input id="gv-bp" name="buyer_phone" type="tel" autocomplete="tel"></div></div>
      <div class="gv-pay"><div><span class="eyebrow">Total</span><div class="h2" data-gift-total>—</div><span class="small muted" data-gift-summary></span></div><button class="btn" type="submit" disabled><span>Continue to secure payment</span>${icon.arrow}</button></div>
      <p class="form-note" data-gift-error style="color:#9b1c1c"></p>
      <p class="form-note">Payment is taken securely by Stripe (card, Apple Pay, Google Pay or PayNow). Prices include GST. By buying you agree to the voucher terms below.</p>
    </form></div>
</div></section>
<section class="section-sm bg-ivory"><div class="wrap grid-2" style="align-items:start">
  <div><span class="eyebrow" data-reveal>Already have a voucher?</span><h2 data-split style="margin:16px 0 20px">Check <span class="thin">a voucher.</span></h2><form class="form gv-check" data-gift-check><div class="field"><label for="gv-code">Voucher code</label><input id="gv-code" placeholder="e.g. EWG1-200GIFT-0082 (C01241-8)" required></div><button class="btn btn-ghost" type="submit"><span>Check</span>${icon.arrow}</button><div data-gift-check-out style="margin-top:12px"></div></form></div>
  <div><span class="eyebrow" data-reveal>Voucher terms</span><h2 data-split style="margin:16px 0 20px">Good to <span class="thin">know.</span></h2><ul class="checklist" data-reveal><li>12 months validity from the issue date.</li><li>Proper identification is required to redeem the voucher. We reserve the right to decline where identification is not provided.</li><li>Call or WhatsApp your preferred outlet to make an appointment; the voucher must be presented on the day.</li><li>Each voucher is used in one visit and is not exchangeable for cash.</li></ul></div>
</div></section>
<section class="section"><div class="wrap-narrow"><span class="eyebrow" data-reveal>Voucher FAQ</span><h2 data-split style="margin:20px 0 40px">How vouchers work</h2>${faqList(giftFaq)}</div></section>` + ctaBand('Prefer to buy in person?', 'Vouchers are also available at the counter of any outlet.');
  return { path: '/gift-vouchers/', html: layout({ title: 'Spa Gift Vouchers Singapore | Elements Wellness', description: 'Give an Elements Wellness gift voucher for massage, facials, onsen rituals and more — emailed today or on a date you choose, redeemable at three Orchard Road outlets.', path: '/gift-vouchers/', active: 'gift', bodyClass: 'page-light', schema: [bc(trail), faqSchema(giftFaq)], scripts: ['/assets/js/gift.js'], body }) };
}
export function giftThankYou() {
  const trail = [['Home', '/'], ['Gift Vouchers', '/gift-vouchers/'], ['Thank you']];
  const body = pageHero({ eyebrow: 'Gift vouchers', title: 'Thank you', lede: '', trail }) + `<section class="section-sm" style="padding-top:0"><div class="wrap-narrow" data-gift-thanks><p class="lede"><span class="spin"></span> Confirming your payment…</p></div></section>` + ctaBand('Book their visit', 'Call or WhatsApp any outlet to reserve a time.');
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
          <div class="hero-actions" style="justify-content:flex-start;margin-top:26px">${btn(`/book-appointment/?outlet=${o.id}`, 'Book Now', 'btn-light')}<a class="link-arrow walk-maps" href="${mapsUrl}" target="_blank" rel="noopener">Open in Maps</a></div>
        </div>
        <div class="walk-map"><iframe title="Map to Elements Wellness ${esc(o.name)}" src="https://maps.google.com/maps?q=${encodeURIComponent('Elements Wellness ' + o.mapQuery)}&t=m&z=16&output=embed&iwloc=near" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
      </div>
    </div>
  </section>` : '';
  const body = walkIn + (o.id === '313' ? '' : pageHero({ title: esc(o.name), trail,
    extra: `<div class="hero-actions" style="justify-content:flex-start;margin-top:28px" data-reveal>${btn(`/book-appointment/?outlet=${o.id}`, 'Book Now')}${btn(`https://wa.me/65${wa}`, 'WhatsApp ' + o.whatsapp, 'btn-ghost', 'target="_blank" rel="noopener"')}</div>` })) + `
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
  const old = oldPage('/contact-us/');
  const intro = old.blocks.find((b) => b.t === 'html' && /To make a booking/.test(b.html))?.html.replace('/make-an-appointment-form/', '/book-appointment/') || '';
  const contactLine = old.blocks.find((b) => b.t === 'html' && /partnership/.test(b.html))?.html || '';
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
  const body = pageHero({ title: 'Contact Us', trail }) + `
<section class="section-sm" style="padding-top:0"><div class="wrap">
  <h2 class="ct-h">Locations</h2>
  <div class="ct-intro prose">${intro}</div>
  <div class="ct-grid">${cards}</div>
</div></section>
<section class="section-sm bg-sand"><div class="wrap ct-form-wrap">
  <div><h2 class="ct-h">Contact Us</h2><div class="prose">${contactLine}</div></div>
  <div>${contactForm}</div>
</div></section>
<div class="ct-stage" data-ct-stage aria-hidden="true"></div>`;
  return { path: '/contact/', html: layout({ title: 'Contact Elements Wellness — ION Orchard, 313@somerset, The Centrepoint', description: old.description || 'Contact Elements Wellness.', path: '/contact/', bodyClass: 'page-light page-contact', schema: [bc(trail)], body }) };
}

export function bookPage(path = '/book-appointment/') {
  const form = `<form class="form cf-form" data-demo>
    <div class="field"><label>Outlet</label><div class="opt-grid">${outlets.map((o, i) => `<label class="opt"><input type="radio" name="outlet" value="${o.id}" ${i === 0 ? 'checked' : ''}><span><b>${esc(o.short)}</b></span></label>`).join('')}</div></div>
    <div class="field"><label for="b-cat">Treatment</label><select id="b-cat" required><option value="">Select a treatment…</option>${groups.map((g) => `<optgroup label="${esc(g.label)}">${services.filter((s) => s.group === g.id).map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</optgroup>`).join('')}</select></div>
    <div class="row"><div class="field"><label for="b-date">Preferred date</label><input id="b-date" type="date" required></div><div class="field"><label for="b-time">Preferred time</label><select id="b-time">${['11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map((t) => `<option>${t}</option>`).join('')}</select></div></div>
    <div class="row"><div class="field"><label for="b-name">Name</label><input id="b-name" required autocomplete="name"></div><div class="field"><label for="b-phone">Mobile</label><input id="b-phone" type="tel" required autocomplete="tel"></div></div>
    <button class="btn" type="submit"><span>Submit</span></button>
  </form>`;
  return oldView({ path, source: '/book-appointment/', title: 'Make An Appointment', form, trail: [['Home', '/'], ['Book Appointment']], metaTitle: 'Book an Appointment | Elements Wellness Singapore' });
}

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
