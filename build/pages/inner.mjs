// Inner page templates (client sitemap 2026). Each returns { path, html }.
import fs from 'node:fs';
import { site, groups, services, outlets, awards, posts, faqs, promotions, promoTerms, voucherItems, blogTopics, story, policies, etiquette, facialConcerns, massageConcerns, concernPagesAll, productBrands } from '../data.mjs';
import * as SM from '../sitemap.mjs';
import { layout, esc, icon, btn, linkArrow, faqList, logo, crumbs, serviceCard } from '../ui.mjs';
import { oldPage, splitHero, renderBlocks, sectionAfter } from '../content.mjs';
import { googleFor } from '../data.mjs';
import { googleCard, starRow, fmtNum, gLogo } from '../ui.mjs';

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
const tile = (u, label, img, sub = '') => `<a class="card concern-card" href="${u}" data-reveal><div class="card-media"><img src="${img}" alt="" loading="lazy"></div><div class="card-body"><h3>${esc(label)}</h3>${sub ? `<p>${esc(sub)}</p>` : ''}<div class="meta"><span>Explore →</span></div></div></a>`;

/* ---------- Main landing pages: Facials · Massage & Recovery ---------- */
export function treatmentLanding(groupId) {
  const g = groupOf(groupId); const L = groupId === 'facials' ? SM.landing.facials : SM.landing.massage;
  const list = services.filter((s) => s.group === groupId);
  const cps = groupId === 'facials' ? facialConcerns : massageConcerns;
  const trail = [['Home', '/'], [g.label]];
  const { h, html } = oldBody(L.source, groupId === 'facials' ? 'Facial' : 'Massage');
  const focused = groupId === 'facials'
    ? SM.facialShared.filter((p) => p.group === 'focused').map((p) => tile(p.url, p.label, `/assets/img/${p.img}`, p.items.length + ' options')).join('')
    : SM.womensWellness.map((id) => list.find((s) => s.id === id)).map((s) => serviceCard(s)).join('');
  const boost = groupId === 'facials' ? SM.facialShared.find((p) => p.group === 'boosters') : SM.massageBoosters;
  const body = pageHero({ title: esc(g.label), lede: esc(h.tagline || g.blurb), trail, img: h.heroImg || g.hero }) + `
${copyNote(L.copy, 'Overview copy')}
${html ? `<section class="section-sm"><div class="content-flow wide">${html}</div></section>` : ''}
<section class="section-sm"><div class="wrap"><div class="head-row"><div><span class="eyebrow">By concern</span><h2 style="margin-top:14px">Start with <span class="thin">how you feel.</span></h2></div></div>
  <div class="cards-4">${cps.map((c) => tile(c.url, c.label, c.img, c.treatments.length + ' treatments')).join('')}</div></div></section>
<section class="section-sm bg-ivory"><div class="wrap"><div class="head-row"><div><span class="eyebrow">Focused care</span><h2 style="margin-top:14px">${groupId === 'facials' ? 'Eyes <span class="thin">&amp; neck.</span>' : 'Women’s <span class="thin">wellness.</span>'}</h2></div>${linkArrow(boost.url, 'See the boosters')}</div>
  <div class="cards-${groupId === 'facials' ? '2' : '4'}">${focused}</div></div></section>
<section class="section-sm"><div class="wrap"><div class="head-row"><div><span class="eyebrow">By treatment</span><h2 style="margin-top:14px">All ${esc(g.label.toLowerCase())} <span class="thin">treatments.</span></h2></div></div>
  <div class="svc-list">${list.map((s) => serviceCard(s)).join('')}</div></div></section>` + ctaBand();
  return { path: g.url, html: layout({ title: `${g.label} in Singapore | Elements Wellness`, description: g.blurb, path: g.url, active: groupId, bodyClass: 'page-light', schema: [bc(trail)], body }) };
}

/* ---------- Concern pages (discovery pathways) ---------- */
export function concernPage(c) {
  const g = groupOf(c.group);
  const trail = [['Home', '/'], [g.label, g.url], [c.label]];
  const { old, h, html } = oldBody(c.source, c.label);
  const body = pageHero({ eyebrow: `${g.label} · by concern`, title: esc(c.label), lede: esc(h.tagline || c.intro || ''), trail, img: h.heroImg || c.img }) + `
${copyNote(c.copy)}
${html ? `<section class="section-sm"><div class="content-flow wide">${html}</div></section>` : ''}
<section class="section-sm"><div class="wrap"><div class="head-row"><div><span class="eyebrow">Recommended</span><h2 style="margin-top:14px">Treatments <span class="thin">for this concern.</span></h2></div>${linkArrow(g.url, 'All ' + g.label.toLowerCase())}</div>
  <div class="svc-list">${c.treatments.map((s) => serviceCard(s)).join('')}</div></div></section>` + ctaBand();
  return { path: c.url, html: layout({ title: `${c.label} — ${g.label} in Singapore | Elements Wellness`, description: old?.description || `${g.label} at Elements Wellness for ${c.label.toLowerCase()}.`, path: c.url, active: c.group, bodyClass: 'page-light', schema: [bc(trail)], body }) };
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
  const body = pageHero({ eyebrow: `${g.label} · ${isBooster ? 'add-ons' : 'focused care'}`, title: esc(title), lede: esc(isBooster ? 'Add-on options to deepen your treatment. Your therapist will advise which suit you.' : (intro.tagline || '')), trail, img: intro.heroImg || `/assets/img/${p.img}` }) + `
${copyNote(p.copy)}
<section class="section-sm"><div class="wrap">
  <div class="opt-table" role="table" aria-label="${esc(title)}">
    <div class="opt-row opt-head" role="row"><span role="columnheader">Option</span><span role="columnheader">${isBooster ? 'Added time' : 'Duration'}</span><span role="columnheader">Price</span><span role="columnheader">Suitable with</span></div>
    ${items.map((i) => `<div class="opt-row" role="row" data-reveal><div role="cell"><h3>${esc(i.name)}</h3>${i.desc ? `<div class="prose small-prose">${i.desc}</div>` : '<p class="placeholder-note">Description to be supplied</p>'}</div><span role="cell">To be confirmed</span><span role="cell">To be confirmed</span><span role="cell">${isBooster ? 'To be confirmed' : 'Add to any facial'}</span></div>`).join('')}
  </div>
  <p class="form-note" style="margin-top:18px">${isBooster ? 'These options are added to a booked treatment and do not have their own pages.' : 'These treatments are recommended as add-ons during a facial.'}</p>
</div></section>` + ctaBand();
  return { path: p.url, html: layout({ title: `${title} | ${g.label} | Elements Wellness`, description: `${title} at Elements Wellness: ${p.items.join(', ')}.`, path: p.url, active: groupId, bodyClass: 'page-light', schema: [bc(trail)], body }) };
}

