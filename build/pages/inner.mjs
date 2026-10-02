// Inner page templates. Each returns { path, html }.
import { site, categories, services, concerns, outlets, awards, posts, faqs, products, promotions, promoTerms, voucherItems, blogTopics, story, policies, etiquette } from '../data.mjs';
import { layout, esc, icon, btn, linkArrow, ring, faqList, logo, crumbs, serviceCard } from '../ui.mjs';
import { oldPage, splitHero, renderBlocks, pageIndex } from '../content.mjs';
import { shopProducts, googleFor } from '../data.mjs';
import { googleCard, starRow, fmtNum, gLogo } from '../ui.mjs';

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

/* ---------- Services overview ---------- */
export function servicesIndex() {
  const trail = [['Home', '/'], ['Treatments']];
  const body = pageHero({ eyebrow: 'All treatments', title: 'Treatments<br><span class="thin">for every body</span>', lede: 'Massage, facials, wellness therapies, slimming and spa rituals — search by how you feel, or browse by category.', trail,
    extra: `<div style="margin-top:36px" data-reveal><button class="hero-finder" type="button" data-finder style="margin:0;background:var(--ivory);border-color:var(--line);color:var(--ink)">${icon.search}<span class="hf-text" style="color:var(--stone)">Search a treatment or concern…</span><span class="btn btn-sm" aria-hidden="true"><span>Find</span></span></button></div>` }) + `
<section class="section-sm"><div class="wrap">
  ${categories.map((c, i) => `
  <div style="margin-bottom:clamp(64px,8vw,120px)" id="${c.id}">
    <div class="head-row"><div><span class="eyebrow" data-reveal>${esc(c.label)}</span><h2 data-split style="margin-top:18px">${esc(c.label)}</h2></div><div style="max-width:520px"><p class="lede" data-reveal style="margin-bottom:18px">${esc(c.blurb)}</p>${linkArrow(c.url, 'View ' + c.label.toLowerCase())}</div></div>
    <div class="cards-4">${services.filter((s) => s.category === c.id && !s.hidden).slice(0, 4).map((s) => serviceCard(s)).join('')}</div>
  </div>`).join('')}
</div></section>` + ctaBand();
  return { path: '/services/', html: layout({ title: 'Spa Treatments in Singapore — Massage, Facial, Wellness & Slimming | Elements Wellness', description: 'Browse every Elements Wellness treatment: TCM and sports massage, results-driven facials, recovery therapies, INDIBA® slimming and onsen rituals across three Orchard Road outlets.', path: '/services/', active: 'services', bodyClass: 'page-light', schema: [bc(trail)], body }) };
}

/* ---------- Category page ---------- */
export function categoryPage(c) {
  const list = services.filter((s) => s.category === c.id && !s.hidden);
  const trail = [['Home', '/'], ['Treatments', '/services/'], [c.label]];
  const concernIds = [...new Set(list.flatMap((s) => s.concerns))];
  const chips = concerns.filter((x) => concernIds.includes(x.id));
  const sub = c.subpages || [];
  const old = oldPage(c.url); const oh = old ? splitHero(old, c.label) : { rest: [] };
  const body = pageHero({ title: esc(c.label), lede: esc(oh.tagline || c.blurb), trail, img: oh.heroImg || c.hero || c.img }) + `
${old && oh.rest.length ? `<section class="section-sm"><div class="content-flow wide">${renderBlocks(oh.rest, { skipImages: [oh.heroImg] })}</div></section>` : ''}
<section class="section-sm"><div class="wrap"><div class="head-row"><div><span class="eyebrow">All ${esc(c.label.toLowerCase())} treatments</span><h2 style="margin-top:14px">Browse <span class="thin">by concern.</span></h2></div></div>
  ${sub.length ? `<div style="margin-bottom:56px"><div class="finder-label">Shop by skin concern</div><div class="cat-filter">${sub.map((p) => `<a class="chip" href="${p.url}">${esc(p.label)}</a>`).join('')}</div></div>` : ''}
  <div class="cat-filter" data-filter-group="#svc-list" role="group" aria-label="Filter by concern">
    <button class="chip" type="button" data-filter="all" aria-pressed="true">All ${list.length}</button>
    ${chips.map((x) => `<button class="chip" type="button" data-filter="${x.id}" aria-pressed="false">${esc(x.label)}</button>`).join('')}
  </div>
  <div class="svc-list" id="svc-list">${list.map((s) => serviceCard(s)).join('')}</div>
</div></section>
${c.faqs?.length ? `<section class="section bg-ivory"><div class="wrap-narrow"><span class="eyebrow" data-reveal>${esc(c.label)} FAQ</span><h2 data-split style="margin:20px 0 40px">Before you book</h2>${faqList(c.faqs)}</div></section>` : ''}
` + ctaBand();
  return { path: c.url, html: layout({ title: old?.title ? `${old.title} | Elements Wellness` : `${c.label} in Singapore | Elements Wellness`, description: old?.description || c.metaDescription || c.blurb, path: c.url, active: 'services', bodyClass: 'page-light', schema: [bc(trail), ...(c.faqs?.length ? [faqSchema(c.faqs)] : [])], body }) };
}

