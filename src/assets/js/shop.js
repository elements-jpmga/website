/* Products: cart (kept in this browser), cart drawer, cart page, checkout (Stripe Checkout via the Elements staff system) and thank-you page. */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const P = window.EW_PRODUCTS || {};
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  const API = window.EW_SHOP_API || document.querySelector('meta[name="ew-gift-api"]')?.content || (local ? 'http://localhost:4400' : 'https://assess.elements.com.sg');
  const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const money = (n) => 'S$' + Number(n).toLocaleString('en-SG', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const api = async (path, opts = {}) => { const r = await fetch(API + path, { ...opts, headers: { ...(opts.body ? { 'Content-Type': 'application/json' } : {}), ...(opts.headers || {}) } }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Something went wrong. Please try again.'); return j; };

  /* ---------- the cart itself ---------- */
  const KEY = 'ew-cart';
  const read = () => { try { const c = JSON.parse(localStorage.getItem(KEY) || '{}'); return Array.isArray(c.lines) ? c.lines.filter((l) => P[l.sku] && l.qty > 0) : []; } catch { return []; } };
  const write = (lines) => { try { localStorage.setItem(KEY, JSON.stringify({ lines, at: Date.now() })); } catch {} document.dispatchEvent(new CustomEvent('ew-cart', { detail: lines })); };
  const cart = {
    lines: read(),
    count() { return this.lines.reduce((n, l) => n + l.qty, 0); },
    subtotal() { return this.lines.reduce((n, l) => n + P[l.sku].price * l.qty, 0); },
    add(sku, qty = 1) { if (!P[sku]) return; const l = this.lines.find((x) => x.sku === sku); if (l) l.qty = Math.min(10, l.qty + qty); else this.lines.push({ sku, qty }); write(this.lines); },
    set(sku, qty) { const l = this.lines.find((x) => x.sku === sku); if (!l) return; l.qty = Math.max(0, Math.min(10, qty)); this.lines = this.lines.filter((x) => x.qty > 0); write(this.lines); },
    remove(sku) { this.lines = this.lines.filter((x) => x.sku !== sku); write(this.lines); },
    clear() { this.lines = []; write(this.lines); },
  };
  window.addEventListener('storage', (e) => { if (e.key === KEY) { cart.lines = read(); document.dispatchEvent(new CustomEvent('ew-cart', { detail: cart.lines })); } });

  const badge = () => $$('[data-cart-count]').forEach((b) => { const n = cart.count(); b.textContent = n; b.hidden = !n; b.closest('.cart-link')?.classList.toggle('has-items', !!n); });
  document.addEventListener('ew-cart', badge); badge();

  const lineHtml = (l, { editable = true } = {}) => { const p = P[l.sku]; return `<div class="cl" data-line="${esc(l.sku)}">
      <a class="cl-media" href="/products/#${esc(l.sku)}"><img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy"></a>
      <div class="cl-body">
        <div class="cl-row"><span class="cl-name">${esc(p.name)}</span><span class="cl-size">${esc(p.size)}</span></div>
        <span class="cl-brand">${esc(p.brand)}</span>
        <div class="cl-row cl-foot">
          ${editable ? `<div class="qty" aria-label="Quantity"><button type="button" data-qty="-1" aria-label="Decrease">−</button><span>${l.qty}</span><button type="button" data-qty="1" aria-label="Increase" ${l.qty >= 10 ? 'disabled' : ''}>+</button></div>` : `<span class="cl-qty">× ${l.qty}</span>`}
          <b class="cl-price">${money(p.price * l.qty)}</b>
        </div>
        ${editable ? '<button class="cl-remove" type="button" data-remove>Remove</button>' : ''}
      </div></div>`; };
  const bindLines = (root) => {
    $$('[data-qty]', root).forEach((b) => b.addEventListener('click', () => { const sku = b.closest('[data-line]').dataset.line; const l = cart.lines.find((x) => x.sku === sku); if (l) cart.set(sku, l.qty + +b.dataset.qty); }));
    $$('[data-remove]', root).forEach((b) => b.addEventListener('click', () => cart.remove(b.closest('[data-line]').dataset.line)));
  };
  const sumHtml = ({ delivery = null } = {}) => `<div class="sum-row"><span>Subtotal</span><b>${money(cart.subtotal())}</b></div>
    ${delivery != null ? `<div class="sum-row"><span>Delivery</span><b>${delivery ? money(delivery) : 'Free'}</b></div>` : ''}
    <div class="sum-row sum-total"><span>Total</span><b>${money(cart.subtotal() + (delivery || 0))}</b></div>`;

  /* ---------- drawer (opens when something is added) ---------- */
  let drawer;
  const ensureDrawer = () => {
    if (drawer) return drawer;
    drawer = document.createElement('div'); drawer.className = 'cd'; drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML = `<div class="cd-bg" data-cd-close></div><aside class="cd-panel" role="dialog" aria-label="Cart"><div class="cd-head"><span class="cd-title">Cart <small data-cd-count></small></span><button class="cd-close" type="button" data-cd-close aria-label="Close">×</button></div><div class="cd-lines" data-cd-lines></div><div class="cd-foot"><div class="co-sum" data-cd-sum></div><a class="btn co-pay" href="/checkout/"><span>Checkout</span></a><a class="co-back" href="/cart/">View cart</a></div></aside>`;
    document.body.appendChild(drawer);
    $$('[data-cd-close]', drawer).forEach((b) => b.addEventListener('click', closeDrawer));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer(); });
    return drawer;
  };
  const renderDrawer = () => { if (!drawer) return; const n = cart.count(); $('[data-cd-count]', drawer).textContent = n ? `${n} item${n === 1 ? '' : 's'}` : ''; const box = $('[data-cd-lines]', drawer); box.innerHTML = cart.lines.length ? cart.lines.map((l) => lineHtml(l)).join('') : '<p class="cd-empty">Your cart is empty.</p>'; bindLines(box); $('[data-cd-sum]', drawer).innerHTML = cart.lines.length ? sumHtml() : ''; $('.cd-foot', drawer).hidden = !cart.lines.length; };
  const openDrawer = () => { ensureDrawer(); renderDrawer(); drawer.classList.add('is-open'); drawer.setAttribute('aria-hidden', 'false'); document.documentElement.classList.add('cd-lock'); };
  const closeDrawer = () => { if (!drawer) return; drawer.classList.remove('is-open'); drawer.setAttribute('aria-hidden', 'true'); document.documentElement.classList.remove('cd-lock'); };
  document.addEventListener('ew-cart', renderDrawer);

  // Add to cart buttons on the product cards; the header cart link opens the drawer instead of leaving the page
  $$('[data-add]').forEach((b) => b.addEventListener('click', () => { cart.add(b.dataset.add); b.classList.add('is-added'); setTimeout(() => b.classList.remove('is-added'), 1400); openDrawer(); }));
  if (!$('[data-cart-page]') && !$('[data-checkout]')) $$('.cart-link').forEach((a) => a.addEventListener('click', (e) => { if (!cart.count()) return; e.preventDefault(); openDrawer(); }));

  /* ---------- /cart/ ---------- */
  const cartPage = $('[data-cart-page]');
  if (cartPage) {
    const empty = $('[data-cart-empty]'), lines = $('[data-cart-lines]'), sum = $('[data-cart-summary]');
    const render = () => { const has = cart.lines.length > 0; cartPage.hidden = !has; empty.hidden = has; if (!has) return; lines.innerHTML = cart.lines.map((l) => lineHtml(l)).join(''); bindLines(lines); sum.innerHTML = sumHtml(); };
    document.addEventListener('ew-cart', render); render();
  }

  /* ---------- /checkout/ ---------- */
  const form = $('[data-checkout]');
  if (form) {
    const empty = $('[data-cart-empty]'), items = $('[data-co-items]'), sum = $('[data-co-summary]'), pay = $('[data-co-pay]'), out = $('[data-co-error]'), notice = $('[data-co-notice]');
    const methods = $('[data-co-methods]'), outlets = $('[data-co-outlets]'), address = $('[data-co-address]');
    let cfg = { delivery: null, payments: true };
    const method = () => (form.elements.fulfilment?.value === 'delivery' && cfg.delivery ? 'delivery' : 'collect');
    const fee = () => { if (method() !== 'delivery') return null; const d = cfg.delivery; return d.free_from && cart.subtotal() >= d.free_from ? 0 : d.fee; };
    const render = () => {
      const has = cart.lines.length > 0; form.hidden = !has; empty.hidden = has; if (!has) return;
      items.innerHTML = cart.lines.map((l) => lineHtml(l, { editable: false })).join('');
      sum.innerHTML = sumHtml({ delivery: fee() });
      $('span', pay).textContent = `Pay ${money(cart.subtotal() + (fee() || 0))}`;
      const del = method() === 'delivery'; outlets.hidden = del; address.hidden = !del;
    };
    document.addEventListener('ew-cart', render); render();
    form.addEventListener('change', (e) => { if (e.target.name === 'fulfilment') render(); });
    api('/api/shop/public/catalog').then((c) => {
      cfg = { delivery: c.delivery, payments: c.payments };
      if (c.delivery) { methods.hidden = false; $('[data-co-delivery-fee]').textContent = c.delivery.free_from ? `${money(c.delivery.fee)} · free from ${money(c.delivery.free_from)}` : money(c.delivery.fee); }
      if (!c.payments) { notice.hidden = false; notice.textContent = 'Online payment is not switched on yet. Please call or WhatsApp an outlet to order.'; pay.disabled = true; }
      render();
    }).catch(() => {});
    if (new URLSearchParams(location.search).get('cancelled')) { notice.hidden = false; notice.textContent = 'Your payment was cancelled — nothing has been charged.'; }
    const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); out.textContent = '';
      const d = Object.fromEntries(new FormData(form).entries());
      const bad = (msg, el) => { out.textContent = msg; el?.focus(); };
      if (!d.buyer_name.trim()) return bad('Please enter your name.', form.elements.buyer_name);
      if (!EMAIL.test(d.buyer_email)) return bad('Please enter a valid email address.', form.elements.buyer_email);
      if (!d.buyer_phone.trim()) return bad('Please enter your mobile number.', form.elements.buyer_phone);
      const m = method();
      if (m === 'delivery') { if (!d.line1.trim()) return bad('Please enter your address.', form.elements.line1); if (!/^\d{6}$/.test(d.postal)) return bad('Please enter a 6-digit postal code.', form.elements.postal); }
      else if (!d.outlet) return bad('Please choose an outlet.');
      pay.disabled = true; pay.classList.add('busy');
      try {
        const r = await api('/api/shop/public/checkout', { method: 'POST', body: JSON.stringify({ lines: cart.lines, buyer_name: d.buyer_name, buyer_email: d.buyer_email, buyer_phone: d.buyer_phone, fulfilment: m, outlet: d.outlet, address: m === 'delivery' ? { line1: d.line1, line2: d.line2, postal: d.postal } : null, note: d.note, return_base: location.origin }) });
        try { sessionStorage.setItem('ew-order', r.order_no); } catch {}
        location.href = r.url;
      } catch (err) { out.textContent = err.message; pay.disabled = false; pay.classList.remove('busy'); }
    });
  }

  /* ---------- /checkout/thank-you/ ---------- */
  const thanks = $('[data-co-thanks]');
  if (thanks) {
    const sid = new URLSearchParams(location.search).get('session_id');
    const render = (o) => {
      if (o.status === 'pending') { thanks.innerHTML = '<p class="lede"><span class="spin"></span></p>'; return; }
      if (!['paid', 'ready', 'completed'].includes(o.status)) { thanks.innerHTML = `<p class="lede">Order ${esc(o.order_no)}: ${esc(o.status)}. <a class="link-arrow" href="/cart/">Cart</a></p>`; return; }
      cart.clear();
      const where = o.fulfilment === 'delivery' && o.address ? `<b>Delivery to</b><br>${esc(o.address.line1)}${o.address.line2 ? '<br>' + esc(o.address.line2) : ''}<br>Singapore ${esc(o.address.postal)}` : o.outlet ? `<b>Collect at ${esc(o.outlet.name)}</b><br>${esc(o.outlet.address)}<br>Tel ${esc(o.outlet.phone)}` : '';
      thanks.innerHTML = `<p class="lede">Order <b>${esc(o.order_no)}</b> · receipt sent to <b>${esc(o.buyer_email || '')}</b></p>
        <div class="ty-grid"><div class="ty-lines">${o.lines.map((l) => `<div class="cl"><div class="cl-media"><img src="${esc(l.img)}" alt=""></div><div class="cl-body"><div class="cl-row"><span class="cl-name">${esc(l.title)}</span><span class="cl-size">${esc(l.size || '')}</span></div><span class="cl-brand">${esc(l.brand || '')}</span><div class="cl-row cl-foot"><span class="cl-qty">× ${l.qty}</span><b class="cl-price">${money(l.price * l.qty)}</b></div></div></div>`).join('')}
          <div class="co-sum"><div class="sum-row"><span>Subtotal</span><b>${money(o.subtotal)}</b></div>${o.delivery_fee ? `<div class="sum-row"><span>Delivery</span><b>${money(o.delivery_fee)}</b></div>` : ''}<div class="sum-row sum-total"><span>Total paid</span><b>${money(o.total)}</b></div></div></div>
        <div class="ty-where">${where}</div></div>`;
    };
    if (!sid) thanks.innerHTML = '<p class="lede"><a class="link-arrow" href="/products/">Products</a></p>';
    else (async () => { for (let i = 0; i < 12; i++) { try { const o = await api('/api/shop/public/order?session_id=' + encodeURIComponent(sid)); render(o); if (o.status !== 'pending') return; } catch (e) { thanks.innerHTML = `<p class="lede">${esc(e.message)}</p>`; return; } await new Promise((r) => setTimeout(r, 2500)); } })();
  }
})();
