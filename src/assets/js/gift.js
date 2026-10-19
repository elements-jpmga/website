/* Gift vouchers: buy (Stripe Checkout via the Elements staff system), thank-you page, and balance check. */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  const API = document.querySelector('meta[name="ew-gift-api"]')?.content || (local ? 'http://localhost:4400' : 'https://assess.elements.com.sg');
  const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const money = (n) => 'S$' + Number(n).toLocaleString('en-SG', { maximumFractionDigits: 2 });
  const day = (iso) => new Date(iso).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });
  const api = async (path, opts = {}) => { const r = await fetch(API + path, { ...opts, headers: { ...(opts.body ? { 'Content-Type': 'application/json' } : {}), ...(opts.headers || {}) } }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Something went wrong. Please try again.'); return j; };

  /* ---------- Buy: 1 pick a voucher → 2 one short form (+ card design if there are several) → 3 summary and Pay ---------- */
  const shop = $('[data-gift-shop]');
  if (shop) {
    const state = { item: null, design: null, items: [], designs: [] };
    const itemsBox = $('[data-gift-items]'), form = $('[data-gift-form]'), designBox = $('[data-gift-designs]'), chosen = $('[data-gift-chosen]'), summary = $('[data-gift-summary]');
    const stages = $$('[data-stage]'), dots = $$('[data-dot]');
    const go = (n) => { stages.forEach((st) => st.classList.toggle('is-on', +st.dataset.stage === n)); dots.forEach((d) => { d.classList.toggle('is-on', +d.dataset.dot === n); d.classList.toggle('is-done', +d.dataset.dot < n); }); shop.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    const label = (i) => esc(i.name);
    const renderItems = () => {
      itemsBox.innerHTML = state.items.map((i) => `<button type="button" class="gv-pick" data-id="${i.item_id}"><span class="gv-pick-name">${label(i)}</span><span class="gv-pick-price">${money(i.price)}</span>${i.description ? `<span class="gv-pick-desc">${esc(i.description).replace(/\r?\n/g, '<br>')}</span>` : ''}</button>`).join('')
        || '<p class="muted">Vouchers are temporarily unavailable online — please call or WhatsApp an outlet.</p>';
      $$('[data-id]', itemsBox).forEach((b) => b.addEventListener('click', () => { state.item = state.items.find((i) => i.item_id === b.dataset.id); chosen.innerHTML = `<b>${label(state.item)}</b><span>${money(state.item.price)}</span>${state.item.description ? `<p>${esc(state.item.description)}</p>` : ''}`; go(2); }));
    };
    const renderDesigns = () => {
      if (!state.design) state.design = state.designs[0] || null;
      if (state.designs.length < 2) { designBox.hidden = true; return; }
      // the chosen design shows large; the others sit as small thumbnails underneath
      designBox.innerHTML = `<span class="gv-label">Card design</span><div class="gv-design-big"><img src="${API}${state.design.image}" alt="${esc(state.design.name)}"></div><div class="gv-design-row">${state.designs.map((d, n) => `<label class="gv-design ${n === 0 ? 'on' : ''}"><input type="radio" name="design" value="${d.design_id}" ${n === 0 ? 'checked' : ''}><img src="${API}${d.image}" alt="${esc(d.name)}" loading="lazy"></label>`).join('')}</div>`;
      const big = $('.gv-design-big img', designBox);
      $$('input[name=design]', designBox).forEach((r) => r.addEventListener('change', () => { state.design = state.designs.find((d) => d.design_id === r.value); $$('.gv-design', designBox).forEach((l) => l.classList.toggle('on', l.contains(r))); big.style.opacity = 0; setTimeout(() => { big.src = API + state.design.image; big.alt = state.design.name; big.style.opacity = 1; }, 180); }));
    };
    api('/api/gift/public/catalog').then((c) => { state.items = c.items.sort((a, b) => a.price - b.price); state.designs = c.designs; renderItems(); renderDesigns(); }).catch(() => { itemsBox.innerHTML = '<p class="muted">We could not load the voucher list. Please refresh, or call or WhatsApp an outlet.</p>'; });
    const f = () => Object.fromEntries(new FormData(form).entries());
    $$('[data-gift-back]').forEach((b) => b.addEventListener('click', () => go(b.closest('[data-stage]').dataset.stage === '3' ? 2 : 1)));
    $('[data-gift-next]').addEventListener('click', () => {
      const d = f(), out = $('[data-gift-error]'); out.textContent = '';
      if (!d.buyer_name.trim()) { out.textContent = 'Please enter your name.'; return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.buyer_email)) { out.textContent = 'Please enter a valid email address.'; return; }
      if (d.recipient_email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.recipient_email)) { out.textContent = 'Please enter a valid recipient email.'; return; }
      const to = d.recipient_email || d.buyer_email;
      summary.innerHTML = `<div class="gv-sum-row"><span>${label(state.item)}</span><b>SGD ${Number(state.item.price).toLocaleString('en-SG')}</b></div>
        ${d.recipient_name ? `<div class="gv-sum-line"><span>Recipient:</span> ${esc(d.recipient_name)}</div>` : ''}<div class="gv-sum-line"><span>Your name:</span> ${esc(d.buyer_name)}</div>
        <div class="gv-sum-row"><span>Shipping<br><small>By email: ${esc(to)}</small></span><b>SGD 0</b></div>
        <div class="gv-sum-total"><span>Total:</span><b>SGD ${Number(state.item.price).toLocaleString('en-SG')}</b></div>`;
      go(3);
    });
    $('[data-gift-pay]').addEventListener('click', async () => {
      const b = $('[data-gift-pay]'), out = $('[data-gift-pay-error]'); b.disabled = true; b.classList.add('busy'); out.textContent = '';
      const d = f();
      try {
        const r = await api('/api/gift/public/checkout', { method: 'POST', body: JSON.stringify({ item_id: state.item.item_id, design_id: state.design?.design_id || null, buyer_name: d.buyer_name, buyer_email: d.buyer_email, recipient_name: d.recipient_name, recipient_email: d.recipient_email || d.buyer_email, from_name: d.buyer_name, message: d.message, return_base: location.origin }) });
        location.href = r.url;
      } catch (err) { out.textContent = err.message; b.disabled = false; b.classList.remove('busy'); }
    });
    if (new URLSearchParams(location.search).get('cancelled')) { const n = $('[data-gift-notice]'); if (n) { n.hidden = false; n.textContent = 'Your payment was cancelled — nothing has been charged.'; } }
  }

  /* ---------- Thank-you page ---------- */
  const thanks = $('[data-gift-thanks]');
  if (thanks) {
    const sid = new URLSearchParams(location.search).get('session_id');
    const render = (o) => {
      if (o.status === 'paid') thanks.innerHTML = `<p class="lede">Order <b>${esc(o.order_no)}</b> · receipt sent to <b>${esc(o.buyer_email || '')}</b></p>
        ${o.vouchers.map((v) => `<div class="gv-done"><div><b>${esc(v.title)}</b><br><span class="muted">${v.recipient_name ? 'For ' + esc(v.recipient_name) + ' · ' : ''}${v.status === 'scheduled' ? 'Will be emailed on ' + day(v.send_at) : v.sent_at ? 'Emailed to ' + esc(v.recipient_email) : 'Being emailed to ' + esc(v.recipient_email)}</span></div><code>${esc(v.code)}</code></div>`).join('')}
        <p class="form-note">Valid until ${o.vouchers[0] ? day(o.vouchers[0].expires_at) : ''}</p>`;
      else if (o.status === 'pending') thanks.innerHTML = '<p class="lede"><span class="spin"></span></p>';
      else thanks.innerHTML = `<p class="lede">Order ${esc(o.order_no)}: ${esc(o.status)}. <a class="link-arrow" href="/gift-vouchers/">Gift Vouchers</a></p>`;
    };
    if (!sid) thanks.innerHTML = '<p class="lede"><a class="link-arrow" href="/gift-vouchers/">Gift Vouchers</a></p>';
    else (async () => { for (let i = 0; i < 12; i++) { try { const o = await api('/api/gift/public/order?session_id=' + encodeURIComponent(sid)); render(o); if (o.status !== 'pending') return; } catch (e) { thanks.innerHTML = `<p class="lede">${esc(e.message)}</p>`; return; } await new Promise((r) => setTimeout(r, 2500)); } })();
  }

})();
