import { site, groups, services, concerns, outlets, awards, pressLogos, faqs, google, googleFor, sgOutline, concernPagesAll } from '../data.mjs';
import { layout, esc, icon, btn, linkArrow, ring, faqList, logo, googleCard, starRow, fmtNum, gLogo, revealCard } from '../ui.mjs';

export default function home() {
  const marqueeAwards = [...pressLogos, ...pressLogos].map((a) => a.url ? `<a href="${a.url}" title="${esc(a.title)}"><img class="award-logo" src="${a.img}" alt="${esc(a.title)}" loading="lazy"></a>` : `<img class="award-logo" src="${a.img}" alt="${esc(a.title)}" loading="lazy">`).join('');

  // Hero: full-bleed slides with a few words each, like a resort site — centred title, one line, one outlined button
  const slides = [
    { img: '/assets/img/hero-reception.jpg', alt: 'Elements Wellness reception at night', title: 'Where wellness meets results', sub: 'Therapeutic massage, results-driven facials and private onsen rituals — three sanctuaries on Orchard Road.', cta: 'Book now', href: '/book-appointment/' },
    { img: '/assets/img/jacuzzi.jpg', alt: 'Private couple jacuzzi suite with rose petals', title: 'Koyamaki Onsen', sub: 'Singapore’s first private onsen suites — soak, scrub and massage. For one, or for two.', cta: 'Discover the onsen', href: '/koyamaki-onsen-ritual/' },
    { img: '/assets/img/main-massage.jpg', alt: 'Therapeutic massage at Elements Wellness', title: 'Massage & Recovery', sub: 'TCM techniques, skilled hands and recovery technology for bodies that work hard.', cta: 'Explore massage', href: '/massage-and-recovery/' },
    { img: '/assets/img/facial-mask.jpg', alt: 'Facial treatment at Elements Wellness', title: 'Facials', sub: 'Results-driven facials for glow, firmness and clarity you can see.', cta: 'Explore facials', href: '/facials/' },
  ];
  const hero = `
<section class="hero" aria-label="Welcome" data-slides>
  <div class="hero-media">${slides.map((sl, i) => `<img src="${sl.img}" alt="${esc(sl.alt)}" class="${i === 0 ? 'is-on' : ''}" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} data-slide-img>`).join('')}</div>
  <canvas class="steam" aria-hidden="true"></canvas>
  <div class="steam-veil" aria-hidden="true"></div>
  <div class="hero-content">
    <div class="wrap hero-center">
      <span class="hero-kicker" data-hero-in>Elements Wellness · Singapore</span>
      <h1 class="hero-title"><span class="line"><span data-slide-title>${esc(slides[0].title)}</span></span></h1>
      <p class="hero-sub" data-hero-in data-slide-sub>${esc(slides[0].sub)}</p>
      <div class="hero-actions" data-hero-in><a class="btn btn-light" href="${slides[0].href}" data-slide-cta><span>${esc(slides[0].cta)}</span></a></div>
    </div>
  </div>
  <div class="hero-dots" role="tablist" aria-label="Slides">${slides.map((sl, i) => `<button type="button" role="tab" aria-selected="${i === 0}" aria-label="${esc(sl.title)}" class="${i === 0 ? 'is-on' : ''}" data-slide-to="${i}"><i></i></button>`).join('')}</div>
  <div class="hero-nav"><button type="button" data-slide-prev aria-label="Previous slide"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M10 2 4 8l6 6"/></svg></button><button type="button" data-slide-next aria-label="Next slide"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="m6 2 6 6-6 6"/></svg></button></div>
  <script>window.EW_SLIDES=${JSON.stringify(slides.map(({ title, sub, cta, href }) => ({ title, sub, cta, href })))}</script>
  <div class="scroll-cue" aria-hidden="true"></div>
</section>`;

  const introStrip = `
<section class="intro-strip" aria-label="Introduction">
  <div class="wrap">
    <div class="left" data-reveal="fade"><img src="/assets/img/aquaglow.jpg" alt=""><p>Therapeutic massage, results-driven facials and restorative rituals — delivered by trained therapists across three Orchard Road outlets.</p></div>
    <div class="mid" data-reveal="fade"><div><b>1M+</b><small>massages performed</small></div><div><b>${awards.length}</b><small>awards since 2014</small></div><div><b>~100</b><small>treatment rooms</small></div></div>
    <div class="right" data-reveal="fade">${btn('/promotions/', 'First-visit offers', 'btn-sm')}${btn('/elements-restore/', 'Elements Restore', 'btn-ghost btn-sm')}</div>
  </div>
</section>`;

  // Logo wall: a fixed grid where one logo at a time swaps for another from the pool (no scrolling marquee)
  const wallLogos = pressLogos.map((a) => ({ img: a.img, title: a.title, url: a.url || '' }));
  const awardsStrip = `
<section class="awards-strip" aria-label="Awards and press">
  <div class="wrap">
    <div class="label"><span class="caps">Award-winning · As featured in</span><a class="link-arrow award-all" href="/awards/">Awards &amp; Recognition ${icon.arrow}</a></div>
    <div class="logo-wall" data-logo-wall>${wallLogos.slice(0, 8).map((a, i) => `<div class="logo-cell" data-i="${i}">${a.url ? `<a href="${a.url}" title="${esc(a.title)}">` : ''}<img class="award-logo" src="${a.img}" alt="${esc(a.title)}" loading="lazy">${a.url ? '</a>' : ''}</div>`).join('')}</div>
    <script>window.EW_LOGOS=${JSON.stringify(wallLogos)}</script>
  </div>
</section>`;

  const approach = `
<section class="section" id="approach">
  <div class="wrap">
    <div class="head-center">
      <span class="eyebrow" data-reveal="drop">The Elements approach</span>
      <h2 data-split>Wellness, <span class="thin">engineered.</span></h2>
      <div class="fan" data-reveal="fade" data-fan>
        <img src="/assets/img/five-elements-massage.jpg" alt="" loading="lazy"><img src="/assets/img/lymphatic-sculpt.jpg" alt="" loading="lazy"><img src="/assets/img/couple-onsen-2.jpg" alt="" loading="lazy">
      </div>
      <p class="tone" data-reveal><span class="t1">We believe feeling good and real results should go hand in hand.</span> <span class="t2">No guesswork, no hard sell.</span> <span class="t3">From a Health Analysis to your Restore Plan, every treatment at Elements is chosen for your body — blending Traditional Chinese Medicine, professional-grade products and advanced technology.</span> <span class="t1">Delivered by skilled hands, so you feel more like yourself again.</span></p>
    </div>
  </div>
</section>`;

  const treatments = `
<section class="section-sm bg-ivory" id="treatments">
  <div class="wrap">
    <div class="head-center"><span class="eyebrow" data-reveal="drop">Our treatments</span><h2 data-split>Four paths <span class="thin">to feeling well</span></h2><p class="lede" data-reveal>Each category is guided by an element. Pick yours, or let the finder match a treatment to how you feel.</p></div>
    <div class="tcards">
      ${groups.map((c) => `<a class="t-card" href="${c.url}" data-reveal><div class="media"><img src="${c.img}" alt="${esc(c.label)} at Elements Wellness" loading="lazy"></div><div class="body"><h3>${esc(c.label)}</h3><span class="link-arrow">Explore ${icon.arrow}</span></div></a>`).join('')}
    </div>
    
  </div>
</section>`;

  const concernList = `
<section class="section" id="concerns">
  <div class="wrap">
    <div class="head-row">
      <div><span class="eyebrow" data-reveal="drop">Start with how you feel</span><h2 data-split style="margin-top:16px">What is your body <span class="thin">asking for?</span></h2></div>
      <p class="lede" data-reveal>Tell us the concern — the finder maps it to the treatments Elements recommends, at the outlet nearest you.</p>
    </div>
    <div class="concerns-wrap" data-concerns>
      <div class="concerns">${concerns.slice(0, 7).map((c, i) => `<a class="concern" href="/facials/" data-reveal><span class="n">0${i + 1}</span><span class="t">${esc(c.label)}</span><span class="d">${esc(c.blurb)}</span></a>`).join('')}</div>
    </div>
  </div>
  <div class="hover-img" aria-hidden="true">${concerns.slice(0, 7).map((c) => `<img src="${c.img}" alt="" loading="lazy">`).join('')}</div>
</section>`;

  const onsen = `
<section class="section-sm" aria-label="Koyamaki Onsen Spa">
  <div class="feature" data-clip>
    <img src="/assets/img/jacuzzi.jpg" alt="Private couple jacuzzi suite with rose petals" loading="lazy">
    <div class="feature-copy"><span class="eyebrow">Best Couple Wellness Ritual · Beauty Insider 2026</span><div class="h1">Step into <span class="thin">the steam.</span></div><p>A private Koyamaki onsen suite at The Centrepoint — 40-min onsen, 60-min Ocha body massage and back scrub. For one, or for two.</p>${btn('/koyamaki-onsen-ritual/', 'Discover the onsen', 'btn-light')}</div>
  </div>
</section>`;

  const steps = `
<section class="section" data-steps>
  <div class="wrap steps">
    <div>
      <div class="step-intro"><span class="eyebrow" data-reveal="drop">Your Elements journey</span><h2 data-split style="margin-top:16px">Results you <span class="thin">can track.</span></h2><p class="lede" data-reveal style="margin-top:20px">We don't guess. Every programme begins with understanding your body — and ends with progress you can see.</p></div>
      ${[
        ['Analyse', 'Begin with a Health Analysis. Our machine scan is turned into a clear Elements report that your therapist walks you through on iPad.', '/assets/img/acuwave.jpg'],
        ['Personalise', 'Your therapist pairs the right treatments — hands-on TCM techniques, INDIBA®, red light or contrast therapy — to your goals, not a menu.', '/assets/img/five-elements-massage.jpg'],
        ['Restore & repeat', 'Progress is saved to your record so every visit builds on the last — real results, session after session.', '/assets/img/couple-onsen-2.jpg'],
      ].map(([t, p, img], i) => `<div class="step"><div class="step-img-mobile"><img src="${img}" alt="" loading="lazy"></div><span class="num" data-reveal="fade">0${i + 1}</span><h3 data-reveal>${t}</h3><p data-reveal>${p}</p>${i === 0 ? `<div data-reveal>${linkArrow('/elements-restore/', 'About Elements Restore')}</div>` : ''}</div>`).join('')}
    </div>
    <div><div class="steps-media" data-reveal="fade"><img class="on" src="/assets/img/acuwave.jpg" alt="" loading="lazy"><img src="/assets/img/five-elements-massage.jpg" alt="" loading="lazy"><img src="/assets/img/couple-onsen-2.jpg" alt="" loading="lazy"><span class="count">01 / 03</span></div></div>
  </div>
</section>`;

  // Four cards straight after the hero, like the old site: each lists the treatments guests return for
  const sig = { facials: ['3c-vit-glow', 'nano-fibroblast', 'meridian-bojin-facial', 'nir-cellbright', 'lymphatic-sculpt'], massage: ['tuina', 'sports', 'lymphatic', 'indiba-pro-recovery', 'fascia-release'], spa: ['onsen', 'contrast', 'herbal-bath', 'couples-massage'] };
  const pick = (g) => { const ids = sig[g.id] || []; const chosen = ids.map((id) => services.find((s) => s.id === id)).filter(Boolean); const rest = g.id === 'contouring' ? [] : services.filter((s) => s.group === g.id && !chosen.includes(s)); return [...chosen, ...rest].slice(0, 5); };
  const price = (t) => (t.price ? (t.priceNote === 'First trial' ? 'Trial ' : t.priceNote === 'Per couple' ? '' : 'From ') + t.price : '');
  const sigCopy = { facials: 'Results-driven facials for glow, firmness and clarity.', massage: 'Therapeutic massage, TCM therapies and recovery technology.', spa: 'Private onsen, contrast and herbal rituals — for one or two.' };
  const glyph = { facials: '水', massage: '火', spa: '木', contouring: '土' };
  const contour = concernPagesAll.find((c) => c.url === '/body-contouring/');
  const cards = [...['massage', 'facials', 'spa'].map((id) => groups.find((g) => g.id === id)), { id: 'contouring', label: 'Slimming & Contouring', url: '/body-contouring/', img: contour?.img || '/assets/img/cat-slimming.jpg', blurb: 'TCM and technology to contour, firm and de-bloat — the slimming menu, renamed.' }];
  sig.contouring = ['tcm-slimming', 'indiba-slimming', 'deepba-slim', 'catabolic-tummy', 'tcm-bust'];
  const keyTreatments = `
<section class="section-sm paths-sec" id="treatments">
  <div class="wrap">
    <div class="head-row" style="align-items:end">
      <div><span class="eyebrow" data-reveal="drop">Our treatments</span><h2 data-split style="margin-top:16px">Find your <span class="thin">first treatment.</span></h2></div>
      <div><p class="lede" data-reveal style="max-width:480px">Massage, facials, spa and slimming — with the treatments our guests return for. Tap any treatment to read more, or open the full menu.</p><div data-reveal style="margin-top:14px"><button class="link-arrow" type="button" data-finder>Browse all treatments ${icon.arrow}</button></div></div>
    </div>
    <div class="paths" data-rise>
      ${cards.map((c) => `<article class="path-card" data-rise-item>
        <a class="path-media" href="${c.url}" aria-label="${esc(c.label)}"><img src="${c.img}" alt="" loading="lazy"><span class="path-glyph" aria-hidden="true">${glyph[c.id] || ''}</span></a>
        <div class="path-body">
          <h3><a href="${c.url}">${esc(c.label)}</a></h3>
          <p>${esc(sigCopy[c.id] || c.blurb || '')}</p>
          <ul class="path-list">${pick(c).map((t) => `<li><a href="${t.url}"><span>${esc(t.name)}</span>${price(t) ? `<small>${esc(price(t))}</small>` : ''}</a></li>`).join('')}</ul>
          <a class="link-arrow" href="${c.url}">View all ${esc(c.label.toLowerCase())} ${icon.arrow}</a>
        </div>
      </article>`).join('')}
    </div>
  </div>
</section>`;

  const all = google.places.flatMap((p) => p.reviews.map((r) => ({ ...r, outlet: p.name })));
  const colA = all.filter((_, i) => i % 2 === 0), colB = all.filter((_, i) => i % 2 === 1);
  const testimonials = `
<section class="section bg-sand" id="reviews" data-google-reviews>
  <div class="wrap grid-2 rv-layout">
    <div class="rv-words">
      <h2 data-split>Loved, then <span class="thin">loved again.</span></h2>
      <div class="g-flex" data-reveal>
        <div class="g-flex-num"><span data-rv-avg>${google.average.toFixed(1)}</span><small>/ 5</small></div>
        <div><div class="g-flex-stars">${starRow(google.average)}</div><p>From <b data-rv-total>${fmtNum(google.total)}</b> Google reviews across our three outlets</p></div>
      </div>
      <div class="g-outlets" data-reveal>
        ${google.places.map((p) => `<a class="g-outlet" href="${p.mapsUrl}" target="_blank" rel="noopener" data-rv-place="${p.id}"><span class="g-outlet-name">${gLogo}${esc(p.name)}</span><span class="g-outlet-score"><b data-rv-rating>${p.rating.toFixed(1)}</b> ${starRow(p.rating)} <small>(<span data-rv-count>${fmtNum(p.count)}</span>)</small></span></a>`).join('')}
      </div>
      <div class="hero-actions" data-reveal style="margin-top:22px">${btn(google.places[0].mapsUrl, 'Write a review on Google', '', 'target="_blank" rel="noopener" data-rv-write')}${btn('/book-appointment/', 'Book a treatment', 'btn-ghost')}</div>
      <p class="g-note" data-rv-updated>Google ratings as of ${new Date(google.snapshotDate).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
    </div>
    <div class="rv-cols" data-reveal="fade" aria-label="Google reviews">
      <div class="rv-col up"><div>${[...colA, ...colA].map((r) => googleCard(r, r.outlet)).join('')}</div></div>
      <div class="rv-col down"><div>${[...colB, ...colB].map((r) => googleCard(r, r.outlet)).join('')}</div></div>
    </div>
  </div>
</section>`;

  const standard = `
<section class="section" id="standard">
  <div class="wrap promises">
    <div class="lead"><span class="eyebrow" data-reveal="drop">Why Elements</span><h2 data-split>The Elements <span class="thin">standard.</span></h2><p class="lede" data-reveal>Premium is earned through results and skill — never through inflated promises.</p><div data-reveal style="margin-top:20px">${linkArrow('/about-elements/', 'About Elements')}</div></div>
    ${[['award', 'Award-winning care', `${awards.length} awards from Singapore's leading beauty titles since 2014.`], ['hands', 'Skilled hands, not just products', 'Trained therapists, 100% hands-on techniques and one standard across three outlets.'], ['leaf', 'Honest science', 'TCM wisdom paired with INDIBA®, red light and contrast therapy — explained plainly.']].map(([i, t, p]) => `<div class="promise" data-reveal><div class="ico">${icon[i]}</div><h3>${t}</h3><p>${p}</p></div>`).join('')}
  </div>