/* ---------- Concern sub-page (e.g. facial concern pages kept from old site) ---------- */
export function concernPage(c, sp) {
  const rec = sp.recommended.map((n) => services.find((s) => s.category === 'facial' && !s.alias && (s.name.toLowerCase().includes(n.toLowerCase().replace(/\s*\(.*\)|®/g, '').replace(' facial', '').trim()) || n.toLowerCase().includes(s.name.toLowerCase().replace(/®|\s*\(.*\)/g, '').replace(' facial', ''))))).filter(Boolean);
  const list = [...new Set([...rec, ...services.filter((s) => s.category === c.id && s.concerns.includes(sp.concern))])];
  const trail = [['Home', '/'], ['Treatments', '/services/'], [c.label, c.url], [sp.label]];
  const old = oldPage(sp.url); const oh = old ? splitHero(old, sp.label) : { rest: [] };
  const body = pageHero({ eyebrow: `${c.label} · by concern`, title: esc(sp.label), lede: esc(oh.tagline || sp.blurb), trail, img: oh.heroImg }) + `
${old && oh.rest.length ? `<section class="section-sm"><div class="content-flow wide">${renderBlocks(oh.rest, { skipImages: [oh.heroImg] })}</div></section>` : ''}
<section class="section-sm"><div class="wrap"><div class="head-row"><div><span class="eyebrow">Recommended</span><h2 style="margin-top:14px">Treatments <span class="thin">for this concern.</span></h2></div></div><div class="svc-list">${(list.length ? list : services.filter((s) => s.category === c.id).slice(0, 6)).map((s) => serviceCard(s)).join('')}</div></div></section>` + ctaBand();
  return { path: sp.url, html: layout({ title: old?.title ? `${old.title} | Elements Wellness` : `${sp.label} Facial Treatments in Singapore | Elements Wellness`, description: old?.description || sp.blurb, path: sp.url, active: 'services', bodyClass: 'page-light', schema: [bc(trail)], body }) };
}

