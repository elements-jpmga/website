import { site, categories, services, concerns, outlets, awards, pressLogos, posts, faqs, reviews, google } from '../data.mjs';
import { layout, esc, icon, btn, linkArrow, ring, faqList, logo, googleCard, starRow, fmtNum, gLogo } from '../ui.mjs';

export default function home() {
  const marqueeAwards = [...pressLogos, ...pressLogos].map((a) => a.url ? `<a href="${a.url}" title="${esc(a.title)}"><img class="award-logo" src="${a.img}" alt="${esc(a.title)}" loading="lazy"></a>` : `<img class="award-logo" src="${a.img}" alt="${esc(a.title)}" loading="lazy">`).join('');

  const hero = `
<section class="hero" aria-label="Welcome">
  <div class="hero-media"><img src="/assets/img/onsen-1.jpg" alt="Private Koyamaki onsen suite at Elements Wellness, The Centrepoint" fetchpriority="high"></div>
  <canvas class="steam" aria-hidden="true"></canvas>
  <div class="steam-veil" aria-hidden="true"></div>
  <div class="hero-meta" data-hero-in><span>Award-winning therapeutic spa · Singapore</span><span>${awards.length} awards · ION Orchard · 313@somerset · The Centrepoint</span></div>
  <div class="hero-content">
    <div class="wrap">
      <h1 class="hero-title"><span class="line"><span>Where wellness</span></span><span class="line"><span>meets real results.</span></span></h1>
      <div class="hero-bottom">
        <p class="hero-sub" data-hero-in>Where feeling good and real results go hand in hand — TCM wisdom, modern technology and the magic of touch.</p>
        <div style="display:grid;gap:12px;justify-items:end" data-hero-in>
          <button class="hero-finder" type="button" data-finder aria-label="Open the treatment finder">${icon.search}<span class="hf-text">I want relief for <span class="hf-rotator" data-words="${concerns.map((c) => c.phrase).join('|')}">${esc(concerns[0].phrase)}</span></span><span class="btn btn-sm btn-light" aria-hidden="true"><span>Find</span></span></button>
          <div class="hero-actions">${btn('/book-appointment/', 'Book appointment')}${btn('/services/', 'Explore treatments', 'btn-ghost-light')}</div>
        </div>
      </div>
    </div>
  </div>
  <div class="scroll-cue" aria-hidden="true"></div>
</section>`;

  const introStrip = `
<section class="intro-strip" aria-label="Introduction">
  <div class="wrap">
    <div class="left" data-reveal="fade"><img src="/assets/img/aquaglow.jpg" alt=""><p>Therapeutic massage, results-driven facials and restorative rituals — delivered by trained therapists across three Orchard Road outlets.</p></div>
    <div class="mid" data-reveal="fade"><div><b>1M+</b><small>massages performed</small></div><div><b>${awards.length}</b><small>awards since 2014</small></div><div><b>~100</b><small>treatment rooms</small></div></div>
    <div class="right" data-reveal="fade">${btn('/promotions/', 'First-visit offers', 'btn-sm')}${btn('/health-analysis/', 'Health Analysis', 'btn-ghost btn-sm')}</div>
  </div>
</section>`;

  const awardsStrip = `
<section class="awards-strip" aria-label="Awards and press">
  <div class="label"><span class="caps">Award-winning · As featured in</span></div>
  <div class="marquee" style="--gap:72px;--dur:45s"><div class="marquee-track">${marqueeAwards}</div></div>
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
      ${categories.filter((c) => c.id !== 'spa-ritual').map((c) => `<a class="t-card" href="${c.url}" data-reveal><div class="media"><img src="${c.img}" alt="${esc(c.label)} at Elements Wellness" loading="lazy"></div><div class="body"><h3>${esc(c.label)}</h3><ul>${services.filter((s) => s.category === c.id && s.signature).slice(0, 3).map((s) => `<li>${esc(s.name)}</li>`).join('')}</ul><span class="link-arrow">Explore ${esc(c.label.toLowerCase())} ${icon.arrow}</span></div></a>`).join('')}
    </div>
    <div class="center" style="margin-top:32px" data-reveal>${btn('/services/', 'View full menu & pricing')}</div>
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
      <div class="concerns">${concerns.slice(0, 7).map((c, i) => `<a class="concern" href="/services/?concern=${c.id}" data-finder="concern:${c.id}" data-reveal><span class="n">0${i + 1}</span><span class="t">${esc(c.label)}</span><span class="d">${esc(c.blurb)}</span></a>`).join('')}</div>
    </div>
  </div>
  <div class="hover-img" aria-hidden="true">${concerns.slice(0, 7).map((c) => `<img src="${c.img}" alt="" loading="lazy">`).join('')}</div>
</section>`;

  const onsen = `
<section class="section-sm" aria-label="Koyamaki Onsen Spa">
  <div class="feature" data-clip>
    <img src="/assets/img/jacuzzi.jpg" alt="Private couple jacuzzi suite with rose petals" loading="lazy">
    <div class="feature-copy"><span class="eyebrow">Best Couple Wellness Ritual · Beauty Insider 2026</span><div class="h1">Step into <span class="thin">the steam.</span></div><p>A private Koyamaki onsen suite at The Centrepoint — 40-min onsen, 60-min Ocha body massage and back scrub. For one, or for two.</p>${btn('/spa-ritual/onsen-spa/', 'Discover the onsen', 'btn-light')}</div>
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
      ].map(([t, p, img], i) => `<div class="step"><div class="step-img-mobile"><img src="${img}" alt="" loading="lazy"></div><span class="num" data-reveal="fade">0${i + 1}</span><h3 data-reveal>${t}</h3><p data-reveal>${p}</p>${i === 0 ? `<div data-reveal>${linkArrow('/health-analysis/', 'About Health Analysis')}</div>` : ''}</div>`).join('')}
    </div>
    <div><div class="steps-media" data-reveal="fade"><img class="on" src="/assets/img/acuwave.jpg" alt="" loading="lazy"><img src="/assets/img/five-elements-massage.jpg" alt="" loading="lazy"><img src="/assets/img/couple-onsen-2.jpg" alt="" loading="lazy"><span class="count">01 / 03</span></div></div>
  </div>
</section>`;

  const cats = categories.filter((c) => c.id !== 'spa-ritual');
  // The three signature treatments per category, as listed on the current elements.com.sg homepage
  const oldSig = { massage: ['tuina', 'sports', 'lymphatic'], facial: ['3c-vit-glow', 'nano-fibroblast', 'meridian-bojin-facial'], wellness: ['medi-stretch', 'contrast', 'acuwave'], slimming: ['tcm-tummy-trim', 'indiba-slimming'] };
  const pick = (c) => (oldSig[c.id] || []).map((id) => services.find((s) => s.id === id)).filter(Boolean);
  const meta = (t) => [t.duration, t.price ? (t.priceNote === 'First trial' ? 'First trial ' : 'From ') + t.price : ''].filter(Boolean).join(' · ');
  const sigCopy = { massage: 'Tuina, sports and lymphatic techniques for real relief.', facial: 'Results-driven facials for glow, firmness and clarity.', wellness: 'Recovery therapies — stretch, contrast and Acu-Wave.', slimming: 'TCM and INDIBA® to contour and de-bloat.' };
  const keyTreatments = `
<section class="section" id="treatments">
  <div class="wrap">
    <div class="head-row" style="align-items:end">
      <div><h2 data-split>Signature <span class="thin">treatments.</span></h2><p class="lede" data-reveal style="margin-top:14px;max-width:520px">Hover a category to see the treatments our guests return for — then tap to explore.</p></div>
      <div class="sig-arrows" data-reveal><button type="button" data-sig-prev aria-label="Previous"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M15 8H2M7 3 2 8l5 5"/></svg></button><button type="button" data-sig-next aria-label="Next"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M1 8h13M9 3l5 5-5 5"/></svg></button></div>
    </div>
    <div class="sig-row" data-sig-row>
      ${cats.map((c) => `<article class="sig-tile" data-reveal tabindex="0">
        <img src="${c.img}" alt="${esc(c.label)} at Elements Wellness" loading="lazy">
        <div class="sig-tile-base"><h3>${esc(c.label)}</h3><p>${esc(sigCopy[c.id] || '')}</p></div>
        <div class="sig-drop" aria-label="${esc(c.label)} signature treatments">
          <div class="sig-drop-head"><h3>${esc(c.label)}</h3><a class="sig-all-link" href="${c.url}">View all ${icon.arrow}</a></div>
          <div class="sig-mini-list">${pick(c).map((t) => `<a class="sig-mini" href="${t.url}"><img src="${t.img}" alt="" loading="lazy"><span><b>${esc(t.name)}</b>${meta(t) ? `<small>${esc(meta(t))}</small>` : ''}</span>${icon.arrow}</a>`).join('')}</div>
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
    <div class="lead"><span class="eyebrow" data-reveal="drop">Why Elements</span><h2 data-split>The Elements <span class="thin">standard.</span></h2><p class="lede" data-reveal>Premium is earned through results and skill — never through inflated promises.</p></div>
    ${[['award', 'Award-winning care', `${awards.length} awards from Singapore's leading beauty titles since 2014.`], ['hands', 'Skilled hands, not just products', 'Trained therapists, 100% hands-on techniques and one standard across three outlets.'], ['leaf', 'Honest science', 'TCM wisdom paired with INDIBA®, red light and contrast therapy — explained plainly.']].map(([i, t, p]) => `<div class="promise" data-reveal><div class="ico">${icon[i]}</div><h3>${t}</h3><p>${p}</p></div>`).join('')}
  </div>
</section>`;

  const ha = `
<section class="section bg-ivory" id="health-analysis">
  <div class="wrap grid-2">
    <div>
      <span class="eyebrow" data-reveal="drop">New · Elements Restore Health Analysis</span>
      <h2 data-split style="margin-top:16px">Know your body <span class="thin">before we touch it.</span></h2>
      <p class="lede" data-reveal style="margin-top:20px">Two quick in-spa readings — stress and vascular — become a simple Elements Restore Profile: your Stress Load, Recovery Capacity and Circulation, the Restore Priority to focus on, and a fixed Restore Program with plan duration and frequency. Explained by your therapist on iPad and saved to your record.</p>
      <ol class="ha-list" data-reveal><li><span>01</span>Complete the in-spa analysis</li><li><span>02</span>Your readings become a clear three-domain Restore Profile</li><li><span>03</span>Receive your Restore Plan — program, duration and frequency</li></ol>
      <div class="hero-actions" data-reveal>${btn('/health-analysis/', 'Explore Health Analysis')}${btn('/book-appointment/?treatment=health-analysis', 'Book an analysis', 'btn-ghost')}</div>
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
    <div class="split-card bg-maroon" data-reveal><div class="copy"><span class="eyebrow">Gift vouchers</span><div class="h2" style="font-size:clamp(26px,3vw,40px)">Give someone <span class="thin">an hour of calm.</span></div><p class="muted" style="margin:0">Digital or printed, for any treatment or value, at all three outlets.</p>${btn('/gift-vouchers/', 'Send a voucher', 'btn-light')}</div><div class="media"><img src="/assets/img/jacuzzi-close.jpg" alt="" loading="lazy"></div></div>
    <div class="split-card bg-ivory" data-reveal><div class="copy"><span class="eyebrow">Supplements</span><div class="h2" style="font-size:clamp(26px,3vw,40px)">Wellness that <span class="thin">goes home with you.</span></div><p class="muted" style="margin:0">Therapist-recommended supplements to continue your results between visits.</p>${btn('/shop/', 'Shop supplements')}</div><div class="media product-media" style="border-radius:0"><div class="bottle"><div class="lbl"><div>${logo()}<em>Daily balance</em></div></div></div></div></div>
  </div>
</section>`;

  const locs = `
<section class="section bg-ivory" id="locations">
  <div class="wrap">
    <div class="head-row"><div><span class="eyebrow" data-reveal="drop">Visit us</span><h2 data-split style="margin-top:16px">Three sanctuaries <span class="thin">on Orchard Road.</span></h2></div><p class="lede" data-reveal>${esc(site.hoursSummary)}</p></div>
    ${outlets.map((o) => `<div class="loc" data-reveal><div><h3><a href="${o.url}">${esc(o.name)}</a></h3><span class="tagline">${esc(o.feature)}</span></div><div class="addr">${o.address}</div><div class="contact"><a href="tel:${o.phone.replace(/\s/g, '')}">T · ${esc(o.phone)}</a>${o.whatsapp ? `<a href="https://wa.me/65${o.whatsapp.replace(/\s/g, '')}" target="_blank" rel="noopener">WhatsApp · ${esc(o.whatsapp)}</a>` : ''}</div>${btn(o.url, 'Visit', 'btn-ghost btn-sm')}</div>`).join('')}
  </div>
</section>`;

  const journal = `
<section class="section">
  <div class="wrap">
    <div class="head-row"><div><span class="eyebrow" data-reveal="drop">The journal</span><h2 data-split style="margin-top:16px">Wellness, <span class="thin">explained.</span></h2></div>${linkArrow('/blog/', 'All articles')}</div>
    <div class="cards-3">${posts.slice(0, 3).map((p) => `<a class="card" href="${p.url}" data-reveal><div class="card-media"><img src="${p.img}" alt="" loading="lazy"></div><div class="card-body"><span class="eyebrow">${esc(p.category)}</span><h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p></div></a>`).join('')}</div>
  </div>
</section>`;

  const faq = `
<section class="section bg-sand">
  <div class="wrap grid-2" style="align-items:start">
    <div style="position:sticky;top:120px"><span class="eyebrow" data-reveal="drop">Good to know</span><h2 data-split style="margin-top:16px">Questions, <span class="thin">answered.</span></h2><p class="lede" data-reveal style="margin:20px 0 28px">Everything about booking, arriving and what to expect.</p><div data-reveal>${linkArrow('/faq-spa-etiquette/', 'FAQ & Spa Etiquette')}</div></div>
    <div>${faqList(faqs.slice(0, 6))}</div>
  </div>
</section>`;

  const cta = `
<section class="section cta-big">
  <div class="dots" aria-hidden="true"></div>
  <div class="wrap" style="position:relative">
    <span class="eyebrow" data-reveal="drop">Your next step</span>
    <div class="h1" data-split>Ready to feel <span class="thin">like yourself again?</span></div>
    <p class="lede" data-reveal>Book a treatment, or start with a Health Analysis and let your therapist recommend the right path.</p>
    <div class="hero-actions" data-reveal>${btn('/book-appointment/', 'Book appointment')}${btn(site.whatsapp, 'WhatsApp us', 'btn-ghost', 'target="_blank" rel="noopener"')}</div>
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
    body: hero + awardsStrip + keyTreatments + ha + testimonials + cta,
  });
}