</section>`;

  const ha = `
<section class="section bg-ivory" id="elements-restore">
  <div class="wrap grid-2">
    <div>
      <span class="eyebrow" data-reveal="drop">New · Elements Restore</span>
      <h2 data-split style="margin-top:16px">Know your body <span class="thin">before we touch it.</span></h2>
      <p class="lede" data-reveal style="margin-top:20px">Two quick in-spa readings — stress and vascular — become a simple Elements Restore Profile: your Stress Load, Recovery Capacity and Circulation, the Restore Priority to focus on, and a fixed Restore Program with plan duration and frequency. Explained by your therapist on iPad and saved to your record.</p>
      <ol class="ha-list" data-reveal><li><span>01</span>Complete the in-spa analysis</li><li><span>02</span>Your readings become a clear three-domain Restore Profile</li><li><span>03</span>Receive your Restore Plan — program, duration and frequency</li></ol>
      <div class="hero-actions" data-reveal>${btn('/elements-restore/', 'Discover Elements Restore')}${btn('/book-appointment/?treatment=elements-restore', 'Book an assessment', 'btn-ghost')}</div>
    </div>
    <div class="rp-sample" data-reveal="fade" aria-label="Sample Restore Profile">
      <div class="rp-top"><span>Elements Restore</span><small>Sample profile</small></div>
      <h3>Your Restore Profile</h3>
      <div class="rp-dom warn"><div><small>Stress Load</small><b>Elevated</b><span>Stress Index: 47</span></div><div class="rp-ideal"><small>Ideal range</small>Stress Index &lt;25</div></div>
      <div class="rp-dom good"><div><small>Recovery Capacity</small><b>Favourable</b><span>Pulse Complexity: 30.11</span></div><div class="rp-ideal"><small>Ideal range</small>Pulse Complexity 30+</div></div>
      <div class="rp-dom good"><div><small>Circulation</small><b>Favourable</b><span>Vascular Age Type B · Index −13</span></div><div class="rp-ideal"><small>Ideal range</small>Type A–B · Index −30 to +5</div></div>
      <div class="rp-plan"><div><small>Restore Priority</small><b>Stress</b></div><div><small>Plan</small><b>3 months · 1–2 sessions/week</b></div></div>
    </div>
  </div>