/* ---------- Service detail ---------- */
export function servicePage(s) {
  const c = categories.find((x) => x.id === s.category);
  const trail = [['Home', '/'], ['Treatments', '/services/'], [c.label, c.url], [s.name]];
  const related = services.filter((x) => x.id !== s.id && !x.hidden && (x.category === s.category || x.concerns.some((k) => s.concerns.includes(k)))).slice(0, 3);
  const aw = awards.filter((a) => a.serviceIds?.includes(s.id));
  const avail = outlets.filter((o) => !s.outlets || s.outlets.includes(o.id));
  const old = oldPage(s.url);
  const h = old ? splitHero(old, s.name) : { rest: [] };
  const heroImg = h.heroImg || s.img;
  const lede = h.tagline || s.short;
  const priceLine = h.price || [s.duration, s.price ? `${s.priceNote || ''} ${s.price}`.trim() : '', s.up ? `U.P. ${s.up}` : ''].filter(Boolean).join(' · ');
  const body = `
<section class="page-hero"><div class="wrap">
  ${crumbs(trail)}
  <div class="svc-hero">
    <div>
      <span class="eyebrow" data-reveal="drop">${esc(h.label || c.label)}${s.tag ? ' · ' + esc(s.tag) : ''}</span>
      <h1 data-split style="margin-top:18px;font-size:clamp(34px,4.8vw,72px)">${esc(s.name)}</h1>
      <p class="lede" data-reveal style="margin-top:20px">${esc(lede)}</p>
      <div class="svc-facts" data-reveal>
        <div><small>Duration</small><b>${esc(s.duration || 'Ask us')}</b></div>
        <div><small>${esc(s.priceNote || 'Price')}</small><b>${esc(s.price || 'Enquire')}</b>${s.up ? ` <s class="muted" style="font-size:13px">U.P. ${esc(s.up)}</s>` : ''}</div>
        <div><small>Available at</small><b style="font-size:14px">${avail.map((o) => esc(o.short)).join(' · ')}</b></div>
      </div>
      <div class="hero-actions" style="justify-content:flex-start;margin-top:28px" data-reveal>${btn(`/book-appointment/?treatment=${s.id}`, 'Book this treatment')}${btn(site.whatsapp, 'Ask a therapist', 'btn-ghost', 'target="_blank" rel="noopener"')}</div>
      ${priceLine ? `<p class="small muted" data-reveal style="margin-top:14px;font-size:13px">${esc(priceLine)}</p>` : ''}
    </div>
    <div class="svc-hero-media" data-clip><img src="${heroImg}" alt="${esc(s.name)} at Elements Wellness"></div>
  </div>
</div></section>
<div class="reading-bar" aria-hidden="true"></div>
<section class="section-sm"><div class="wrap svc-body">
  <aside class="svc-aside">
    <div class="book-box"><small>${esc(s.priceNote || '')}${s.duration ? ' · ' + esc(s.duration) : ''}</small><div class="price">${esc(s.price || 'Enquire')}${s.up ? ` <s style="font-size:15px;opacity:.6">${esc(s.up)}</s>` : ''}</div><small>All prices after GST. First-trial offers for first-time local visitors.</small>${btn(`/book-appointment/?treatment=${s.id}`, 'Book now', 'btn-light')}</div>
    ${aw.length ? `<div class="panel-soft"><span class="eyebrow">Award-winning</span><div class="awards-inline" style="margin-top:12px">${aw.map((a) => `<a href="${a.url}" title="${esc(a.title)}">${a.logo ? `<img src="${a.logo}" alt="${esc(a.title)}">` : `<span class="pill-award">${esc(a.publicationShort)} ${a.year}</span>`}</a>`).join('')}</div></div>` : ''}
  </aside>
  <div class="content-flow" style="padding-inline:0;max-width:none">
    ${old && h.rest.length ? renderBlocks(h.rest, { skipImages: [heroImg] }) : `
    <div class="cf-prose prose" data-reveal>${(s.description || s.short).split('\n\n').map((p) => `<p>${esc(p)}</p>`).join('')}</div>
    ${s.targets?.length ? `<span class="cf-label">What it targets</span><ul class="checklist" data-reveal>${s.targets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}`}
    ${s.elements && !(old && h.rest.length) ? `<div class="el-grid">${Object.entries(s.elements).map(([k, v]) => { const [feel, organs, enh] = v.split(' — '); const g = { Metal: '金', Wood: '木', Water: '水', Fire: '火', Earth: '土' }[k]; return `<div class="el-card" data-reveal><span class="glyph">${g}</span><h3>${esc(k)}</h3><p><b>${esc(feel || '')}</b></p><p class="muted">${esc(organs || '')}</p><small>Enhancement · ${esc(enh || '')}</small></div>`; }).join('')}</div>` : ''}
    <span class="cf-label">Good for</span>
    <div class="suitable" data-reveal>${s.concerns.map((k) => concerns.find((x) => x.id === k)).filter(Boolean).map((x) => `<a href="/services/?concern=${x.id}" data-finder="concern:${x.id}"><span>${esc(x.label)}</span></a>`).join('')}</div>
  </div>
</div></section>
${related.length ? `<section class="section bg-ivory"><div class="wrap"><div class="head-row"><div><span class="eyebrow">Pairs well with</span><h2 style="margin-top:14px">You may <span class="thin">also like.</span></h2></div>${linkArrow(c.url, 'All ' + c.label.toLowerCase())}</div><div class="cards-3">${related.map((r) => serviceCard(r)).join('')}</div></div></section>` : ''}
` + ctaBand(`Book your ${esc(s.name.replace(/^The /, ''))}`);
  const schema = [bc(trail), { '@context': 'https://schema.org', '@type': 'Service', name: s.name, serviceType: c.label, description: old?.description || s.short, provider: { '@type': 'DaySpa', name: 'Elements Wellness', url: site.url }, areaServed: 'Singapore', ...(s.priceNum ? { offers: { '@type': 'Offer', price: s.priceNum, priceCurrency: 'SGD' } } : {}) }];
  return { path: s.url, html: layout({ title: old?.title ? `${old.title} | Elements Wellness` : `${s.name} Singapore | ${c.label} | Elements Wellness`, description: old?.description || s.meta || s.short, path: s.url, active: 'services', bodyClass: 'page-light', schema, ogImage: heroImg, body }) };
}

/* ---------- Spa ritual + onsen ---------- */
export function spaRitual() {
  const c = categories.find((x) => x.id === 'spa-ritual');
  const list = services.filter((s) => s.category === 'spa-ritual');
  const trail = [['Home', '/'], ['Spa Ritual']];
  const body = pageHero({ eyebrow: 'Spa rituals', title: 'Rituals made<br><span class="thin">for slowing down</span>', lede: esc(c.blurb), trail, img: '/assets/img/couple-onsen-2.jpg' }) + `
<section class="section-sm"><div class="wrap"><div class="cards-3">${list.map((s) => serviceCard(s)).join('')}</div></div></section>` + ctaBand('Make time for two');
  return { path: '/spa-ritual/', html: layout({ title: 'Spa Rituals & Couple Spa Packages in Singapore | Elements Wellness', description: c.blurb, path: '/spa-ritual/', active: 'ritual', bodyClass: 'page-light', schema: [bc(trail)], body }) };
}

/* ---------- Awards ---------- */
export function awardsIndex() {
  const trail = [['Home', '/'], ['Awards']];
  const years = [...new Set(awards.map((a) => a.year))].sort((a, b) => b - a);
  const body = pageHero({ eyebrow: 'Recognition', title: 'Award-winning,<br><span class="thin">year after year</span>', lede: `${awards.length} awards from Singapore’s leading beauty and lifestyle titles since 2014. Each award has its own page and links to the treatment it celebrates.`, trail, dark: true }) + `
<section class="section-sm"><div class="wrap">
  <div class="cat-filter" data-filter-group="#award-list" role="group" aria-label="Filter by year"><button class="chip" type="button" data-filter="all" aria-pressed="true">All years</button>${years.map((y) => `<button class="chip" type="button" data-filter="y${y}" aria-pressed="false">${y}</button>`).join('')}</div>
  <div id="award-list">${awards.map((a) => `
    <a class="award-row" href="${a.url}" data-tags="y${a.year}" data-reveal data-cursor="View">
      <span class="yr">${a.year}</span>
      ${a.logo ? `<img src="${a.logo}" alt="" loading="lazy">` : `<span class="award-mono">${esc(a.publicationShort.split(' ').map((w) => w[0]).join('').slice(0, 3))}</span>`}
      <div><h3>${esc(a.title)}</h3><p>${esc(a.publication)}${a.treatment ? ' · ' + esc(a.treatment) : ''}${a.label ? ' · <em style="font-style:normal;color:var(--maroon)">' + esc(a.label) + '</em>' : ''}</p></div>
      <span class="link-arrow">View ${icon.arrow}</span>
    </a>`).join('')}
  </div>
</div></section>` + ctaBand('Experience the award winners');
  return { path: '/awards/', html: layout({ title: 'Awards & Accolades | Elements Wellness Singapore', description: 'Elements Wellness awards from Daily Vanity, Beauty Insider, Harper’s Bazaar, Her World, Women’s Weekly and more — and the treatments that won them.', path: '/awards/', active: 'awards', schema: [bc(trail)], body }) };
}

export function awardPage(a) {
  const trail = [['Home', '/'], ['Awards', '/awards/'], [a.title]];
  const svcs = services.filter((s) => a.serviceIds?.includes(s.id));
  const others = [...awards.filter((x) => x.slug !== a.slug && x.year === a.year), ...awards.filter((x) => x.year !== a.year)].slice(0, 4);
  const body = `
<section class="page-hero"><div class="wrap">
  ${crumbs(trail)}
  <div class="grid-2">
    <div>
      <span class="eyebrow" data-reveal>${esc(a.publication)}${a.label ? ' · ' + esc(a.label) : ''}</span>
      <h1 data-split style="margin-top:22px;font-size:clamp(32px,4.6vw,72px)">${esc(a.title)}</h1>
      <p class="lede" data-reveal style="margin-top:24px">${esc(a.summary || `Elements Wellness was recognised by ${a.publication} in ${a.year}${a.category ? ` for ${a.category}` : ''}.`)}</p>
      <div class="svc-facts" data-reveal><div><small>Year</small><b>${a.year}</b></div><div><small>Awarded by</small><b style="font-size:15px">${esc(a.publicationShort)}</b></div><div><small>Treatment</small><b style="font-size:15px">${esc(a.treatment || '—')}</b></div></div>
      <div class="hero-actions" style="justify-content:flex-start;margin-top:32px" data-reveal>${svcs[0] ? btn(svcs[0].url, 'See the treatment') : btn('/services/', 'Explore treatments')}${a.source ? btn(a.source, 'Award source', 'btn-ghost', 'target="_blank" rel="noopener"') : ''}</div>
    </div>
    <div data-reveal>
      <div class="award-hero-badge">
        <svg viewBox="0 0 200 200" aria-hidden="true"><defs><path id="c-${a.slug}" d="M100,100 m-88,0 a88,88 0 1,1 176,0 a88,88 0 1,1 -176,0"/></defs><text><textPath href="#c-${a.slug}">${esc(a.publication)} · ${a.year} · Elements Wellness · ${esc(a.publication)} · ${a.year} ·</textPath></text></svg>
        ${a.logo ? `<img src="${a.logo}" alt="${esc(a.title)}">` : `<div style="text-align:center"><div class="h2" style="color:var(--maroon)">${a.year}</div><small class="caps" style="font-family:var(--f-display);font-weight:700;letter-spacing:.2em;font-size:11px;color:var(--stone);text-transform:uppercase">${esc(a.publicationShort)}</small></div>`}
      </div>
    </div>
  </div>
</div></section>
${svcs.length ? `<section class="section-sm bg-ivory"><div class="wrap"><span class="eyebrow">The winning treatment${svcs.length > 1 ? 's' : ''}</span><div class="cards-3" style="margin-top:32px">${svcs.map((s) => serviceCard(s)).join('')}</div></div></section>` : ''}
<section class="section-sm"><div class="wrap"><div class="head-row"><h2 style="font-size:clamp(24px,2.6vw,36px)">More accolades</h2>${linkArrow('/awards/', 'All awards')}</div>
<div id="more">${others.map((o) => `<a class="award-row" href="${o.url}"><span class="yr">${o.year}</span>${o.logo ? `<img src="${o.logo}" alt="" loading="lazy">` : `<span class="award-mono">${esc(o.publicationShort.split(' ').map((w) => w[0]).join('').slice(0, 3))}</span>`}<div><h3>${esc(o.title)}</h3><p>${esc(o.publication)}</p></div><span class="link-arrow">View ${icon.arrow}</span></a>`).join('')}</div></div></section>` + ctaBand();
  const schema = [bc(trail), { '@context': 'https://schema.org', '@type': 'WebPage', name: a.title, about: { '@type': 'DaySpa', name: 'Elements Wellness', award: `${a.title} (${a.publication}, ${a.year})` } }];
  return { path: a.url, html: layout({ title: `${a.title} — ${a.publicationShort} ${a.year} | Elements Wellness`, description: `${a.treatment || 'Elements Wellness'} won ${a.title} at the ${a.publication}. ${a.summary || 'See the award-winning treatment and book at our Orchard Road outlets.'}`.slice(0, 300), path: a.url, active: 'awards', bodyClass: 'page-light', schema, body }) };
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

/* ---------- Health analysis ---------- */
export function healthAnalysis() {
  const trail = [['Home', '/'], ['Health Analysis']];
  const hf = [
    { q: 'How long does the analysis take?', a: 'The machine analysis itself is quick. Your therapist then spends time walking you through your Elements report on iPad.' },
    { q: 'Is my information kept private?', a: 'Yes. Your analysis and report are stored only in the secure Elements staff system and are never shown publicly on the website.' },
    { q: 'Can I compare results over time?', a: 'Yes. Each analysis is saved to your customer record, so your therapist can show your progress between visits.' },
    { q: 'Do I have to buy treatments afterwards?', a: 'No. The report explains what the results mean. Any treatment or supplement suggestions are for you to consider.' },
  ];
  const body = pageHero({ eyebrow: 'New at Elements', title: 'Health<br><span class="thin">Analysis</span>', lede: 'A simple, personal report that turns a technical machine scan into clear insights — explained face-to-face by your therapist.', trail, dark: true,
    extra: `<div class="hero-actions" style="justify-content:flex-start;margin-top:36px" data-reveal>${btn('/book-appointment/?treatment=health-analysis', 'Book an analysis', 'btn-light')}${btn('#how', 'How it works', 'btn-ghost-light')}</div>` }) + `
<section class="section" id="how" data-steps><div class="wrap steps">
  <div>
    <div class="step-intro"><span class="eyebrow">How it works</span><h2 style="margin-top:20px">From scan<br>to clarity</h2></div>
    ${[
      ['Analyse', 'Complete a quick machine analysis in the spa. It produces a detailed technical PDF.', '/assets/img/acuwave.jpg'],
      ['Simplify', 'Our system reads the PDF and creates an Elements-formatted summary: your overall picture, key findings and the areas that matter most.', '/assets/img/private-room.jpg'],
      ['Explain', 'Your therapist reviews the summary, adds personal notes and walks you through it on iPad — no jargon, just what it means for you.', '/assets/img/aquaglow.jpg'],
      ['Track', 'Your report is saved to your record so every future analysis shows your progress.', '/assets/img/red-light.jpg'],
    ].map(([t, p, img], i) => `<div class="step"><div class="step-img-mobile"><img src="${img}" alt="" loading="lazy"></div><div class="num"><span>0${i + 1}</span></div><h3>${t}</h3><p>${p}</p></div>`).join('')}
  </div>
  <div><div class="steps-media"><img src="/assets/img/acuwave.jpg" alt="" loading="lazy"><img src="/assets/img/private-room.jpg" alt="" loading="lazy"><img src="/assets/img/aquaglow.jpg" alt="" loading="lazy"><img src="/assets/img/red-light.jpg" alt="" loading="lazy"><span class="count">01 / 04</span></div></div>
</div></section>
<section class="section bg-sand"><div class="wrap grid-2">
  <div><span class="eyebrow" data-reveal>Your Elements report</span><h2 data-split style="margin:20px 0 28px">What you'll<br>take away</h2>
  <ul class="benefits" data-reveal style="grid-template-columns:1fr">${['Your name and analysis date', 'An overall summary in plain language', 'Key findings and important areas to discuss', 'A simple reading breakdown', 'Therapist notes and suggested next steps', 'History to compare with previous analyses'].map((b) => `<li>${b}</li>`).join('')}</ul></div>
  <div data-reveal>
    <div class="voucher" data-tilt style="aspect-ratio:.78;background:var(--ivory);color:var(--ink);justify-content:flex-start;gap:18px">
      <div style="display:flex;justify-content:space-between;align-items:center"><span style="color:var(--maroon)">${logo()}</span><small class="muted">Sample report</small></div>
      <div><small class="muted">Client</small><div class="h3">Jane Tan · 12 Sep 2026</div></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">${[['Balance', 86], ['Sleep', 62], ['Circulation', 74]].map(([k, v]) => `<div style="background:var(--cream);border-radius:4px;padding:14px"><small class="muted" style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-family:var(--f-display);font-weight:700">${k}</small><div class="h2" style="font-size:34px;color:var(--maroon)"><span data-count="${v}">0</span></div><div style="height:4px;background:var(--sand);border-radius:4px;overflow:hidden"><i style="display:block;height:100%;width:${v}%;background:var(--maroon)"></i></div></div>`).join('')}</div>
      <div style="background:var(--blush);border-radius:4px;padding:16px;font-size:14px"><b style="font-family:var(--f-display);letter-spacing:.14em;text-transform:uppercase;font-size:11px;color:var(--maroon)">Therapist note</b><br>Tension concentrated in shoulders and lower back. Recommend Meridian Flush Therapy weekly for 4 weeks, then reassess.</div>
      <small class="muted" style="margin-top:auto">Illustrative example only — the final report layout will follow Elements' key points.</small>
    </div>
  </div>
</div></section>
<section class="section"><div class="wrap-narrow"><span class="eyebrow" data-reveal>FAQ</span><h2 data-split style="margin:20px 0 40px">Health Analysis questions</h2>${faqList(hf)}</div></section>` + ctaBand('Understand your body first');
  return { path: '/health-analysis/', html: layout({ title: 'Health Analysis in Singapore — Personal Wellness Report | Elements Wellness', description: 'Elements Health Analysis turns a machine scan into a simple, personal report explained by your therapist on iPad, with history saved for progress tracking.', path: '/health-analysis/', active: 'health', schema: [bc(trail), faqSchema(hf)], body }) };
}