/* ---------- Treatment & ritual pages ---------- */
export function servicePage(s) {
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

/* ---------- Spa Experiences overview ---------- */
export function spaLanding() {
  const g = groupOf('spa');
  const trail = [['Home', '/'], [g.label]];
  const list = services.filter((s) => s.group === 'spa');
  const body = pageHero({ eyebrow: 'Spa experiences', title: 'Rituals made<br><span class="thin">for slowing down</span>', lede: esc(g.blurb), trail, img: g.img }) + `
${copyNote(SM.landing.spa.copy, 'Overview copy')}
<section class="section-sm"><div class="wrap"><div class="cards-4">${list.map((s) => serviceCard(s)).join('')}</div></div></section>` + ctaBand('Make time for two');
  return { path: g.url, html: layout({ title: 'Spa Experiences — Onsen, Contrast & Herbal Rituals in Singapore | Elements Wellness', description: g.blurb, path: g.url, active: 'spa', bodyClass: 'page-light', schema: [bc(trail)], body }) };
}

/* ---------- Elements Restore (launch planned for November) ---------- */
export function restorePage() {
  const trail = [['Home', '/'], ['Elements Restore']];
  const R = restoreRules; const D = R.domains;
  const rf = [
    { q: 'What do I receive?', a: 'A printed or emailed Restore Profile with your Stress Load, Recovery Capacity and Circulation, your Restore Priority, and a Restore Plan with the matching Restore Program, plan duration and recommended frequency.' },
    { q: 'How are recommendations made?', a: 'Your readings are applied to a fixed set of Elements Restore rules. Every domain that needs attention becomes a Restore Priority, and each priority has its own fixed Restore Program. Your consultant chooses between the approved options within that program.' },
    { q: 'Is this a medical test?', a: esc(R.report.disclaimer) },
    { q: 'How often should I repeat it?', a: `We suggest a Restore Review after ${esc(R.report.reviewWindow)}. ${esc(R.report.reviewText)}` },
  ];
  const body = pageHero({ eyebrow: 'Elements Restore · launching November', title: 'Elements<br><span class="thin">Restore</span>', lede: esc(R.report.brandLine) + ' ' + esc(R.report.profileSub), trail, dark: true,
    extra: `<div class="hero-actions" style="justify-content:flex-start;margin-top:36px" data-reveal>${btn('/book-appointment/?treatment=elements-restore', 'Book an assessment', 'btn-light')}${btn('#how', 'How it works', 'btn-ghost-light')}</div>` }) + `
${copyNote('new', 'Final page copy (this draft uses the Elements Restore report wording)')}
<section class="section" id="how"><div class="wrap">
  <div class="head-row"><div><span class="eyebrow">The assessment</span><h2 style="margin-top:14px">Three domains, <span class="thin">one clear picture.</span></h2></div><p class="lede">Two quick in-spa readings — a stress reading and a vascular reading — are turned into your Restore Profile.</p></div>
  <div class="cards-3">${['stress', 'recovery', 'circulation'].map((k) => `<div class="card" data-reveal><div class="card-body"><span class="eyebrow">${esc(D[k].readingLabel)}</span><h3 style="margin-top:10px">${esc(D[k].label)}</h3><p>${esc(Object.values(D[k].explanations)[0].split('. ').slice(1).join('. ') || Object.values(D[k].explanations)[0])}</p><div class="meta"><span>Ideal: ${esc(D[k].idealRange.replace(/\n/g, ' · '))}</span></div></div></div>`).join('')}</div>
</div></section>
<section class="section-sm bg-ivory"><div class="wrap grid-2" style="align-items:start">
  <div><span class="eyebrow">What you receive</span><h2 style="margin:16px 0 20px">Profile, priority, <span class="thin">plan &amp; review.</span></h2>
    <ol class="ha-list"><li><span>01</span><b>Restore Profile</b> — your Stress Load, Recovery Capacity and Circulation with ideal ranges.</li><li><span>02</span><b>Restore Priority</b> — the domain(s) that need attention today, or Maintain.</li><li><span>03</span><b>Restore Plan</b> — the matching Restore Program, plan duration and recommended frequency.</li><li><span>04</span><b>Restore Review</b> — repeat the assessment after ${esc(R.report.reviewWindow)} to compare trends.</li></ol></div>
  <div><span class="eyebrow">Plan length</span><div class="opt-table" style="margin-top:16px">${R.plan.map((p) => `<div class="opt-row"><div><h3>${p.priorities === 0 ? 'Maintain' : p.priorities + ' Restore Priorit' + (p.priorities > 1 ? 'ies' : 'y')}</h3></div><span>${esc(p.duration)}</span><span style="grid-column:span 2">${esc(p.frequency)}</span></div>`).join('')}</div></div>
</div></section>
<section class="section-sm"><div class="wrap"><div class="head-row"><div><span class="eyebrow">Restore Programs</span><h2 style="margin-top:14px">One fixed program <span class="thin">per priority.</span></h2></div></div>
  <div class="cards-3">${Object.values(R.programs).map((p) => `<div class="card" data-reveal><div class="card-body"><h3>${esc(p.name)}</h3><p>${esc(p.benefit)}</p><ul class="checklist small-prose">${p.components.map((c) => `<li>${c.options.map(esc).join(' or ')} — ${esc(c.duration)}</li>`).join('')}</ul><div class="meta"><span>Optional enhancer: ${esc(p.enhancer)}</span></div></div></div>`).join('')}</div></div></section>
<section class="section bg-sand"><div class="wrap-narrow"><span class="eyebrow" data-reveal>Questions</span><h2 data-split style="margin:20px 0 40px">Before you book</h2>${faqList(rf)}</div></section>` + ctaBand('Understand your body first', 'Book an Elements Restore assessment at any of our three outlets.');
  return { path: '/elements-restore/', html: layout({ title: 'Elements Restore — Stress, Recovery & Circulation Assessment | Elements Wellness', description: 'Elements Restore turns two quick in-spa readings into a Restore Profile, Restore Priority and Restore Plan, with a review to track progress.', path: '/elements-restore/', active: 'restore', schema: [bc(trail), faqSchema(rf)], body }) };
}

/* ---------- Products (catalogue structure; inventory from Elements) ---------- */
export function productsPage(kind = '') {
  const label = kind === 'skincare' ? 'Skincare' : kind === 'supplements' ? 'Supplements' : 'Products';
  const url = kind ? `/products/${kind}/` : '/products/';
  const trail = kind ? [['Home', '/'], ['Products', '/products/'], [label]] : [['Home', '/'], ['Products']];
  const body = pageHero({ eyebrow: 'Products', title: kind ? esc(label) : 'Take the results<br><span class="thin">home with you</span>', lede: kind === 'skincare' ? 'The professional skincare we use and recommend in our facials.' : kind === 'supplements' ? 'Wellness supplements selected by Elements to support your treatments between visits.' : 'The skincare and supplements sold by Elements — browse by category or by brand.', trail }) + `
${copyNote('new', 'Brand, skincare and supplement inventory')}
<section class="section-sm"><div class="wrap">
  ${kind ? '' : `<div class="cards-2" style="margin-bottom:56px">${tile('/products/skincare/', 'Skincare', '/assets/img/facial-mask.jpg', 'Professional skincare from the brands we use in treatment.')}${tile('/products/supplements/', 'Supplements', '/assets/img/herbal-flatlay.jpg', 'Wellness support between visits.')}</div>`}
  <div class="head-row"><div><span class="eyebrow">By brand</span><h2 style="margin-top:14px">Our <span class="thin">brands.</span></h2></div></div>
  ${productBrands.length ? '' : '<div class="empty-state"><p>Each carried brand gets its own page — introducing the brand, why Elements carries it and its products with selection guidance. Brands and products will appear here once Elements supplies the inventory.</p></div>'}
</div></section>` + ctaBand('Not sure which product suits you?', 'Ask your therapist at your next visit, or WhatsApp us.');
  return { path: url, html: layout({ title: `${label} | Elements Wellness Singapore`, description: 'Skincare and supplements sold by Elements Wellness.', path: url, active: 'products', bodyClass: 'page-light', schema: [bc(trail)], body }) };
}

/* ---------- Awards & Recognition: verified awards by year, awarding organisation, category and treatment ---------- */
export function awardsIndex() {
  const trail = [['Home', '/'], ['Awards & Recognition']];
  const years = [...new Set(awards.map((a) => a.year))].sort((a, b) => b - a);
  const orgs = [...new Set(awards.map((a) => a.publicationShort))].sort();
  const orgKey = (o) => 'o-' + o.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const body = pageHero({ eyebrow: 'Recognition', title: 'Awards &amp;<br><span class="thin">Recognition</span>', lede: `${awards.length} awards from Singapore’s leading beauty and lifestyle titles since 2014 — by year, awarding organisation, category and recognised treatment.`, trail, dark: true }) + `
<section class="section-sm"><div class="wrap">
  <div class="finder-label">By year</div>
  <div class="cat-filter" data-filter-group="#award-list" role="group" aria-label="Filter by year"><button class="chip" type="button" data-filter="all" aria-pressed="true">All</button>${years.map((y) => `<button class="chip" type="button" data-filter="y${y}" aria-pressed="false">${y}</button>`).join('')}</div>
  <div class="finder-label" style="margin-top:14px">By awarding organisation</div>
  <div class="cat-filter" data-filter-group="#award-list" role="group" aria-label="Filter by organisation">${orgs.map((o) => `<button class="chip" type="button" data-filter="${orgKey(o)}" aria-pressed="false">${esc(o)}</button>`).join('')}</div>
  <div id="award-list" class="award-table">${awards.map((a) => { const s = services.find((x) => a.serviceIds?.includes(x.id)); return `
    <div class="award-row" id="${a.slug}" data-tags="y${a.year} ${orgKey(a.publicationShort)}" data-reveal>
      <span class="yr">${a.year}</span>
      ${a.logo ? `<img src="${a.logo}" alt="" loading="lazy">` : `<span class="award-mono">${esc(a.publicationShort.split(' ').map((w) => w[0]).join('').slice(0, 3))}</span>`}
      <div><h3>${esc(a.title)}</h3><p>${esc(a.publication)}${a.category && a.category !== a.title ? ' · ' + esc(a.category) : ''}${a.label ? ' · <em style="font-style:normal;color:var(--maroon)">' + esc(a.label) + '</em>' : ''}</p></div>
      ${s ? `<a class="link-arrow" href="${s.url}">${esc(s.name)} ${icon.arrow}</a>` : `<span class="small muted">${esc(a.treatment || '')}</span>`}
    </div>`; }).join('')}
  </div>
</div></section>` + ctaBand('Experience the award winners');
  return { path: '/awards/', html: layout({ title: 'Awards & Recognition | Elements Wellness Singapore', description: 'Elements Wellness awards from Daily Vanity, Beauty Insider, Harper’s Bazaar, Her World, Women’s Weekly and more — and the treatments that won them.', path: '/awards/', bodyClass: 'page-light', schema: [bc(trail)], body }) };
}

/* ---------- Blog ---------- */
export function blogIndex() {
  const trail = [['Home', '/'], ['Journal']];
  const cats = [...new Set(posts.map((p) => p.category))];
  const [lead, ...rest] = posts;
  const body = pageHero({ eyebrow: 'The Elements journal', title: 'Wellness,<br><span class="thin">explained simply</span>', lede: 'Treatment guides, concern-by-concern advice and honest comparisons from our therapists.', trail }) + `
<section class="section-sm" style="padding-top:0"><div class="wrap">
  <a class="split-card bg-ivory" href="${lead.url}" data-reveal data-cursor="Read" style="margin-bottom:56px">
    <div class="media"><img src="${lead.img}" alt=""></div>
    <div class="copy"><span class="eyebrow">${esc(lead.category)} · Featured</span><div class="h2" style="font-size:clamp(26px,3vw,44px)">${esc(lead.title)}</div><p class="muted">${esc(lead.excerpt)}</p>${linkArrow(lead.url, 'Read article')}</div>
  </a>
  <div class="cat-filter" data-filter-group="#post-list" role="group" aria-label="Filter by topic"><button class="chip" type="button" data-filter="all" aria-pressed="true">All</button>${cats.map((c) => `<button class="chip" type="button" data-filter="${c.toLowerCase().replace(/\W+/g, '-')}" aria-pressed="false">${esc(c)}</button>`).join('')}</div>
  <div class="cards-3" id="post-list">${rest.map((p) => `<a class="card" href="${p.url}" data-reveal data-tags="${p.category.toLowerCase().replace(/\W+/g, '-')}" data-cursor="Read"><div class="card-media"><img src="${p.img}" alt="" loading="lazy"></div><div class="card-body"><span class="eyebrow" style="font-size:10.5px">${esc(p.category)}</span><h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p><div class="meta"><span>${esc(p.dateLabel || '')}</span></div></div></a>`).join('')}</div>
</div></section>
<section class="section-sm bg-ivory"><div class="wrap"><div class="head-row" style="margin-bottom:24px"><div><span class="eyebrow">Coming to the journal</span><h2 style="margin-top:16px;font-size:clamp(24px,2.6vw,36px)">Categories in the CMS</h2></div><p class="lede" style="font-size:18px">Every article links to the treatments it discusses — building search authority for each service page.</p></div><div class="cat-filter">${blogTopics.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div></div></section>` + ctaBand();
  return { path: '/blog/', html: layout({ title: 'Wellness Journal — Treatment Guides & Tips | Elements Wellness', description: 'Treatment guides, wellness tips and concern-based advice from Elements Wellness therapists in Singapore.', path: '/blog/', bodyClass: 'page-light', schema: [bc(trail)], body }) };
}

export function postPage(p) {
  const trail = [['Home', '/'], ['Journal', '/blog/'], [p.title]];
  const rel = services.filter((s) => p.serviceIds?.includes(s.id));
  const more = posts.filter((x) => x.slug !== p.slug).slice(0, 3);
  const body = `
<div class="reading-bar" aria-hidden="true"></div>
<section class="page-hero"><div class="wrap-narrow">
  ${crumbs(trail)}
  <span class="eyebrow" data-reveal>${esc(p.category)}${p.dateLabel ? ' · ' + esc(p.dateLabel) : ''}</span>
  <h1 data-split style="margin-top:22px;font-size:clamp(32px,4.4vw,66px);max-width:none">${esc(p.title)}</h1>
  <p class="lede" data-reveal style="margin-top:24px">${esc(p.excerpt)}</p>
</div>
<div class="wrap"><div class="post-hero-media" data-clip><img src="${p.img}" alt=""></div></div>
<div class="wrap-narrow">
  <article class="article prose">${p.body}
  ${rel.length ? `<div class="related-box"><span class="eyebrow">Treatments in this article</span>${rel.map((s) => `<a class="f-result" href="${s.url}" style="background:var(--cream)"><img src="${s.img}" alt=""><span><b>${esc(s.name)}</b><small>${esc(s.duration || '')} ${s.price ? '· ' + esc(s.price) : ''}</small></span></a>`).join('')}</div>` : ''}
  </article>
</div></section>
<section class="section bg-ivory"><div class="wrap"><div class="head-row"><h2 style="font-size:clamp(24px,2.6vw,36px)">Keep reading</h2>${linkArrow('/blog/', 'All articles')}</div><div class="cards-3">${more.map((m) => `<a class="card" href="${m.url}" data-reveal><div class="card-media"><img src="${m.img}" alt="" loading="lazy"></div><div class="card-body"><span class="eyebrow" style="font-size:10.5px">${esc(m.category)}</span><h3>${esc(m.title)}</h3></div></a>`).join('')}</div></div></section>` + ctaBand();
  const schema = [bc(trail), { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.excerpt, image: site.url + p.img, datePublished: p.date, author: { '@type': 'Organization', name: 'Elements Wellness' }, publisher: { '@type': 'Organization', name: 'Elements Wellness' } }];
  return { path: p.url, html: layout({ title: `${p.title} | Elements Wellness Journal`, description: p.excerpt, path: p.url, bodyClass: 'page-light', schema, ogImage: p.img, body }) };
}

/* ---------- Promotions ---------- */
export function promotionsPage() {
  const trail = [['Home', '/'], ['Promotions']];
  const body = pageHero({ eyebrow: 'Current offers', title: 'First visits &<br><span class="thin">seasonal rituals</span>', lede: 'Introductory prices and limited offers across our three outlets. All prices include GST.', trail }) + `
<section class="section-sm" style="padding-top:0"><div class="wrap">
${[...new Set(promotions.map((p) => p.group))].map((g) => { const list = promotions.filter((p) => p.group === g); return `
  <div style="margin-bottom:72px">
    <div class="head-row" style="margin-bottom:28px"><h2 style="font-size:clamp(24px,2.6vw,38px)" data-split>${esc(g)}</h2>${list[0].groupNote ? `<span class="placeholder-note">${esc(list[0].groupNote)}</span>` : ''}</div>
    <div class="cards-3">${list.map((p) => `<a class="card promo" href="${p.url}" data-reveal data-cursor="View">${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ''}<div class="card-media"><img src="${p.img}" alt="" loading="lazy"></div><div class="card-body"><h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p>
      <div class="promo-price"><small>${esc(p.priceLabel)}${p.duration ? ' · ' + esc(p.duration) : ''}</small><b>${esc(p.price)}</b></div>
      <div class="promo-rows">${p.rows.map(([k, v]) => `<span><small>${k}</small>${k === 'Usual' ? `<s>${esc(v)}</s>` : esc(v)}</span>`).join('')}</div></div></a>`).join('')}</div>
  </div>`; }).join('')}
  <div class="prose" style="max-width:760px">${promoTerms.map((t) => `<p class="form-note">${esc(t)}</p>`).join('')}<p class="form-note">Promotions are managed by Elements Wellness in the CMS and may change.</p></div>
</div></section>` + ctaBand('Claim your first visit');
  return { path: '/promotions/', html: layout({ title: 'Spa Promotions & First Trial Offers in Singapore | Elements Wellness', description: 'Current Elements Wellness promotions: first-visit massage and facial trials, INDIBA® body therapy, Koyamaki onsen rituals and couple packages.', path: '/promotions/', active: 'promotions', bodyClass: 'page-light', schema: [bc(trail)], body }) };
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
  const fallback = voucherItems.map((v) => `<div class="gv-item"><span class="gv-kind">${/Spa Voucher/.test(v.name) ? 'Spa credit' : 'Treatment'}</span><b>${esc(v.name)}</b><small>${esc(v.desc)}</small><span class="gv-price">${esc(v.price)}</span></div>`).join('');
  const body = pageHero({ eyebrow: 'Gift vouchers', title: 'The gift of<br><span class="thin">feeling well</span>', lede: 'Choose a spa credit or a treatment, pick a card, add a message — and we email it to them, today or on the day you choose. Redeemable at all three Orchard Road outlets.', trail }) + `
${copyNote(gv.copy)}
<div class="wrap"><div class="warn-box gv-notice" data-gift-notice hidden></div></div>
<section class="section-sm" style="padding-top:0" data-gift-shop><div class="wrap gv-layout">
  <div class="gv-main">
    <div class="gv-step" id="choose"><div class="gv-step-head"><span class="num">1</span><h2>Choose a voucher</h2></div><div class="gv-grid" data-gift-items>${fallback}</div></div>
    <div class="gv-step" id="design"><div class="gv-step-head"><span class="num">2</span><h2>Choose a card</h2></div><div class="gv-designs" data-gift-designs><p class="muted small">Card designs load in a moment…</p></div></div>
    <div class="gv-step" id="details"><div class="gv-step-head"><span class="num">3</span><h2>Who is it for?</h2></div>
      <form class="form" data-gift-form autocomplete="on">
        <div class="row"><div class="field"><label for="gv-rn">Recipient's name</label><input id="gv-rn" name="recipient_name" required maxlength="80"></div><div class="field"><label for="gv-re">Recipient's email</label><input id="gv-re" name="recipient_email" type="email" placeholder="Leave blank to send it to yourself"></div></div>
        <div class="field"><label for="gv-msg">Your message <span class="muted">(printed on the voucher, optional)</span></label><textarea id="gv-msg" name="message" maxlength="240" placeholder="Take an hour for yourself…"></textarea></div>
        <div class="row"><div class="field"><label for="gv-when">Send it</label><select id="gv-when" name="send_when"><option value="now">Now</option><option value="later">On a date (e.g. their birthday)</option></select></div><div class="field" data-send-date hidden><label for="gv-date">Send on</label><input id="gv-date" name="send_date" type="date"></div></div>
        <div class="divider"></div>
        <div class="row"><div class="field"><label for="gv-bn">Your name</label><input id="gv-bn" name="buyer_name" required maxlength="80" autocomplete="name"></div><div class="field"><label for="gv-be">Your email <span class="muted">(for your receipt)</span></label><input id="gv-be" name="buyer_email" type="email" required autocomplete="email"></div></div>
        <div class="row"><div class="field"><label for="gv-from">Sign it from</label><input id="gv-from" name="from_name" maxlength="80" placeholder="Defaults to your name"></div><div class="field"><label for="gv-bp">Mobile <span class="muted">(optional)</span></label><input id="gv-bp" name="buyer_phone" type="tel" autocomplete="tel"></div></div>
        <div class="gv-pay"><div><span class="eyebrow">Total</span><div class="h2" data-gift-total>—</div></div><button class="btn" type="submit" disabled><span>Continue to secure payment</span>${icon.arrow}</button></div>
        <p class="form-note" data-gift-error style="color:#9b1c1c"></p>
        <p class="form-note">Payment is taken securely by Stripe (card, Apple Pay, Google Pay or PayNow). Prices include GST. By buying you agree to the voucher terms below.</p>
      </form></div>
  </div>
  <aside class="gv-side"><div class="gv-sticky"><span class="eyebrow">Your voucher</span><div data-gift-preview style="margin-top:12px"></div><p class="small muted" style="margin-top:12px">The recipient receives this card as a PDF with their unique code and QR.</p></div></aside>
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
  const body = pageHero({ title: `Elements<br><span class="thin">${esc(o.name)}</span>`, lede: esc(o.intro || o.blurb), trail, img: o.img,
    extra: `<div class="hero-actions" style="justify-content:flex-start;margin-top:28px" data-reveal>${btn(`/book-appointment/?outlet=${o.id}`, 'Book at ' + o.short)}${btn(`https://wa.me/65${wa}`, 'WhatsApp ' + o.whatsapp, 'btn-ghost', 'target="_blank" rel="noopener"')}</div>` }) + `
<section class="section-sm"><div class="wrap grid-2" style="align-items:start">
  <div>
    <h2 data-split>About <span class="thin">this outlet.</span></h2>
    <div class="cf-prose prose" style="margin-top:20px">${(o.about || []).map((p) => `<p data-reveal>${esc(p)}</p>`).join('')}</div>
    <ul class="checklist" style="margin-top:18px">${(o.highlights || []).map((h) => `<li data-reveal>${esc(h)}</li>`).join('')}</ul>
  </div>
  <div class="outlet-info" data-reveal>
    <div><small>Address</small><p>${o.address}</p></div>
    <div><small>Opening hours</small>${o.hours.map(([d, h]) => `<p class="row"><span>${d}</span><b>${h}</b></p>`).join('')}</div>
    <div><small>Contact</small><p><a href="tel:${tel}">Tel ${esc(o.phone)}</a><br><a href="https://wa.me/65${wa}" target="_blank" rel="noopener">WhatsApp ${esc(o.whatsapp)}</a><br><a href="mailto:${o.email}">${esc(o.email)}</a></p></div>
    <div class="outlet-map"><iframe title="Map to Elements Wellness ${esc(o.name)}" src="https://maps.google.com/maps?q=${encodeURIComponent('Elements Wellness ' + o.mapQuery)}&t=m&z=16&output=embed&iwloc=near" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
  </div>
</div></section>
${o.gallery?.length ? `<section class="section-sm" style="padding-top:0"><div class="wrap"><div class="cf-gallery c3">${o.gallery.map((g) => `<figure data-reveal><img src="/assets/img/${g}" alt="Elements Wellness ${esc(o.name)}" loading="lazy"></figure>`).join('')}</div></div></section>` : ''}
${exclusive.length ? `<section class="section-sm bg-ivory"><div class="wrap"><div class="head-row"><h2 style="font-size:clamp(24px,2.6vw,36px)">Only at <span class="thin">${esc(o.short)}.</span></h2></div><div class="cards-3">${exclusive.map((s) => serviceCard(s)).join('')}</div></div></section>` : ''}
<section class="section-sm"><div class="wrap"><div class="head-row"><h2 style="font-size:clamp(24px,2.6vw,36px)">Available <span class="thin">treatments.</span></h2><button class="link-arrow" type="button" data-finder="outlet:${o.id}">Search this outlet ${icon.arrow}</button></div>${groups.map((g) => { const l = list.filter((s) => s.group === g.id); return l.length ? `<div class="outlet-svc"><h3><a href="${g.url}">${esc(g.label)}</a></h3><p>${l.map((s) => `<a href="${s.url}">${esc(s.name)}</a>`).join(' · ')}</p></div>` : ''; }).join('')}</div></section>
${(() => { const g = googleFor(o.id); if (!g) return ''; return `<section class="section-sm bg-sand" data-google-reviews><div class="wrap">
  <div class="head-row"><div><h2 style="font-size:clamp(24px,2.6vw,36px)">What guests say <span class="thin">about ${esc(o.short)}.</span></h2>
    <div class="g-flex" style="margin-top:18px" data-rv-place="${g.id}"><div class="g-flex-num"><span data-rv-rating>${g.rating.toFixed(1)}</span><small>/ 5</small></div><div><div class="g-flex-stars">${starRow(g.rating)}</div><p><b data-rv-count>${fmtNum(g.count)}</b> Google reviews for ${esc(g.googleName)}</p></div></div></div>
    <div class="hero-actions">${btn(g.mapsUrl, 'All reviews on Google', 'btn-ghost', 'target="_blank" rel="noopener"')}${btn(g.mapsUrl, 'Write a review', '', 'target="_blank" rel="noopener"')}</div></div>
  <div class="g-grid">${g.reviews.map((r) => googleCard(r)).join('')}</div>
</div></section>`; })()}
<section class="section-sm bg-ivory"><div class="wrap"><div class="head-row"><h2 style="font-size:clamp(24px,2.6vw,36px)">Our other <span class="thin">outlets.</span></h2></div><div class="cards-2">${others.map(outletCard).join('')}</div></div></section>` + ctaBand(`See you at ${esc(o.short)}`);
  const schema = [bc(trail), { '@context': 'https://schema.org', '@type': 'DaySpa', name: 'Elements Wellness ' + o.name, telephone: '+65' + tel, email: o.email, address: { '@type': 'PostalAddress', streetAddress: o.street, postalCode: o.postal, addressLocality: 'Singapore', addressCountry: 'SG' }, openingHours: o.schemaHours, url: site.url + o.url, image: site.url + o.img, parentOrganization: { '@type': 'Organization', name: 'Elements Wellness' } }];
  return { path: o.url, html: layout({ title: `Elements Wellness ${o.name} — Spa on Orchard Road`, description: `${o.intro || o.blurb} ${o.addressPlain}. Call ${o.phone}.`, path: o.url, bodyClass: 'page-light', schema, ogImage: o.img, body }) };
}

// Whole-card link to the outlet page; phone / WhatsApp stay separately clickable
const outletCard = (o) => `<article class="card outlet-card" data-reveal>
  <div class="card-media"><img src="${o.img}" alt="Elements Wellness ${esc(o.name)}" loading="lazy"></div>
  <div class="card-body">
    <h3><a class="stretched" href="${o.url}">${esc(o.name)}</a></h3>
    <span class="tagline">${esc(o.feature)}</span>
    ${googleFor(o.id) ? `<p class="g-inline" data-rv-place="${o.id}">${gLogo}<b data-rv-rating>${googleFor(o.id).rating.toFixed(1)}</b> ${starRow(googleFor(o.id).rating)} <small>(<span data-rv-count>${fmtNum(googleFor(o.id).count)}</span> reviews)</small></p>` : ''}
    <p>${o.address}</p>
    <p class="small">${o.hours.map(([d, h]) => `${d}: ${h}`).join('<br>')}</p>
    <p class="small on-top"><a href="tel:${o.phone.replace(/\s/g, '')}">Tel ${esc(o.phone)}</a> · <a href="https://wa.me/65${o.whatsapp.replace(/\s/g, '')}" target="_blank" rel="noopener">WhatsApp ${esc(o.whatsapp)}</a></p>
    <span class="link-arrow">Discover this outlet ${icon.arrow}</span>
  </div>
</article>`;

export function locationsPage() {
  const trail = [['Home', '/'], ['Locations']];
  const body = pageHero({ eyebrow: 'Locations', title: 'Three outlets<br><span class="thin">on Orchard Road.</span>', lede: esc(site.hoursSummary), trail }) + `
${copyNote('new', 'Short introduction')}
<section class="section-sm" style="padding-top:0"><div class="wrap"><div class="cards-3">${outlets.map(outletCard).join('')}</div></div></section>` + ctaBand();
  return { path: '/locations/', html: layout({ title: 'Locations — ION Orchard, 313@somerset, The Centrepoint | Elements Wellness', description: 'Elements Wellness spas at ION Orchard, 313@somerset and The Centrepoint: addresses, opening hours, directions and booking.', path: '/locations/', bodyClass: 'page-light', schema: [bc(trail)], body }) };
}

export function contactPage() {
  const trail = [['Home', '/'], ['Contact']];
  const body = pageHero({ title: 'Three outlets<br><span class="thin">on Orchard Road.</span>', lede: `To make a booking, please call or WhatsApp your preferred location. For general enquiries, email ${site.email}.`, trail }) + `
<section class="section-sm" style="padding-top:0"><div class="wrap"><div class="cards-3">${outlets.map(outletCard).join('')}</div></div></section>
<section class="section bg-ivory"><div class="wrap grid-2" style="align-items:start">
  <div><h2 data-split>For partnership, <span class="thin">collaboration or feedback.</span></h2><p class="lede" data-reveal style="margin-top:20px">Send us a message and our team will get back to you.</p></div>
  <div><form class="form" data-demo>
    <div class="row"><div class="field"><label for="c-name">Name</label><input id="c-name" required autocomplete="name"></div><div class="field"><label for="c-phone">Mobile</label><input id="c-phone" type="tel" autocomplete="tel"></div></div>
    <div class="field"><label for="c-email">Email</label><input id="c-email" type="email" required autocomplete="email"></div>
    <div class="field"><label for="c-outlet">Preferred outlet</label><select id="c-outlet">${outlets.map((o) => `<option>${esc(o.name)}</option>`).join('')}</select></div>
    <div class="field"><label for="c-msg">Message</label><textarea id="c-msg" required></textarea></div>
    <button class="btn" type="submit"><span>Send message</span>${icon.arrow}</button>
  </form><div class="form-success"><div class="h3">Message sent</div><p style="margin:8px 0 0">Thank you — we'll be in touch shortly. (Front-end preview; the form connects to email/CRM in the backend phase.)</p></div></div>
</div></section>`;
  return { path: '/contact/', html: layout({ title: 'Contact Elements Wellness — ION Orchard, 313@somerset, The Centrepoint', description: 'Contact Elements Wellness: addresses, phone, WhatsApp and opening hours for our ION Orchard, 313@somerset and The Centrepoint spas.', path: '/contact/', bodyClass: 'page-light', schema: [bc(trail)], body }) };
}

export function bookPage(path = '/book-appointment/') {
  const trail = [['Home', '/'], ['Book Appointment']];
  const body = pageHero({ eyebrow: 'Book appointment', title: 'Reserve your<br><span class="thin">moment of calm</span>', lede: 'Choose your outlet and treatment — we will confirm your slot by WhatsApp or phone.', trail }) + `
<section class="section-sm" style="padding-top:0"><div class="wrap grid-2" style="align-items:start">
  <form class="form" data-demo>
    <div class="field"><label>Outlet</label><div class="opt-grid">${outlets.map((o, i) => `<label class="opt"><input type="radio" name="outlet" value="${o.id}" ${i === 0 ? 'checked' : ''}><span><b>${esc(o.short)}</b>${esc(o.feature)}</span></label>`).join('')}</div></div>
    <div class="field"><label for="b-cat">Treatment</label><select id="b-cat" required><option value="">Select a treatment…</option>${groups.map((g) => `<optgroup label="${esc(g.label)}">${services.filter((s) => s.group === g.id).map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</optgroup>`).join('')}<option value="elements-restore">Elements Restore assessment</option><option value="unsure">Not sure — please advise</option></select></div>
    <div class="row"><div class="field"><label for="b-date">Preferred date</label><input id="b-date" type="date" required></div><div class="field"><label for="b-time">Preferred time</label><select id="b-time">${['11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map((t) => `<option>${t}</option>`).join('')}</select></div></div>
    <div class="row"><div class="field"><label for="b-name">Name</label><input id="b-name" required autocomplete="name"></div><div class="field"><label for="b-phone">Mobile</label><input id="b-phone" type="tel" required autocomplete="tel"></div></div>
    <div class="field"><label for="b-promo">Promo code (optional)</label><input id="b-promo"></div>
    <button class="btn" type="submit"><span>Request booking</span>${icon.arrow}</button>
    <p class="form-note">By booking you agree to our <a class="link-arrow" href="/appointment-booking-cancellation-policy/">booking &amp; cancellation policy</a>.</p>
  </form>
  <div class="form-success"><div class="h3">Request received</div><p style="margin:8px 0 0">We'll confirm your appointment shortly. (Front-end preview; connects to the booking system in the backend phase.)</p></div>
  <aside class="stack" data-reveal>
    <div class="book-box"><div class="h3">Prefer to chat?</div><small>WhatsApp our concierge for same-day availability.</small>${btn(site.whatsapp, 'WhatsApp us', 'btn-light', 'target="_blank" rel="noopener"')}</div>
    ${outlets.map((o) => `<div style="border-bottom:1px solid var(--line);padding:14px 0"><b style="font-family:var(--f-display);letter-spacing:.1em;text-transform:uppercase;font-size:13px">${esc(o.name)}</b><br><a href="tel:${o.phone.replace(/\s/g, '')}" class="muted">${esc(o.phone)}</a></div>`).join('')}
  </aside>
</div></section>`;
  return { path, html: layout({ title: 'Book an Appointment | Elements Wellness Singapore', description: 'Book a massage, facial, wellness therapy, slimming treatment or onsen ritual at Elements Wellness, Orchard Road.', path, bodyClass: 'page-light', schema: [bc(trail)], body }) };
}

export function faqPage() {
  const trail = [['Home', '/'], ['FAQ & Spa Etiquette']];
  const sections = [
    ['First visit', 'first-visit', etiquette.slice(0, 2)],
    ['Preparing for your treatment', 'preparation', []],
    ['Privacy & comfort', 'privacy', etiquette.slice(2, 5)],
    ['Pricing terms', 'pricing', promoTerms.slice(0, 4)],
  ];
  const body = pageHero({ eyebrow: 'Visitor information', title: 'FAQ &amp;<br><span class="thin">spa etiquette</span>', lede: 'First-visit guidance, preparation, privacy, comfort, pricing terms and general questions.', trail }) + `
${copyNote('adapt')}
<section class="section-sm" style="padding-top:0"><div class="wrap">
  <nav class="cat-filter" aria-label="On this page">${sections.map(([t, id]) => `<a class="chip" href="#${id}">${t}</a>`).join('')}<a class="chip" href="#booking">Booking rules</a><a class="chip" href="#general">General questions</a></nav>
  <div class="faq-sections">
    ${sections.map(([t, id, items]) => `<div class="faq-sec" id="${id}"><h2 class="cf-h2">${t}</h2>${items.length ? `<ul class="checklist">${items.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}<p class="placeholder-note">${t} copy to be supplied by Elements</p></div>`).join('')}
    <div class="faq-sec" id="booking"><h2 class="cf-h2">Booking rules</h2><p>To make a booking, please call or WhatsApp your preferred outlet, or use Book Now. A summary of our booking, rescheduling and cancellation rules goes here — the full policy is on a separate page.</p><p>${linkArrow('/appointment-booking-cancellation-policy/', 'Booking & Cancellation Policy')}</p></div>
    <div class="faq-sec" id="general"><h2 class="cf-h2">General questions</h2>${faqList(faqs)}</div>
  </div>
</div></section>` + ctaBand();
  return { path: '/faq-spa-etiquette/', html: layout({ title: 'FAQ & Spa Etiquette | Elements Wellness', description: 'First-visit guidance, preparation, privacy, comfort, pricing terms and common questions about visiting Elements Wellness Singapore.', path: '/faq-spa-etiquette/', bodyClass: 'page-light', schema: [bc(trail), faqSchema(faqs)], body }) };
}

export function storyPage() {
  const trail = [['Home', '/'], ['About Elements']];
  const body = pageHero({ eyebrow: 'About Elements · Our story', title: 'A million massages<br><span class="thin">and counting</span>', lede: esc(story.lede), trail, img: '/assets/img/ion-interior.jpg' }) + `
<section class="section"><div class="wrap-narrow">
  <p class="statement" data-fill style="text-align:left;max-width:none;font-size:clamp(24px,3vw,44px)">${esc(story.statement)}</p>
</div></section>
<section class="section-sm bg-ivory"><div class="wrap grid-2" style="align-items:start">
  <div class="prose">${story.paragraphs.map((p) => `<p data-reveal>${esc(p)}</p>`).join('')}</div>
  <div style="position:sticky;top:140px;align-self:start"><figure class="cf-figure" data-clip style="margin:0"><img src="/assets/img/ion-storefront.jpg" alt="Elements Wellness ION Orchard" loading="lazy"></figure></div>
</div></section>
<section class="section"><div class="wrap">
  <div class="promises" data-reveal>${story.stats.map(([n, l]) => `<div class="promise"><div class="h2" style="color:var(--maroon)">${n}</div><h3 style="margin-top:10px">${l}</h3></div>`).join('')}</div>
</div></section>` + ctaBand('Become part of the story');
  return { path: '/about-elements/', html: layout({ title: 'About Elements | Elements Wellness Singapore', description: story.lede, path: '/about-elements/', bodyClass: 'page-light', schema: [bc(trail)], body }) };
}

export function policyPage(p) {
  const trail = [['Home', '/'], [p.title]];
  const old = oldPage(p.url); const oh = old ? splitHero(old, p.title) : { rest: [] };
  const body = pageHero({ eyebrow: 'Policy', title: esc(p.title), trail }) + `<section class="section-sm" style="padding-top:0">${old && old.blocks.length ? `<div class="content-flow">${renderBlocks(old.blocks.filter((b) => !(b.t === 'heading' && b.text.toLowerCase() === p.title.toLowerCase())))}</div>` : `<div class="wrap-narrow prose">${p.body}</div>`}</section>`;
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
  const body = pageHero({ eyebrow: h.label || 'Elements Wellness', title: esc(title), lede: esc(h.tagline || old.description || ''), trail, img: h.heroImg }) + `
<section class="section-sm" style="padding-top:0"><div class="content-flow">${renderBlocks(h.rest, { skipImages: [h.heroImg] })}</div></section>` + ctaBand();
  return { path: pathname, html: layout({ title: `${title} | Elements Wellness`, description: old.description || title, path: pathname, bodyClass: 'page-light', schema: [bc(trail)], body }) };
}