</section>`;

  const commerce = `
<section class="section-sm">
  <div class="wrap cards-2">
    ${revealCard({ href: '/gift-vouchers/', kind: 'Gift vouchers', title: 'Give someone an hour of calm.', short: 'Emailed today or on the day you choose — redeemable at all three outlets.', more: 'Choose a spa credit or a treatment, pick a card, add a message. The recipient gets a voucher with a unique code; you get a receipt. Valid 12 months.', img: '/assets/img/jacuzzi-close.jpg', cta: 'Send a voucher', cls: 'rcard-wide' })}
    ${revealCard({ href: '/products/', kind: 'Products', title: 'Results that go home with you.', short: 'The skincare and supplements we use and recommend.', more: 'Browse by category or by brand — each brand page explains why Elements carries it and which products suit which concerns.', img: '/assets/img/herbal-flatlay.jpg', cta: 'Browse products', cls: 'rcard-wide' })}
  </div>
</section>`;

  // Red map of Singapore: the three outlets sit together on Orchard Road, so a lens zooms into that stretch
  const lensPins = { ion: [62, 92], '313': [150, 118], centrepoint: [232, 100] };
  const mapLocs = `
<section class="section bg-deep map-sec" id="locations" data-map>
  <div class="wrap">
    <div class="head-row"><div><span class="eyebrow" data-reveal="drop">Visit us</span><h2 data-split style="margin-top:16px">Three sanctuaries <span class="thin">on Orchard Road.</span></h2></div><div><p class="lede" data-reveal>${esc(site.hoursSummary)}</p><div data-reveal style="margin-top:14px">${linkArrow('/locations/', 'All locations')}</div></div></div>
    <div class="map-layout">
      <div class="map-stage" data-reveal="fade">
        <svg class="sg-map" viewBox="0 0 1000 446" aria-hidden="true" focusable="false">
          <defs><pattern id="sg-dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="rgba(255,255,255,.14)"/></pattern><radialGradient id="sg-glow"><stop offset="0" stop-color="#ffd3d3" stop-opacity=".9"/><stop offset="1" stop-color="#ffd3d3" stop-opacity="0"/></radialGradient></defs>
          <path class="sg-land" d="${sgOutline}"/>
          <path class="sg-land-dots" d="${sgOutline}" fill="url(#sg-dots)"/>
          <g class="sg-orchard"><circle class="sg-pulse" cx="340" cy="238" r="22"/><circle class="sg-pulse d2" cx="340" cy="238" r="22"/><circle cx="340" cy="238" r="40" fill="url(#sg-glow)" opacity=".5"/><circle class="sg-dot" cx="340" cy="238" r="6"/><text class="sg-label" x="362" y="231">Orchard Road</text><text class="sg-sub" x="362" y="250">3 outlets · 2 MRT stops</text></g>
          <line class="sg-link" x1="340" y1="238" x2="690" y2="200"/>
        </svg>
        <div class="map-lens" aria-hidden="true">
          <svg viewBox="0 0 300 200">
            <path class="lens-road" d="M-10 70 C 60 60, 110 95, 160 112 S 260 118, 320 98"/>
            <g class="lens-mrt"><circle cx="48" cy="66" r="5"/><text x="48" y="52">Orchard MRT</text><circle cx="210" cy="116" r="5"/><text x="210" y="138">Somerset MRT</text></g>
            ${outlets.map((o) => { const [x, y] = lensPins[o.id]; return `<g class="lens-pin" data-map-pin="${o.id}" transform="translate(${x} ${y})"><circle class="lens-ring" r="14"/><circle class="lens-dot" r="6"/><text y="${o.id === '313' ? 30 : -22}">${esc(o.short)}</text></g>`; }).join('')}
          </svg>
          <span class="lens-cap">Orchard Road, zoomed in</span>
        </div>
      </div>
      <div class="map-side" data-reveal>
        ${outlets.map((o, i) => { const g = googleFor(o.id) || { rating: 0, count: 0 }; const tel = o.phone.replace(/\s/g, ''), wa = o.whatsapp.replace(/\s/g, ''); return `<article class="map-item ${i === 0 ? 'is-on' : ''}" data-map-item="${o.id}" data-url="${o.url}">
          <button type="button" class="map-item-head" aria-expanded="${i === 0}">
            <span class="map-no">0${i + 1}</span>
            <span class="map-item-text"><b>${esc(o.name)}</b><small>${esc(o.feature)}</small></span>
            <span class="map-item-score" data-rv-place="${o.id}"><b data-rv-rating>${g.rating.toFixed(1)}</b> ${starRow(g.rating)} <small><span data-rv-count>${fmtNum(g.count)}</span> reviews</small></span>
            <span class="map-item-arrow" aria-hidden="true">${icon.arrow}</span>
          </button>
          <div class="map-item-body">
            <div class="map-item-grid">
              <div><small>Address</small><p>${o.address}</p></div>
              <div><small>Getting here</small><p>${esc(o.directions || '')}</p></div>
              <div><small>Hours</small><p>${esc(site.hoursSummary)}</p></div>
              <div><small>Contact</small><p><a href="tel:+65${tel}">${esc(o.phone)}</a> · <a href="https://wa.me/65${wa}" target="_blank" rel="noopener">WhatsApp</a></p></div>
            </div>
            <div class="map-item-actions">${btn(o.url, 'Open ' + o.short + ' page', 'btn-light btn-sm')}${btn('https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent('Elements Wellness ' + o.mapQuery), 'Directions', 'btn-ghost-light btn-sm', 'target="_blank" rel="noopener"')}</div>
          </div>
        </article>`; }).join('')}
        <p class="map-hint">Tap an outlet to see where it is and how to get there · tap again to open its page</p>
      </div>
    </div>
  </div>