/* ---------- Shop / products ---------- */
export function shopIndex() {
  const trail = [['Home', '/'], ['Supplements']];
  const body = pageHero({ eyebrow: 'Shop', title: 'Buy online,<br><span class="thin">enjoy in spa.</span>', lede: 'Onsen rituals and massage trials to purchase online, plus the new therapist-recommended supplement range.', trail }) + `
<section class="section-sm" style="padding-top:0"><div class="wrap">
  <div class="head-row"><div><span class="eyebrow">Shop</span><h2 style="margin-top:14px">Rituals &amp; <span class="thin">trials to buy online.</span></h2></div></div>
  <div class="cards-4" style="margin-bottom:64px">${shopProducts.map((p) => `<a class="card" href="${p.url}" data-reveal><div class="card-media"><img src="${p.img}" alt="${esc(p.imgAlt || p.name)}" loading="lazy"></div><div class="card-body"><h3>${esc(p.name)}</h3><p>${esc(p.desc.slice(0, 120))}${p.desc.length > 120 ? '…' : ''}</p><div class="meta"><span style="font-size:18px">${esc(p.price)}</span><span>View →</span></div></div></a>`).join('')}</div>
  <div class="head-row"><div><span class="eyebrow">Supplements · new</span><h2 style="margin-top:14px">Continue your <span class="thin">results at home.</span></h2></div><span class="placeholder-note">Range, images and pricing to be supplied by Elements</span></div>
  <div class="cards-3">
${products.map((p) => `<a class="card" href="${p.url}" data-reveal><div class="card-media product-media" style="border-radius:0;aspect-ratio:1"><div class="bottle"><div class="lbl"><div>${logo()}<em>${esc(p.short)}</em></div></div></div></div><div class="card-body"><h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p><div class="meta"><span>${esc(p.price)}</span><span>View →</span></div></div></a>`).join('')}
</div></div></section>` + ctaBand('Not sure which supplement?', 'Start with a Health Analysis and your therapist will recommend what suits you.');
  return { path: '/shop/', html: layout({ title: 'Wellness Supplements | Elements Wellness Singapore', description: 'Therapist-recommended wellness supplements from Elements Wellness to continue your results between visits.', path: '/shop/', bodyClass: 'page-light', schema: [bc(trail)], body }) };
}

