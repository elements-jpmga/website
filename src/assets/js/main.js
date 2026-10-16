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
    let walkin = false; try { walkin = sessionStorage.getItem('ew-walkin') === '1'; sessionStorage.removeItem('ew-walkin'); } catch {}
    if (walkin && !isHome) { if (loader) loader.style.display = 'none'; if (curtain) gsap.set(curtain, { visibility: 'hidden', opacity: 0 }); const w = document.querySelector('[data-walkin] img'); if (w && !reduced) gsap.fromTo(w, { scale: 1.04 }, { scale: 1, duration: 1.6, ease: 'power2.out' }); onDone(); return; }
    if (reduced || !loader || !isHome) {
      if (loader) loader.style.display = 'none';
      if (curtain && !reduced) { gsap.set(curtain, { opacity: 1, visibility: 'visible' }); gsap.to(curtain, { opacity: 0, duration: .6, ease: 'power2.out', onComplete: () => gsap.set(curtain, { visibility: 'hidden' }) }); }
      onDone(); return;
    }
    // Home: the logo lockup appears — ELEMENTS rises, WELLNESS settles in beneath it (two clipped copies of the supplied logo file) — then the screen opens from the middle
    const top = loader.querySelector('.loader-top'), bottom = loader.querySelector('.loader-bottom'), inner = loader.querySelector('.loader-inner'), lock = loader.querySelector('.loader-lockup'), l1 = loader.querySelector('.ll-1'), l2 = loader.querySelector('.ll-2');
    const k = firstVisit ? 1 : .55;
    gsap.timeline({ onComplete: () => { loader.style.display = 'none'; } })
      .fromTo(lock, { opacity: 0, scale: .96 }, { opacity: 1, scale: 1, duration: .7 * k, ease: 'power2.out' }, 0)
      .fromTo(l1, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .9 * k, ease: 'power3.out' }, .2 * k)
      .fromTo(l2, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: .8 * k, ease: 'power3.out' }, .6 * k)
      .to(inner, { opacity: 0, duration: .8 * k, ease: 'power2.inOut' }, `+=${.45 * k}`)
      .add(onDone, '-=.2')
      .to(top, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '-=.25')
      .to(bottom, { yPercent: 100, duration: 1.1, ease: 'expo.inOut' }, '<');
  };
  const leavePage = (href) => {
    if (!curtain || reduced) { window.location.href = href; return; }
    gsap.set(curtain, { visibility: 'visible', opacity: 0 });
    gsap.set(curtain.querySelector('.loader-lockup'), { opacity: 0, y: 8 });
    gsap.timeline({ onComplete: () => { window.location.href = href; } })
      .to(curtain, { opacity: 1, duration: .45, ease: 'power2.inOut' })
      .to(curtain.querySelector('.loader-lockup'), { opacity: 1, y: 0, duration: .4 }, '-=.2');
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
    const state = { density: .09, mx: -9999, my: -9999 };
    let ctx, W, H, parts = [], sprite, running = true;
    if (canvas && !reduced) {
      ctx = canvas.getContext('2d');
      sprite = document.createElement('canvas'); sprite.width = sprite.height = 256;
      const s = sprite.getContext('2d'); const g = s.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, 'rgba(255,248,245,0.42)'); g.addColorStop(.35, 'rgba(252,243,240,0.2)'); g.addColorStop(.7, 'rgba(248,236,233,0.05)'); g.addColorStop(1, 'rgba(248,236,233,0)');
      s.fillStyle = g; s.fillRect(0, 0, 256, 256);
      const resize = () => { const dpr = Math.min(window.devicePixelRatio || 1, 1.5); W = hero.offsetWidth; H = hero.offsetHeight; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
      resize(); window.addEventListener('resize', resize);
      const N = W < 700 ? 14 : 26;
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
    gsap.set(veil, { opacity: 0 });
    gsap.timeline()
      .fromTo(img, { scale: 1.08 }, { scale: 1.04, duration: 2.6 * speed, ease: 'power3.out' }, 0)
      .to(titleLines, { yPercent: 0, duration: 1.2, stagger: .12, ease: 'expo.out' }, .8 * speed)
      .to(fadeIns, { opacity: 1, y: 0, duration: 1, stagger: .1 }, 1.1 * speed);
    gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
      .to(img, { yPercent: 10, ease: 'none' }, 0)
      .to($('.hero-content', hero), { yPercent: -12, opacity: 0, ease: 'none' }, 0)
      .to(state, { density: .04, ease: 'none' }, 0);
  }

  /* ---------- Hero slides: crossfade every few seconds; words swap with a soft lift ---------- */
  function heroSlides() {
    const sec = $('[data-slides]'), data = window.EW_SLIDES; if (!sec || !data) return;
    const imgs = $$('[data-slide-img]', sec), dots = $$('[data-slide-to]', sec), title = $('[data-slide-title]', sec), sub = $('[data-slide-sub]', sec), cta = $('[data-slide-cta]', sec);
    let i = 0, timer, busy = false;
    const fill = (n) => { title.textContent = data[n].title; sub.textContent = data[n].sub; cta.querySelector('span').textContent = data[n].cta; cta.href = data[n].href; };
    const show = (n, user) => {
      n = (n + data.length) % data.length; if (n === i || busy) return; const from = i; i = n;
      dots.forEach((d, j) => { d.classList.toggle('is-on', j === n); d.setAttribute('aria-selected', j === n); });
      if (reduced) { imgs.forEach((im, j) => im.classList.toggle('is-on', j === n)); fill(n); return; }
      busy = true;
      gsap.timeline({ onComplete: () => { busy = false; } })
        .to([title, sub, cta], { opacity: 0, y: -14, duration: .45, stagger: .05, ease: 'power2.in' }, 0)
        .set(imgs[n], { opacity: 0, scale: 1.08, zIndex: 2 }, 0).add(() => imgs[n].classList.add('is-on'), 0)
        .to(imgs[n], { opacity: 1, duration: 1.4, ease: 'power2.inOut' }, 0)
        .to(imgs[n], { scale: 1.04, duration: 6, ease: 'none' }, 0)
        .add(() => { imgs[from].classList.remove('is-on'); gsap.set(imgs[from], { clearProps: 'all' }); gsap.set(imgs[n], { zIndex: 1 }); }, 1.4)
        .add(fill.bind(null, n), .5)
        .fromTo([title, sub, cta], { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .9, stagger: .08, ease: 'power3.out' }, .6);
      if (user) restart();
    };
    const restart = () => { clearInterval(timer); if (!reduced) timer = setInterval(() => show(i + 1), 6500); };
    dots.forEach((d) => d.addEventListener('click', () => show(+d.dataset.slideTo, true)));
    $('[data-slide-prev]', sec)?.addEventListener('click', () => show(i - 1, true));
    $('[data-slide-next]', sec)?.addEventListener('click', () => show(i + 1, true));
    new IntersectionObserver(([en]) => (en.isIntersecting ? restart() : clearInterval(timer))).observe(sec);
  }

  /* ---------- Logo wall: every couple of seconds one cell swaps its logo for one not on the wall ---------- */
  function logoWall() {
    const wall = $('[data-logo-wall]'), pool = window.EW_LOGOS; if (!wall || !pool || reduced) return;
    const shown = $$('.logo-cell', wall).filter((c) => c.offsetParent !== null);
    gsap.set(shown, { opacity: 0, x: -28 });
    ScrollTrigger.create({ trigger: wall, start: 'top 85%', once: true, onEnter: () => gsap.to(shown, { opacity: 1, x: 0, duration: .9, stagger: .09, ease: 'power3.out' }) });
    const cells = $$('.logo-cell', wall).filter((c) => c.offsetParent !== null); if (pool.length <= cells.length) return;
    let showing0 = $$('.logo-cell', wall).map((_, i) => i);
    let showing = showing0, last = -1, timer;
    const swap = () => {
      let c; do { c = Math.floor(Math.random() * cells.length); } while (c === last); last = c;
      const hidden = pool.map((_, i) => i).filter((i) => !showing.includes(i)); const next = hidden[Math.floor(Math.random() * hidden.length)];
      const cell = cells[c], img = $('img', cell), a = $('a', cell); showing[c] = next; const L = pool[next];
      gsap.timeline()
        .to(img, { yPercent: -45, opacity: 0, duration: .45, ease: 'power2.in' })
        .add(() => { img.src = L.img; img.alt = L.title; if (a) { a.href = L.url || a.href; a.title = L.title; } })
        .fromTo(img, { yPercent: 45, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .8, ease: 'power3.out' });
    };
    new IntersectionObserver(([en]) => { clearInterval(timer); if (en.isIntersecting) timer = setInterval(swap, 2200); }).observe(wall);
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
    // Reveal direction follows position: left side slides in from the left, right side from the right, centre rises;
    // whatever enters together queues in reading order (top row first, then left to right)
    const dirFor = (el) => { const r = el.getBoundingClientRect(), vw = window.innerWidth, c = (r.left + r.width / 2) / vw; if (r.width > vw * .66 || vw < 720) return { x: 0, y: 28 }; if (c < .42) return { x: -56, y: 0 }; if (c > .58) return { x: 56, y: 0 }; return { x: 0, y: 28 }; };
    $$('[data-reveal]').forEach((el) => gsap.set(el, { opacity: 0, ...dirFor(el) }));
    const order = (els) => els.map((el) => ({ el, r: el.getBoundingClientRect() })).sort((a, b) => (Math.abs(a.r.top - b.r.top) > 40 ? a.r.top - b.r.top : a.r.left - b.r.left)).map((o) => o.el);
    ScrollTrigger.batch('[data-reveal]', { start: 'top 90%', once: true, onEnter: (els) => {
      // anything already scrolled past (a fast scroll or a jump) just appears; what's on screen queues, finishing within about a second
      const passed = els.filter((el) => el.getBoundingClientRect().bottom < 0), now = order(els.filter((el) => !passed.includes(el)));
      if (passed.length) gsap.set(passed, { opacity: 1, x: 0, y: 0, overwrite: true });
      if (now.length) gsap.to(now, { opacity: 1, x: 0, y: 0, duration: 1.1, stagger: Math.min(.12, .9 / now.length), ease: 'power3.out', overwrite: true });
    } });
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

  /* ---------- Treatment cards: rise into place with perspective, then drift gently with the scroll ---------- */
  function rise() {
    $$('[data-rise]').forEach((grid) => {
      const items = $$('[data-rise-item]', grid); if (!items.length) return;
      if (reduced) { gsap.set(items, { opacity: 1 }); return; }
      gsap.set(grid, { perspective: 1200 });
      gsap.fromTo(items, { y: 140, opacity: 0, rotateX: 9, scale: .96, transformOrigin: '50% 100%' }, { y: 0, opacity: 1, rotateX: 0, scale: 1, duration: 1.5, stagger: .13, ease: 'expo.out', scrollTrigger: { trigger: grid, start: 'top 82%', once: true }, clearProps: 'rotateX,scale' });
      if (window.innerWidth > 960) items.forEach((it, i) => gsap.fromTo(it, { y: i % 2 ? 36 : 0 }, { y: i % 2 ? -24 : 0, ease: 'none', immediateRender: false, scrollTrigger: { trigger: grid, start: 'top bottom', end: 'bottom top', scrub: 1.2 } }));
    });
  }

  /* ---------- Treatment cards: the hovered treatment's photo slides in over the card photo (left to right) and slides away on leave ---------- */
  function pathPhotos() {
    if (isTouch) return;
    $$('.path-card').forEach((card) => {
      const media = $('.path-media', card), list = $('.path-list', card); if (!media || !list) return;
      const links = $$('a[data-img]', list).filter((a) => a.dataset.img);
      card.addEventListener('pointerenter', () => links.forEach((a) => { const i = new Image(); i.src = a.dataset.img; }), { once: true });
      let top = null;
      const show = (src) => {
        if (top && top.dataset.src === src) return;
        const img = document.createElement('img'); img.className = 'path-slide'; img.alt = ''; img.src = src; img.dataset.src = src; media.appendChild(img);
        const under = top; top = img;
        if (reduced) { under?.remove(); return; }
        gsap.fromTo(img, { clipPath: 'inset(0 100% 0 0)', scale: 1.08 }, { clipPath: 'inset(0 0% 0 0)', scale: 1, duration: .75, ease: 'power3.inOut', onComplete: () => under?.remove() });
      };
      const hide = () => {
        if (!top) return; const img = top; top = null;
        if (reduced) { img.remove(); return; }
        gsap.to(img, { clipPath: 'inset(0 0 0 100%)', duration: .6, ease: 'power3.inOut', onComplete: () => { $$('.path-slide', media).forEach((x) => x !== top && x.remove()); } });
      };
      links.forEach((a) => a.addEventListener('pointerenter', () => show(a.dataset.img)));
      list.addEventListener('pointerleave', hide);
    });
  }

  /* ---------- Treatment pages: the bottom-left booking card appears after the hero and steps aside at the booking section ---------- */
  function bookCard() {
    const card = $('[data-bookcard]'); if (!card) return;
    const hero = $('.tp-hero'), band = $('#tp-book');
    const update = () => { const past = hero ? hero.getBoundingClientRect().bottom < 0 : window.scrollY > 500; const atBand = band ? band.getBoundingClientRect().top < window.innerHeight * .85 : false; card.classList.toggle('show', past && !atBand); };
    window.addEventListener('scroll', update, { passive: true }); update();
  }

  /* ---------- Review carousels: arrows page through the cards; long reviews get "Read more" ---------- */
  function reviewCarousels() {
    $$('[data-rv-carousel]').forEach((c) => {
      const track = $('.rv-track', c), items = $$('.rv-item', c), prev = $('[data-rv-prev]', c), next = $('[data-rv-next]', c), count = $('.rv-count', c);
      const step = () => (items[0]?.getBoundingClientRect().width || 300) + 16;
      const update = () => { const max = track.scrollWidth - track.clientWidth - 4; prev.disabled = track.scrollLeft <= 4; next.disabled = track.scrollLeft >= max; const first = Math.round(track.scrollLeft / step()) + 1; const shown = Math.max(1, Math.round(track.clientWidth / step())); const last = Math.min(items.length, first + shown - 1); count.textContent = `${last > first ? `${first}–${last}` : first} of ${items.length} reviews`; };
      prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
      next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
      track.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update); update();
      items.forEach((it) => { const t = $('.rv-text', it), b = $('.rv-more', it); if (t.scrollHeight > t.clientHeight + 4) { b.hidden = false; b.addEventListener('click', () => { const o = it.classList.toggle('is-open'); b.textContent = o ? 'Show less' : 'Read more'; }); } });
    });
  }

  /* ---------- Contact: a card's photo expands to fill the screen, then opens the outlet page.
     313@somerset plays its walk-in video while it expands and opens the page when the video ends. ---------- */
  function contactExpand() {
    const stage = $('[data-ct-stage]'); if (!stage) return;
    const small = window.matchMedia('(max-width: 900px)').matches;
    // warm the video so it starts at once
    $$('[data-video]').forEach((a) => { const l = document.createElement('link'); l.rel = 'preload'; l.as = 'video'; l.href = small ? a.dataset.videoSm : a.dataset.video; document.head.appendChild(l); });
    let busy = false;
    const go = (href) => { try { sessionStorage.setItem('ew-walkin', '1'); } catch {} window.location.href = href; };
    const open = (a) => {
      if (busy) return; busy = true;
      const href = a.getAttribute('href'), img = $('img', a), r = a.getBoundingClientRect();
      if (reduced) { go(href); return; }
      stage.innerHTML = ''; const pic = img.cloneNode(); pic.removeAttribute('loading'); stage.appendChild(pic);
      let vid = null, skip = null;
      if (a.dataset.video) {
        vid = document.createElement('video'); vid.muted = true; vid.playsInline = true; vid.preload = 'auto'; vid.src = small ? a.dataset.videoSm : a.dataset.video; vid.poster = a.dataset.first; stage.appendChild(vid);
        skip = document.createElement('button'); skip.type = 'button'; skip.className = 'ct-skip'; skip.textContent = '→'; skip.setAttribute('aria-label', 'Continue'); stage.appendChild(skip);
        skip.addEventListener('click', () => go(href));
        vid.addEventListener('ended', () => go(href));
      }
      gsap.set(stage, { left: r.left, top: r.top, width: r.width, height: r.height });
      stage.classList.add('on'); lenis?.stop();
      const tl = gsap.timeline();
      tl.to(stage, { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight, duration: 1, ease: 'expo.inOut' });
      if (vid) {
        tl.to(vid, { opacity: 1, duration: .5, ease: 'power2.out', onStart: () => { vid.play().catch(() => go(href)); } }, '-=.45')
          .to(skip, { opacity: 1, duration: .4 }, '+=.6');
        setTimeout(() => go(href), 9000); // safety: never strand the visitor
      } else {
        tl.to(pic, { scale: 1.08, duration: .6, ease: 'power2.in' }, '-=.15').add(() => go(href));
      }
    };
    $$('[data-expand]').forEach((a) => a.addEventListener('click', (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); e.stopPropagation(); open(a); }, true));
    $$('[data-expand-link]').forEach((l) => l.addEventListener('click', (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); e.stopPropagation(); open($(`[data-expand="${l.dataset.expandLink}"]`)); }, true));
    window.addEventListener('pageshow', (e) => { if (e.persisted) { stage.classList.remove('on'); stage.innerHTML = ''; busy = false; lenis?.start(); } });
  }

  /* ---------- Locations map: Singapore zooms into Orchard Road once; tap a pin and its card (photos + details) opens in the empty corner ---------- */
  function mapLocations() {
    const sec = $('[data-map]'); if (!sec) return;
    const stage = $('[data-omap]', sec), sg = $('.omap-sg', sec), street = $('.omap-street', sec);
    const pins = $$('[data-pin]', street), malls = $$('[data-mall]', street), pops = $$('[data-pop]', sec);
    const W = 1200, H = 790;
    const pinXY = (id) => { const t = pins.find((p) => p.dataset.pin === id).getAttribute('transform').match(/translate\(([\d.]+) ([\d.]+)\)/); return [+t[1], +t[2]]; };
    // frame all three pins to the map's own shape (pins sit to the upper right, leaving the lower left free for the card)
    const fit = () => {
      const xy = pins.map((p) => pinXY(p.dataset.pin)), xs = xy.map((p) => p[0]), ys = xy.map((p) => p[1]);
      const sw = stage.clientWidth, a = sw / Math.max(1, stage.clientHeight), wide = window.innerWidth > 900;
      // on desktop the left part of the map is kept for the outlet card, so the pins are framed in the rest
      const f = wide ? Math.min(.45, (Math.min(380, sw * .36) + 56) / sw) : 0, a2 = a * (1 - f);
      let x0 = Math.min(...xs) - 70, x1 = Math.max(...xs) + 90, y0 = Math.min(...ys) - 90, y1 = Math.max(...ys) + (wide ? 120 : 60);
      let w = x1 - x0, h = y1 - y0; if (w / h < a2) { const d = h * a2 - w; x0 -= d / 2; w = h * a2; } else { const d = w / a2 - h; y0 -= d / 2; h = w / a2; }
      const full = w / (1 - f); x0 -= full - w; w = full;
      x0 = Math.min(Math.max(x0, 0), Math.max(0, W - w)); y0 = Math.min(Math.max(y0, 0), Math.max(0, H - h));
      return [x0, y0, w, h].map((n) => Math.round(n * 10) / 10).join(' ');
    };
    street.setAttribute('viewBox', fit());
    new ResizeObserver(() => street.setAttribute('viewBox', fit())).observe(stage);
    let current = null, slideTimer;
    // the outlet's photos rotate in the card while it is open
    const showSlide = (c, n) => { const imgs = $$('[data-pop-slides] img', c), dots = $$('[data-pop-dot]', c); if (!imgs.length) return; n = (n + imgs.length) % imgs.length; imgs.forEach((im, j) => im.classList.toggle('is-on', j === n)); dots.forEach((d, j) => d.classList.toggle('is-on', j === n)); c.dataset.slide = n; };
    const startSlides = (c) => { clearInterval(slideTimer); if (!c || reduced) return; slideTimer = setInterval(() => showSlide(c, (+c.dataset.slide || 0) + 1), 3200); };
    const open = (id) => {
      current = id;
      pins.forEach((p) => p.classList.toggle('is-on', p.dataset.pin === id));
      malls.forEach((m) => m.classList.toggle('is-on', m.dataset.mall === id));
      pops.forEach((c) => { const on = c.dataset.pop === id; c.classList.toggle('is-open', on); c.setAttribute('aria-hidden', !on); });
      const c = pops.find((x) => x.dataset.pop === id);
      if (c) { showSlide(c, 0); startSlides(c); } else clearInterval(slideTimer);
      if (c && !reduced) gsap.fromTo($$('.omap-pop-over > *, .omap-actions, .omap-pop-body > *', c), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .7, stagger: .05, ease: 'power3.out', delay: .15 });
      if (c && window.innerWidth <= 900) setTimeout(() => scrollTo(c), 150);
    };
    pins.forEach((p) => { p.addEventListener('click', () => open(p.dataset.pin)); p.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(p.dataset.pin); }); });
    pops.forEach((c) => {
      $('[data-pop-close]', c).addEventListener('click', () => open(null));
      $$('[data-pop-dot]', c).forEach((d) => d.addEventListener('click', () => { showSlide(c, +d.dataset.popDot); startSlides(c); }));
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && current) open(null); });
    if (reduced) { sg.style.display = 'none'; return; }
    // Intro: Singapore with the Orchard Road dot dead centre → the camera dives into the dot → the street map opens from the middle
    const DX = 340, DY = 238, dot = $('.sg-dot', sg), rings = $$('.sg-ring', sg), burst = $('.omap-burst', sec);
    const aspect = () => stage.clientWidth / Math.max(1, stage.clientHeight);
    const box = (w) => { const h = w / aspect(); return [DX - w / 2, DY - h / 2, w, h].map((n) => Math.round(n * 100) / 100).join(' '); };
    const W0 = Math.max(1400, 933 * aspect()), W1 = 22;
    sg.setAttribute('viewBox', box(W0));
    gsap.set(sg, { opacity: 0 }); gsap.set(street, { clipPath: 'circle(0% at 50% 50%)' }); gsap.set(burst, { scale: 0, opacity: 0 });
    gsap.set($$('.om-pin-in', street), { opacity: 0, y: -40 }); gsap.set($$('.om-road, .om-bld, .om-park, .om-mrt', street), { opacity: 0 });
    gsap.set(rings, { attr: { r: 7 }, opacity: 0 });
    ScrollTrigger.create({ trigger: stage, start: 'top 70%', once: true, onEnter: () => {
      const tl = gsap.timeline();
      tl.to(sg, { opacity: 1, duration: .9, ease: 'power2.out' })
        .fromTo(dot, { attr: { r: 0 } }, { attr: { r: 9 }, duration: .6, ease: 'back.out(3)' }, '-=.4')
        .to(rings, { attr: { r: 70 }, opacity: 0, duration: 1.4, stagger: .35, ease: 'power2.out', startAt: { attr: { r: 9 }, opacity: .9 } }, '-=.1')
        // dive: the viewBox shrinks around the dot (which stays the same size on screen), so the island rushes past the edges
        .to(sg, { attr: { viewBox: box(W1) }, duration: 1.7, ease: 'power4.inOut' }, '-=.6')
        .to(dot, { attr: { r: 9 * W1 / W0 }, duration: 1.7, ease: 'power4.inOut' }, '<')
        // the street map opens out from the middle in a widening circle, with a soft ring riding its edge
        .to(street, { clipPath: 'circle(75% at 50% 50%)', duration: 1.3, ease: 'power3.inOut' }, '-=.35')
        .fromTo(street, { scale: 1.18, transformOrigin: '50% 50%' }, { scale: 1, duration: 1.6, ease: 'power3.out' }, '<')
        .to(burst, { scale: 1, opacity: 1, duration: .5, ease: 'power2.out' }, '<')
        .to(burst, { scale: 2.6, opacity: 0, duration: 1.1, ease: 'power2.out' }, '<.3')
        .to($$('.om-park, .om-bld', street), { opacity: 1, duration: .8 }, '<.2')
        .to($$('.om-road', street), { opacity: 1, duration: .9, stagger: .08 }, '<')
        .to($$('.om-mrt', street), { opacity: 1, duration: .6 }, '-=.4')
        .to(pins.slice().sort((a, b) => pinXY(a.dataset.pin)[0] - pinXY(b.dataset.pin)[0]).map((p) => $('.om-pin-in', p)), { opacity: 1, y: 0, duration: .8, stagger: .18, ease: 'back.out(2)' }, '-=.5')
        .add(() => { sg.style.display = 'none'; burst.style.display = 'none'; gsap.set(street, { clearProps: 'clipPath' }); });
    } });
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
  // Reveal cards: on touch the first tap shows the photo + description, the second follows the link
  function revealCards() {
    if (!isTouch) return;
    $$('.rcard').forEach((c) => c.addEventListener('click', (e) => { if (!c.classList.contains('is-open')) { e.preventDefault(); $$('.rcard.is-open').forEach((x) => x.classList.remove('is-open')); c.classList.add('is-open'); } }));
    document.addEventListener('click', (e) => { if (!e.target.closest('.rcard')) $$('.rcard.is-open').forEach((x) => x.classList.remove('is-open')); });
  }
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
  const boot = () => { heroSlides(); logoWall(); pathPhotos(); bookCard(); reviewCarousels(); contactExpand(); liveReviews(); reveals(); rise(); mapLocations(); steps(); concerns(); carousel(); sigTiles(); revealCards(); finder(); magnetic(); requestAnimationFrame(() => ScrollTrigger.refresh()); };
  (document.fonts?.ready || Promise.resolve()).then(() => enterPage(() => { steamHero(); boot(); }));
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