</section>`;

  const faq = `
<section class="section bg-sand">
  <div class="wrap grid-2" style="align-items:start">
    <div style="position:sticky;top:120px"><span class="eyebrow" data-reveal="drop">Your first visit</span><h2 data-split style="margin-top:16px">New to <span class="thin">Elements?</span></h2><p class="lede" data-reveal style="margin:20px 0 28px">What to expect, how to prepare and our first-visit offers.</p><div class="hero-actions" data-reveal style="justify-content:flex-start">${btn('/faq-spa-etiquette/', 'FAQ & Spa Etiquette')}${btn('/promotions/', 'First-visit offers', 'btn-ghost')}</div></div>
    <div>${faqList(faqs.slice(0, 6))}</div>
  </div>
</section>`;

  const cta = `
<section class="section cta-big">
  <div class="dots" aria-hidden="true"></div>
  <div class="wrap" style="position:relative">
    <span class="eyebrow" data-reveal="drop">Your next step</span>
    <div class="h1" data-split>Ready to feel <span class="thin">like yourself again?</span></div>
    <p class="lede" data-reveal>Book a treatment, or start with Elements Restore and let your consultant recommend the right path.</p>
    <div class="hero-actions" data-reveal>${btn('/book-appointment/', 'Book Now')}${btn(site.whatsapp, 'WhatsApp us', 'btn-ghost', 'target="_blank" rel="noopener"')}</div>
  </div>
  <div class="ghost" aria-hidden="true">Elements</div>
</section>`;

  const schema = [{
    '@context': 'https://schema.org', '@type': 'DaySpa', name: 'Elements Wellness', url: site.url, image: site.url + '/assets/img/onsen-1.jpg', email: site.email,
    department: outlets.map((o) => ({ '@type': 'DaySpa', name: 'Elements Wellness ' + o.name, telephone: '+65' + o.phone.replace(/\s/g, ''), address: { '@type': 'PostalAddress', streetAddress: o.street, postalCode: o.postal, addressCountry: 'SG', addressLocality: 'Singapore' } })),
    sameAs: site.socials.map((s) => s.url),
  }];

  return layout({
    title: 'Elements Wellness — Award-winning Spa & Wellness in Singapore',
    description: 'Award-winning spa on Orchard Road: TCM massage, results-driven facials, INDIBA® slimming, recovery therapy and Singapore’s first private Koyamaki onsen. ION Orchard, 313@somerset, The Centrepoint.',
    path: '/', bodyClass: 'page-home', schema,
    body: hero + keyTreatments + awardsStrip + testimonials + mapLocs + ha + commerce + standard + faq + cta,
  });
}