export function productPage(p) {
  const trail = [['Home', '/'], ['Supplements', '/shop/'], [p.name]];
  const rel = services.filter((s) => p.serviceIds?.includes(s.id));
  const body = `
<section class="page-hero"><div class="wrap">
  ${crumbs(trail)}
  <div class="grid-2">
    <div class="product-media" data-reveal><div class="bottle" style="width:30%"><div class="lbl"><div>${logo()}<em>${esc(p.short)}</em></div></div></div></div>
    <div>
      <span class="placeholder-note" data-reveal>✦ Placeholder product — details to be supplied</span>
      <h1 data-split style="margin-top:22px;font-size:clamp(32px,4.4vw,64px)">${esc(p.name)}</h1>
      <p class="lede" data-reveal style="margin-top:20px">${esc(p.desc)}</p>
      <div class="h2" style="color:var(--maroon);margin:24px 0;font-size:36px" data-reveal>${esc(p.price)}</div>
      <ul class="benefits" data-reveal>${p.benefits.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      <div class="hero-actions" style="justify-content:flex-start" data-reveal>${btn('/contact-us/?product=' + p.slug, 'Enquire / reserve')}${btn('/health-analysis/', 'Get a recommendation', 'btn-ghost')}</div>
    </div>
  </div>
</div></section>
${rel.length ? `<section class="section-sm bg-ivory"><div class="wrap"><span class="eyebrow">Pairs with</span><div class="cards-3" style="margin-top:28px">${rel.map((s) => serviceCard(s)).join('')}</div></div></section>` : ''}` + ctaBand();
  return { path: p.url, html: layout({ title: `${p.name} | Elements Wellness Supplements`, description: p.desc, path: p.url, bodyClass: 'page-light', schema: [bc(trail), { '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.desc, brand: 'Elements Wellness' }], body }) };
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

/* ---------- Gift vouchers ---------- */
export function giftVouchers() {
  const trail = [['Home', '/'], ['Gift Vouchers']];
  const amounts = [100, 200, 300];
  const body = pageHero({ eyebrow: 'Gift vouchers', title: 'The gift of<br><span class="thin">feeling well</span>', lede: 'Choose a value or a treatment. Redeemable at ION Orchard, 313@somerset and The Centrepoint.', trail }) + `
<section class="section-sm" style="padding-top:0"><div class="wrap grid-2" style="align-items:start">
  <div data-reveal style="position:sticky;top:120px">
    <div class="voucher" data-tilt>
      <div style="display:flex;justify-content:space-between;align-items:start">${logo()}<small style="letter-spacing:.2em;text-transform:uppercase;font-family:var(--f-display);font-weight:700;font-size:10.5px;opacity:.7">Gift voucher</small></div>
      <div><small style="opacity:.7">A moment of calm, worth</small><div class="amt" data-v="200">S$200</div></div>
      <svg class="v-ring" viewBox="0 0 100 100" fill="none" stroke="currentColor"><circle cx="50" cy="50" r="46"/><circle cx="50" cy="50" r="30" stroke-dasharray="1 3"/></svg>
    </div>
  </div>
  <div>
    <form class="form" data-demo>
      <div class="field"><label>Choose a value</label><div class="cat-filter" style="margin:0">${amounts.map((a) => `<button class="chip" type="button" data-amount="${a}" aria-pressed="${a === 200}">S$${a}</button>`).join('')}</div></div>
      <div class="field"><label for="gv-type">Or a treatment</label><select id="gv-type"><option>Any value (credit)</option>${voucherItems.filter((v) => !/Spa Voucher/.test(v.name)).map((v) => `<option>${esc(v.name)} — ${esc(v.price)}</option>`).join('')}</select></div>
      <div class="row"><div class="field"><label for="gv-to">Recipient name</label><input id="gv-to" required></div><div class="field"><label for="gv-from">From</label><input id="gv-from" required></div></div>
      <div class="field"><label for="gv-email">Recipient email</label><input id="gv-email" type="email" required></div>
      <div class="field"><label for="gv-msg">Message</label><textarea id="gv-msg" placeholder="Take an hour for yourself…"></textarea></div>
      <button class="btn" type="submit"><span>Continue to payment</span>${icon.arrow}</button>
      <p class="form-note">Vouchers are issued and tracked in the Elements gift-card system with a unique code, balance and expiry.</p>
    </form>
    <div class="form-success"><div class="h3">Thank you</div><p style="margin:8px 0 0">This is a front-end preview — payment and voucher issuing connect in the backend phase.</p></div>
  </div>
</div></section>
<section class="section bg-ivory"><div class="wrap-narrow"><span class="eyebrow" data-reveal>Voucher FAQ</span><h2 data-split style="margin:20px 0 40px">How vouchers work</h2>${faqList([
    { q: 'Where can vouchers be redeemed?', a: 'At all three Elements Wellness outlets: ION Orchard, 313@somerset and The Centrepoint.' },
    { q: 'How do I check my balance?', a: 'Our front desk can look up your voucher by code or name and tell you the remaining balance and expiry.' },
    { q: 'Do vouchers expire?', a: 'Validity is shown on each voucher. Please contact us if you have questions about your voucher terms.' },
  ])}</div></section>
<section class="section-sm"><div class="wrap"><span class="eyebrow" data-reveal>Treatment vouchers</span><h2 data-split style="margin:20px 0 40px">Or gift an experience</h2><div class="cards-3">${voucherItems.filter((v) => !/Spa Voucher/.test(v.name)).map((v) => `<div class="card" data-reveal><div class="card-body"><h3>${esc(v.name)}</h3><p>${esc(v.desc)}</p><div class="meta"><span style="font-size:18px">${esc(v.price)}</span></div></div></div>`).join('')}</div></div></section>` + ctaBand();
  return { path: '/gift-vouchers/', html: layout({ title: 'Spa Gift Vouchers Singapore | Elements Wellness', description: 'Give an Elements Wellness gift voucher for massage, facials, onsen rituals and more, redeemable at three Orchard Road outlets.', path: '/gift-vouchers/', bodyClass: 'page-light', schema: [bc(trail)], body }) };
}

/* ---------- Locations ---------- */
export function outletPage(o) {
  const trail = [['Home', '/'], ['Contact', '/contact-us/'], [o.name]];
  const list = services.filter((s) => !s.hidden && (!s.outlets || s.outlets.includes(o.id)));
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
<section class="section-sm"><div class="wrap"><div class="head-row"><h2 style="font-size:clamp(24px,2.6vw,36px)">Treatments <span class="thin">here.</span></h2><button class="link-arrow" type="button" data-finder="outlet:${o.id}">Search this outlet ${icon.arrow}</button></div><div class="cards-4">${list.filter((s) => s.signature && !exclusive.includes(s)).slice(0, 8).map((s) => serviceCard(s)).join('')}</div></div></section>
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
  return { path: '/contact-us/', html: layout({ title: 'Contact Elements Wellness — ION Orchard, 313@somerset, The Centrepoint', description: 'Contact Elements Wellness: addresses, phone, WhatsApp and opening hours for our ION Orchard, 313@somerset and The Centrepoint spas.', path: '/contact-us/', bodyClass: 'page-light', schema: [bc(trail)], body }) };
}

export function bookPage(path = '/book-appointment/') {
  const trail = [['Home', '/'], ['Book Appointment']];
  const body = pageHero({ eyebrow: 'Book appointment', title: 'Reserve your<br><span class="thin">moment of calm</span>', lede: 'Choose your outlet and treatment — we will confirm your slot by WhatsApp or phone.', trail }) + `
<section class="section-sm" style="padding-top:0"><div class="wrap grid-2" style="align-items:start">
  <form class="form" data-demo>
    <div class="field"><label>Outlet</label><div class="opt-grid">${outlets.map((o, i) => `<label class="opt"><input type="radio" name="outlet" value="${o.id}" ${i === 0 ? 'checked' : ''}><span><b>${esc(o.short)}</b>${esc(o.feature)}</span></label>`).join('')}</div></div>
    <div class="field"><label for="b-cat">Treatment</label><select id="b-cat" required><option value="">Select a treatment…</option>${categories.map((c) => `<optgroup label="${esc(c.label)}">${services.filter((s) => s.category === c.id && !s.hidden).map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</optgroup>`).join('')}<option value="health-analysis">Health Analysis</option><option value="unsure">Not sure — please advise</option></select></div>
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
  const body = pageHero({ eyebrow: 'Help', title: 'FAQ &amp;<br><span class="thin">spa etiquette</span>', lede: 'Everything you need to know before, during and after your visit.', trail }) + `
<section class="section-sm" style="padding-top:0"><div class="wrap grid-2" style="align-items:start">
  <div><span class="eyebrow">Frequently asked</span><div style="margin-top:24px">${faqList(faqs)}</div></div>
  <div class="bg-ivory" style="border-radius:var(--radius-lg);padding:clamp(24px,3vw,44px);position:sticky;top:120px"><span class="eyebrow">Spa etiquette</span><ol class="ha-list" style="border-color:var(--line)">${etiquette.map((e, i) => `<li style="color:var(--ink-soft);border-color:var(--line)"><span>${String(i + 1).padStart(2, '0')}</span>${esc(e)}</li>`).join('')}</ol></div>
</div></section>` + ctaBand();
  return { path: '/faq-spa-etiquette/', html: layout({ title: 'FAQ & Spa Etiquette | Elements Wellness', description: 'Answers to common questions about booking, arriving, treatments and spa etiquette at Elements Wellness Singapore.', path: '/faq-spa-etiquette/', bodyClass: 'page-light', schema: [bc(trail), faqSchema(faqs)], body }) };
}

export function storyPage() {
  const trail = [['Home', '/'], ['Our Story']];
  const body = pageHero({ eyebrow: 'Our story · How we began', title: 'A million massages<br><span class="thin">and counting</span>', lede: esc(story.lede), trail, img: '/assets/img/ion-interior.jpg' }) + `
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
  return { path: '/our-story/', html: layout({ title: 'Our Story | Elements Wellness Singapore', description: story.lede, path: '/our-story/', bodyClass: 'page-light', schema: [bc(trail)], body }) };
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

export function wcProductPage(p) {
  const trail = [['Home', '/'], ['Shop', '/shop/'], [p.name]];
  const body = `
<section class="page-hero"><div class="wrap">
  ${crumbs(trail)}
  <div class="grid-2">
    <div class="svc-hero-media" data-clip style="aspect-ratio:1"><img src="${p.img}" alt="${esc(p.imgAlt || p.name)}"></div>
    <div>
      <span class="eyebrow" data-reveal="drop">Shop</span>
      <h1 data-split style="margin-top:18px;font-size:clamp(30px,4vw,56px)">${esc(p.name)}</h1>
      <div class="h2" style="color:var(--maroon);margin:20px 0;font-size:36px" data-reveal>${esc(p.price)}</div>
      <div class="cf-prose prose" data-reveal>${p.descHtml}</div>
      <div class="hero-actions" style="justify-content:flex-start;margin-top:24px" data-reveal>${btn('/book-appointment/', 'Buy & book')}${btn(site.whatsapp, 'WhatsApp us', 'btn-ghost', 'target="_blank" rel="noopener"')}</div>
      <p class="form-note" style="margin-top:14px">Online checkout connects in the backend phase; the price and inclusions are as listed on the current shop.</p>
    </div>
  </div>
</div></section>` + ctaBand();
  return { path: p.url, html: layout({ title: `${p.name} | Elements Wellness Shop`, description: p.desc.slice(0, 160), path: p.url, bodyClass: 'page-light', schema: [bc(trail), { '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.desc, image: site.url + p.img, offers: { '@type': 'Offer', price: p.price.replace('S$', ''), priceCurrency: 'SGD' } }], body }) };
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
