/* Elements Wellness — motion & interactions (v2: preloader, fade / drop-in reveals, steam hero, review carousel)
   Depends on GSAP, ScrollTrigger, SplitText and Lenis (vendored). */
(() => {
  const html = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (reduced) html.classList.add('reduced');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  if (typeof window.gsap === 'undefined') { html.classList.remove('js'); return; }
  gsap.registerPlugin(ScrollTrigger, SplitText);
  gsap.defaults({ ease: 'power3.out', duration: 1 });

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduced && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo = (t) => lenis ? lenis.scrollTo(t, { offset: -90, duration: 1.2 }) : t.scrollIntoView({ behavior: 'smooth' });
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => { const id = a.getAttribute('href'); if (id.length < 2) return; const t = $(id); if (t) { e.preventDefault(); scrollTo(t); } }));

  /* ---------- Preloader + page transitions ---------- */
  const loader = $('.loader'), curtain = $('.curtain');
  const isHome = document.body.classList.contains('page-home');
  const firstVisit = !sessionStorage.getItem('ew-seen');
  sessionStorage.setItem('ew-seen', '1');
  const enterPage = (onDone) => {
    if (reduced || !loader || !isHome) {
      if (loader) loader.style.display = 'none';
      if (curtain && !reduced) { gsap.set(curtain, { opacity: 1, visibility: 'visible' }); gsap.to(curtain, { opacity: 0, duration: .6, ease: 'power2.out', onComplete: () => gsap.set(curtain, { visibility: 'hidden' }) }); }
      onDone(); return;
    }
    // Home only: solid maroon screen with the wordmark, then a soft fade out
    const wm = loader.querySelector('.loader-logo');
    // the steam reveal starts underneath while the loader fades, so the spa is already emerging
    gsap.timeline({ onComplete: () => { loader.style.display = 'none'; } })
      .fromTo(wm, { opacity: 0, y: 12, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .8, ease: 'power3.out' }, 0)
      .to(wm, { opacity: 0, y: -8, duration: .35, ease: 'power2.in' }, '+=.35')
      .add(onDone, '-=.1')
      .to(loader, { opacity: 0, duration: .7, ease: 'power2.inOut' }, '-=.15');
  };
  const leavePage = (href) => {
    if (!curtain || reduced) { window.location.href = href; return; }
    gsap.set(curtain, { visibility: 'visible', opacity: 0 });
    gsap.set(curtain.querySelector('.loader-logo'), { opacity: 0, y: 8 });
    gsap.timeline({ onComplete: () => { window.location.href = href; } })
      .to(curtain, { opacity: 1, duration: .45, ease: 'power2.inOut' })
      .to(curtain.querySelector('.loader-logo'), { opacity: 1, y: 0, duration: .4 }, '-=.2');
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || a.target === '_blank' || a.hasAttribute('download') || /^(mailto|tel|javascript)/i.test(href)) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
    e.preventDefault(); leavePage(url.href);
  });
  window.addEventListener('pageshow', (e) => { if (e.persisted && curtain) gsap.set(curtain, { visibility: 'hidden', opacity: 0 }); });

  /* ---------- Header ---------- */
  const header = $('.header'), hero = $('.hero');
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-solid', hero ? y > hero.offsetHeight * 0.7 : y > 10);
    if (!document.body.classList.contains('menu-open') && !$('.has-mega.open') && !header.matches(':hover')) header.classList.toggle('is-hidden', y > 400 && y > lastY + 2);
    if (y < lastY - 2) header.classList.remove('is-hidden');
    lastY = y;
    const fab = $('.fab'); if (fab) fab.classList.toggle('show', y > window.innerHeight * 0.8);
  };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  // Mega menu: open on hover with a short close delay so moving the mouse down into the panel never drops it
  $$('.has-mega').forEach((m) => {
    let t;
    const open = () => { clearTimeout(t); m.classList.add('open'); header.classList.remove('is-hidden'); };
    const close = () => { clearTimeout(t); t = setTimeout(() => m.classList.remove('open'), 220); };
    m.addEventListener('pointerenter', open); m.addEventListener('pointerleave', close);
    m.querySelector('.nav-link').addEventListener('keydown', (e) => { if (e.key === 'Escape') m.classList.remove('open'); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') m.classList.remove('open'); });
  });
  const burger = $('.burger');
  if (burger) burger.addEventListener('click', () => {
    const open = !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open); burger.setAttribute('aria-expanded', open);
    open ? lenis?.stop() : lenis?.start();
    if (open && !reduced) gsap.fromTo('.mobile-menu nav > *', { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: .05, delay: .2, duration: .8 });
  });

  /* ---------- Steam hero ---------- */
  function steamHero() {
    if (!hero) return;
    const canvas = $('.steam', hero), veil = $('.steam-veil', hero), media = $('.hero-media', hero), img = $('.hero-media img', hero);
    const titleLines = $$('.hero-title .line > span', hero), fadeIns = $$('[data-hero-in]', hero);
    const seen = sessionStorage.getItem('ew-steam') === '1'; sessionStorage.setItem('ew-steam', '1');
    const speed = seen ? .6 : 1;
    const state = { density: 1, mx: -9999, my: -9999 };
    let ctx, W, H, parts = [], sprite, running = true;
    if (canvas && !reduced) {
      ctx = canvas.getContext('2d');
      sprite = document.createElement('canvas'); sprite.width = sprite.height = 256;
      const s = sprite.getContext('2d'); const g = s.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, 'rgba(255,248,245,0.42)'); g.addColorStop(.35, 'rgba(252,243,240,0.2)'); g.addColorStop(.7, 'rgba(248,236,233,0.05)'); g.addColorStop(1, 'rgba(248,236,233,0)');
      s.fillStyle = g; s.fillRect(0, 0, 256, 256);
      const resize = () => { const dpr = Math.min(window.devicePixelRatio || 1, 1.5); W = hero.offsetWidth; H = hero.offsetHeight; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
      resize(); window.addEventListener('resize', resize);
      const N = W < 700 ? 34 : 70;
      const spawn = (init) => ({ x: Math.random() * W, y: init ? Math.random() * H * 1.1 : H + 150 + Math.random() * 200, r: (W < 700 ? 140 : 220) + Math.random() * (W < 700 ? 200 : 380), vx: (Math.random() - .5) * .25, vy: -(.25 + Math.random() * .55), a: .5 + Math.random() * .5, rot: Math.random() * Math.PI * 2, vr: (Math.random() - .5) * .002, wob: Math.random() * 1000, ox: 0, oy: 0 });
      for (let i = 0; i < N; i++) parts.push(spawn(true));
      hero.addEventListener('pointermove', (e) => { const r = hero.getBoundingClientRect(); state.mx = e.clientX - r.left; state.my = e.clientY - r.top; });
      hero.addEventListener('pointerleave', () => { state.mx = state.my = -9999; });
      new IntersectionObserver(([en]) => { const was = running; running = en.isIntersecting; if (running && !was) requestAnimationFrame(tick); }).observe(hero);
      function tick() {
        if (!running) return;
        ctx.clearRect(0, 0, W, H); const d = state.density;
        for (const p of parts) {
          p.wob += .006; p.x += p.vx + Math.sin(p.wob) * .35; p.y += p.vy * (1 + (1 - d) * .6); p.rot += p.vr;
          const dx = p.x + p.ox - state.mx, dy = p.y + p.oy - state.my, dist = Math.hypot(dx, dy);
          if (dist < 260) { const f = (260 - dist) / 260; p.ox += (dx / (dist || 1)) * f * 6; p.oy += (dy / (dist || 1)) * f * 6; }
          p.ox *= .96; p.oy *= .96;
          if (p.y < -p.r) Object.assign(p, spawn(false));
          ctx.globalAlpha = p.a * d * Math.min(1, Math.max(0, (p.y + p.r) / (H * .9)));
          ctx.save(); ctx.translate(p.x + p.ox, p.y + p.oy); ctx.rotate(p.rot); ctx.drawImage(sprite, -p.r, -p.r, p.r * 2, p.r * 2); ctx.restore();
        }
        ctx.globalAlpha = 1; requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    if (reduced) { gsap.set(veil, { opacity: 0 }); gsap.set(img, { filter: 'blur(0px) brightness(1)', scale: 1.04 }); gsap.set([...titleLines, ...fadeIns], { yPercent: 0, y: 0, opacity: 1 }); state.density = .2; return; }
    gsap.set(titleLines, { y: 0, yPercent: 115 }); gsap.set(fadeIns, { opacity: 0, y: 18 });
    gsap.timeline()
      .to(veil, { opacity: 0, duration: 1.8 * speed, ease: 'power2.out' }, 0)
      .to(img, { filter: 'blur(0px) brightness(1)', scale: 1.04, duration: 2.6 * speed, ease: 'power3.out' }, 0)
      .to(state, { density: .13, duration: 3.4 * speed, ease: 'power2.out' }, .4 * speed)
      .to(titleLines, { yPercent: 0, duration: 1.2, stagger: .12, ease: 'expo.out' }, .8 * speed)
      .to(fadeIns, { opacity: 1, y: 0, duration: 1, stagger: .1 }, 1.1 * speed);
    gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
      .to(img, { yPercent: 10, ease: 'none' }, 0)
      .to($('.hero-content', hero), { yPercent: -12, opacity: 0, ease: 'none' }, 0)
      .to(state, { density: .05, ease: 'none' }, 0);
  }

  /* ---------- Hero finder rotator ---------- */
  const rot = $('.hf-rotator');
  if (rot && !reduced) { const words = (rot.dataset.words || '').split('|').filter(Boolean); let i = 0; setInterval(() => { i = (i + 1) % words.length; gsap.timeline().to(rot, { y: -8, opacity: 0, duration: .35, ease: 'power2.in' }).add(() => { rot.textContent = words[i]; }).fromTo(rot, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: .5 }); }, 2600); }

  /* ---------- Reveals: fade / drop / rise ---------- */
  function reveals() {
    if (reduced) { $$('[data-split]').forEach((el) => el.style.visibility = 'visible'); return; }
    $$('[data-split]').forEach((el) => {
      SplitText.create(el, { type: 'lines', mask: 'lines', autoSplit: true, onSplit(self) { gsap.set(el, { visibility: 'visible' }); return gsap.from(self.lines, { yPercent: 100, opacity: 0, duration: 1.1, stagger: .09, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }); } });
    });
    ScrollTrigger.batch('[data-reveal]', { start: 'top 90%', once: true, onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, stagger: .08, ease: 'power3.out', overwrite: true }) });
    ScrollTrigger.batch('[data-clip]', { start: 'top 85%', once: true, onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'power3.out', overwrite: true }) });
    $$('[data-fill]').forEach((el) => { const s = SplitText.create(el, { type: 'words', wordsClass: 'w' }); gsap.to(s.words, { opacity: 1, stagger: .06, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 50%', scrub: true } }); });
    $$('[data-count]').forEach((el) => { const to = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length, o = { v: 0 }; gsap.to(o, { v: to, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onUpdate: () => el.textContent = o.v.toFixed(dec) }); });
    const fw = $('.footer-word'); if (fw) { const s = SplitText.create(fw, { type: 'chars', charsClass: 'ch' }); gsap.from(s.chars, { y: 30, opacity: 0, stagger: .04, duration: 1.2, scrollTrigger: { trigger: fw, start: 'top 98%', once: true } }); }
    $$('[data-ring]').forEach((el) => {
      const g = $('.spin', el); const st = { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 };
      if (g) gsap.to(g, { rotate: 90, svgOrigin: '260 260', ease: 'none', scrollTrigger: st });
      gsap.to($$('.ring-glyph, .ring-label', el), { rotate: -90, transformOrigin: '50% 50%', ease: 'none', scrollTrigger: { ...st } });
      gsap.from($$('.node', el), { scale: 0, transformOrigin: '50% 50%', opacity: 0, stagger: .1, duration: .9, ease: 'back.out(1.8)', scrollTrigger: { trigger: el, start: 'top 78%', once: true } });
    });
    $$('.page-hero-media img, .svc-hero-media img').forEach((img) => gsap.fromTo(img, { yPercent: -8 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
    // Fanned photo stack opens as it appears
    $$('[data-fan]').forEach((f) => { const imgs = $$('img', f); const rots = [-12, 0, 12], xs = [-60, 0, 60]; const m = window.innerWidth < 640 ? .78 : 1; gsap.to(imgs, { rotate: (i) => rots[i], x: (i) => xs[i] * m, duration: 1.2, ease: 'power3.out', stagger: .06, scrollTrigger: { trigger: f, start: 'top 85%', once: true } }); });
  }

  /* ---------- Steps: image crossfade by scroll position ---------- */
  function steps() {
    const wrap = $('[data-steps]'); if (!wrap) return;
    const imgs = $$('.steps-media img', wrap), count = $('.steps-media .count', wrap), items = $$('.step:not(.step-intro)', wrap);
    items.forEach((st, i) => ScrollTrigger.create({ trigger: st, start: 'top 60%', end: 'bottom 40%', onToggle: (self) => { if (!self.isActive) return; imgs.forEach((im, j) => im.classList.toggle('on', i === j)); if (count) count.textContent = `${String(i + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`; } }));
  }

  /* ---------- Concerns hover image ---------- */
  function concerns() {
    const list = $('[data-concerns]'), box = $('.hover-img'); if (!list || !box || isTouch || reduced) return;
    const xTo = gsap.quickTo(box, 'x', { duration: .6, ease: 'power3' }), yTo = gsap.quickTo(box, 'y', { duration: .6, ease: 'power3' });
    const imgs = $$('img', box);
    list.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); });
    $$('.concern', list).forEach((c, i) => c.addEventListener('pointerenter', () => imgs.forEach((im, j) => im.classList.toggle('on', i === j))));
    list.addEventListener('pointerenter', (e) => { gsap.set(box, { x: e.clientX, y: e.clientY }); gsap.to(box, { opacity: 1, scale: 1, rotate: 0, duration: .5 }); });
    list.addEventListener('pointerleave', () => gsap.to(box, { opacity: 0, scale: .8, rotate: -3, duration: .4 }));
  }

  /* ---------- Photo carousels (one per signature category): active card grows, caption crossfades ---------- */
  function carousel() {
    const inits = {};
    $$('[data-carousel]').forEach((rv) => {
      const track = $('.rv-track', rv), cards = $$('.rv-card', rv), cap = $('.rv-quote', rv);
      if (!cards.length) return;
      let i = Math.max(0, cards.findIndex((c) => c.classList.contains('is-active'))); let timer;
      const place = () => { const a = cards[i]; gsap.to(track, { x: rv.offsetWidth / 2 - (a.offsetLeft + a.offsetWidth / 2), duration: .8, ease: 'power3.out' }); };
      const fill = () => { const d = cards[i].dataset; cap.querySelector('h3').textContent = d.title; cap.querySelector('p').textContent = d.text; cap.querySelector('.who').textContent = d.meta; const l = cap.querySelector('.rv-link'); if (l) l.href = d.url; };
      const show = (n, user) => {
        i = (n + cards.length) % cards.length; cards.forEach((c, j) => c.classList.toggle('is-active', j === i));
        if (!reduced) gsap.timeline().to(cap, { opacity: 0, y: 6, duration: .25, ease: 'power2.in' }).add(fill).to(cap, { opacity: 1, y: 0, duration: .5 }); else fill();
        setTimeout(place, 50); if (user) restart();
        rv.dispatchEvent(new CustomEvent('carousel:change', { detail: cards[i].dataset }));
      };
      const restart = () => { clearInterval(timer); if (!reduced && !rv.hidden && rv.dataset.auto !== 'off') timer = setInterval(() => show(i + 1), 4200); };
      const stop = () => clearInterval(timer);
      cards.forEach((c, j) => c.addEventListener('click', () => { if (j === i) { if (c.dataset.cat) rv.dispatchEvent(new CustomEvent('carousel:pick')); else leavePage(c.dataset.url); return; } show(j, true); }));
      $('[data-prev]', rv).addEventListener('click', () => show(i - 1, true));
      $('[data-next]', rv).addEventListener('click', () => show(i + 1, true));
      window.addEventListener('resize', place);
      inits[rv.dataset.carousel] = { place, restart, stop, cards };
      if (!rv.hidden) { place(); restart(); if (!reduced) gsap.from(cards, { y: 30, opacity: 0, stagger: .06, duration: 1, scrollTrigger: { trigger: rv, start: 'top 85%', once: true }, clearProps: 'opacity,transform' }); }
    });
    // Signature: the category carousel drives the treatment list shown below it
    const sig = $('[data-sig]');
    if (!sig) return;
    const catRv = $('[data-carousel="cats"]', sig), list = $('#sig-list', sig);
    const jump = () => { const top = list.getBoundingClientRect().top; if (top > window.innerHeight * .75 || top < 0) scrollTo(list); };
    catRv.addEventListener('carousel:change', (e) => {
      const id = e.detail.cat;
      $$('[data-sig-panel]', sig).forEach((p) => {
        const on = p.dataset.sigPanel === id; if (on === !p.hidden) return; p.hidden = !on;
        if (on && !reduced) gsap.fromTo(p.querySelectorAll('.sig-panel-title, .t-card'), { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: .06, duration: .7, ease: 'power3.out' });
      });
    });
    catRv.addEventListener('carousel:pick', jump);
    const jb = $('[data-sig-jump]', sig); if (jb) jb.addEventListener('click', jump);
  }

  /* ---------- Finder ---------- */
  function finder() {
    const el = $('.finder'), data = window.EW_FINDER; if (!el || !data) return;
    const input = $('.finder-input input', el), optsBox = $('.finder-opts', el), results = $('.finder-results', el), label = $('.finder-results-label', el);
    let mode = 'concern', selected = null;
    const renderOpts = () => { const opts = mode === 'concern' ? data.concerns : mode === 'category' ? data.categories : data.outlets; optsBox.innerHTML = opts.map((o) => `<button class="chip" type="button" data-id="${o.id}" aria-pressed="${selected === o.id}">${o.label}</button>`).join(''); };
    const match = (s) => { const q = input.value.trim().toLowerCase(); if (q && !(s.name + ' ' + s.keywords + ' ' + s.categoryLabel).toLowerCase().includes(q)) return false; if (!selected) return true; if (mode === 'concern') return s.concerns.includes(selected); if (mode === 'category') return s.category === selected; return !s.outlets || s.outlets.includes(selected); };
    const renderResults = () => {
      const list = data.services.filter(match); const q = input.value.trim();
      label.textContent = selected || q ? `${list.length} matching treatment${list.length === 1 ? '' : 's'}` : 'All treatments';
      results.innerHTML = list.length ? list.slice(0, 40).map((s) => `<a class="f-result" href="${s.url}"><img src="${s.img}" alt="" loading="lazy"><span><b>${s.name}</b><small>${s.categoryLabel}${s.duration ? ' · ' + s.duration : ''}</small></span></a>`).join('') : `<p class="finder-empty">No match yet — try another word, or <a class="link-arrow" href="/contact-us/">ask our therapists</a></p>`;
      if (!reduced) gsap.from(results.children, { y: 12, opacity: 0, stagger: .02, duration: .5 });
    };
    $$('.finder-tabs .chip', el).forEach((t) => t.addEventListener('click', () => { mode = t.dataset.mode; selected = null; $$('.finder-tabs .chip', el).forEach((x) => x.setAttribute('aria-pressed', x === t)); renderOpts(); renderResults(); }));
    optsBox.addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; selected = selected === b.dataset.id ? null : b.dataset.id; renderOpts(); renderResults(); });
    input.addEventListener('input', renderResults);
    const open = (preset) => { if (preset) { mode = preset.mode || 'concern'; selected = preset.id || null; $$('.finder-tabs .chip', el).forEach((x) => x.setAttribute('aria-pressed', x.dataset.mode === mode)); } renderOpts(); renderResults(); el.classList.add('open'); el.setAttribute('aria-hidden', 'false'); lenis?.stop(); document.body.style.overflow = 'hidden'; setTimeout(() => input.focus({ preventScroll: true }), 300); };
    const close = () => { el.classList.remove('open'); el.setAttribute('aria-hidden', 'true'); lenis?.start(); document.body.style.overflow = ''; };
    $$('[data-finder]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); const p = b.dataset.finder; open(p ? { mode: p.split(':')[0], id: p.split(':')[1] } : null); }));
    $$('[data-finder-close]', el).forEach((b) => b.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && el.classList.contains('open')) close(); if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); open(); } });
    const qs = new URLSearchParams(location.search); if (qs.get('concern')) open({ mode: 'concern', id: qs.get('concern') });
  }

  /* ---------- FAQ, filters, forms, misc ---------- */
  $$('.faq-q').forEach((q) => q.addEventListener('click', () => { const item = q.closest('.faq-item'); const open = !item.classList.contains('open'); item.classList.toggle('open', open); q.setAttribute('aria-expanded', open); setTimeout(() => ScrollTrigger.refresh(), 550); }));
  $$('[data-filter-group]').forEach((grp) => { const target = $(grp.dataset.filterGroup); $$('.chip', grp).forEach((chip) => chip.addEventListener('click', () => { const f = chip.dataset.filter; $$('.chip', grp).forEach((c) => c.setAttribute('aria-pressed', c === chip)); const cards = $$('[data-tags]', target); cards.forEach((c) => { c.style.display = f === 'all' || c.dataset.tags.split(' ').includes(f) ? '' : 'none'; }); if (!reduced) gsap.fromTo(cards.filter((c) => c.style.display !== 'none'), { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: .04, duration: .7 }); ScrollTrigger.refresh(); })); });
  $$('form[data-demo]').forEach((f) => f.addEventListener('submit', (e) => { e.preventDefault(); if (!f.checkValidity()) { f.reportValidity(); return; } f.classList.add('sent'); ScrollTrigger.refresh(); }));
  $$('[data-tilt]').forEach((v) => { if (isTouch || reduced) return; v.addEventListener('pointermove', (e) => { const r = v.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5; gsap.to(v, { rotateY: px * 12, rotateX: -py * 12, transformPerspective: 900, duration: .5 }); v.style.setProperty('--shine', `${px * 140}%`); }); v.addEventListener('pointerleave', () => gsap.to(v, { rotateY: 0, rotateX: 0, duration: .9, ease: 'elastic.out(1, .5)' })); });
  $$('[data-amount]').forEach((b) => b.addEventListener('click', () => { $$('[data-amount]').forEach((x) => x.setAttribute('aria-pressed', x === b)); const out = $('.voucher .amt'); if (!out) return; const o = { v: parseFloat(out.dataset.v || 0) }, to = parseFloat(b.dataset.amount); gsap.to(o, { v: to, duration: .8, onUpdate: () => out.textContent = 'S$' + Math.round(o.v) }); out.dataset.v = to; }));
  const bar = $('.reading-bar'); if (bar) gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.article, .svc-body', start: 'top 20%', end: 'bottom bottom', scrub: true } });
  $$('.toc a').forEach((a) => { const t = $(a.getAttribute('href')); if (t) ScrollTrigger.create({ trigger: t, start: 'top 45%', end: 'bottom 45%', onToggle: (s) => a.classList.toggle('active', s.isActive) }); });
  function magnetic() { if (isTouch || reduced) return; $$('.btn').forEach((b) => { const xT = gsap.quickTo(b, 'x', { duration: .5, ease: 'power3' }), yT = gsap.quickTo(b, 'y', { duration: .5, ease: 'power3' }); b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); xT((e.clientX - r.left - r.width / 2) * .18); yT((e.clientY - r.top - r.height / 2) * .25); }); b.addEventListener('pointerleave', () => { xT(0); yT(0); }); }); }

  /* ---------- Boot ---------- */
  // Signature tiles: tap to open on touch devices; arrows scroll the row on smaller screens
  function sigTiles() {
    const row = $('[data-sig-row]'); if (!row) return;
    const tiles = $$('.sig-tile', row);
    if (isTouch) tiles.forEach((t) => t.addEventListener('click', (e) => { if (!t.classList.contains('is-open')) { e.preventDefault(); tiles.forEach((x) => x.classList.toggle('is-open', x === t)); } }));
    const step = () => (tiles[0]?.offsetWidth || 300) + 14;
    $('[data-sig-prev]')?.addEventListener('click', () => row.scrollBy({ left: -step(), behavior: 'smooth' }));
    $('[data-sig-next]')?.addEventListener('click', () => row.scrollBy({ left: step(), behavior: 'smooth' }));
  }
  // Live Google ratings: if /api/reviews is available, refresh the numbers and review cards on the page
  async function liveReviews() {
    if (!$('[data-google-reviews], [data-rv-place]')) return;
    if (!document.querySelector('meta[name="ew-live-reviews"]')) return;
    let d; try { const r = await fetch('/api/reviews', { headers: { Accept: 'application/json' } }); if (!r.ok) return; d = await r.json(); } catch { return; }
    const fmt = (n) => Number(n).toLocaleString('en-SG');
    const count = (el, to, dec = 0) => { if (!el) return; const from = parseFloat(el.textContent.replace(/,/g, '')) || 0; if (reduced) { el.textContent = dec ? to.toFixed(dec) : fmt(to); return; } const o = { v: from }; gsap.to(o, { v: to, duration: 1.2, ease: 'power2.out', onUpdate: () => el.textContent = dec ? o.v.toFixed(dec) : fmt(Math.round(o.v)) }); };
    $$('[data-rv-total]').forEach((el) => count(el, d.total));
    $$('[data-rv-avg]').forEach((el) => count(el, d.average, 1));
    d.places.forEach((p) => $$(`[data-rv-place="${p.id}"]`).forEach((row) => { count($('[data-rv-rating]', row), p.rating, 1); count($('[data-rv-count]', row), p.count); if (row.tagName === 'A' && p.mapsUrl) row.href = p.mapsUrl; }));
    const w = $('[data-rv-write]'); if (w && d.places[0]?.writeReviewUrl) w.href = d.places[0].writeReviewUrl;
    const up = $('[data-rv-updated]'); if (up) up.textContent = 'Live from Google · updated ' + new Date(d.snapshotDate).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  const boot = () => { liveReviews(); reveals(); steps(); concerns(); carousel(); sigTiles(); finder(); magnetic(); requestAnimationFrame(() => ScrollTrigger.refresh()); };
  (document.fonts?.ready || Promise.resolve()).then(() => enterPage(() => { steamHero(); boot(); }));
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
