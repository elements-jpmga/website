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
    const state = { item: null, design: null, items: [], designs: [], terms: '' };
    const itemsBox = $('[data-gift-items]'), form = $('[data-gift-form]'), designBox = $('[data-gift-designs]'), summary = $('[data-gift-summary]'), cardArt = $('[data-gift-card-art]');
    const stages = $$('[data-stage]'), dots = $$('[data-dot]');
    const go = (n) => { stages.forEach((st) => st.classList.toggle('is-on', +st.dataset.stage === n)); dots.forEach((d) => { d.classList.toggle('is-on', +d.dataset.dot === n); d.classList.toggle('is-done', +d.dataset.dot < n); }); shop.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    const sgd = (n) => 'SGD ' + Number(n).toLocaleString('en-SG');
    const termsBox = $('[data-gift-terms]');
    const termsHtml = () => state.terms ? `<details class="gv-item-terms"><summary>Terms &amp; conditions</summary><div>${esc(state.terms).replace(/\r?\n/g, '<br>')}</div></details>` : '';
    // 1 · the voucher list, laid out like the old widget: name, description, terms, Buy
    const renderItems = () => {
      itemsBox.innerHTML = state.items.map((i) => `<article class="gv-item"><h3 class="gv-item-name">${esc(i.name)}</h3>${i.description ? `<p class="gv-item-desc">${esc(i.description).replace(/\r?\n/g, '<br>')}</p>` : ''}${termsHtml()}<button type="button" class="btn gv-buy" data-id="${i.item_id}"><span>Buy ${sgd(i.price)}</span></button></article>`).join('')
        || '<p class="muted">Vouchers are temporarily unavailable online — please call or WhatsApp an outlet.</p>';
      $$('[data-id]', itemsBox).forEach((b) => b.addEventListener('click', () => { state.item = state.items.find((i) => i.item_id === b.dataset.id); $$('[data-gift-chosen]').forEach((c) => { c.innerHTML = `<b>${esc(state.item.name)}</b>${state.item.description ? `<p>${esc(state.item.description)}</p>` : ''}`; }); go(state.designs.length > 1 ? 2 : 3); }));
    };
    // 2 · the card design: the chosen one large, the others as thumbnails; the card at the top of the page follows it
    const setDesign = (d) => { state.design = d; if (!d) return; cardArt.src = API + d.image; cardArt.alt = d.name; cardArt.hidden = false; cardArt.closest('[data-gift-hero-card]')?.classList.add('has-img'); const big = $('.gv-design-big img', designBox); if (big && big.src !== API + d.image) { big.style.opacity = 0; setTimeout(() => { big.src = API + d.image; big.alt = d.name; big.style.opacity = 1; }, 180); } };
    const renderDesigns = () => {
      if (!state.designs.length) { designBox.hidden = true; return; }
      designBox.innerHTML = `<div class="gv-design-big"><img src="${API}${state.designs[0].image}" alt="${esc(state.designs[0].name)}"></div>${state.designs.length > 1 ? `<div class="gv-design-row">${state.designs.map((d, n) => `<label class="gv-design ${n === 0 ? 'on' : ''}"><input type="radio" name="design" value="${d.design_id}" ${n === 0 ? 'checked' : ''}><img src="${API}${d.image}" alt="${esc(d.name)}" loading="lazy"></label>`).join('')}</div>` : ''}`;
      setDesign(state.designs[0]);
      $$('input[name=design]', designBox).forEach((r) => r.addEventListener('change', () => { $$('.gv-design', designBox).forEach((l) => l.classList.toggle('on', l.contains(r))); setDesign(state.designs.find((d) => d.design_id === r.value)); }));
    };
    api('/api/gift/public/catalog').then((c) => { state.items = c.items.sort((a, b) => a.price - b.price); state.designs = c.designs; state.terms = c.terms || ''; renderItems(); renderDesigns(); if (state.terms) { termsBox.hidden = false; $('[data-gift-terms-text]').innerHTML = esc(state.terms).replace(/\r?\n/g, '<br>'); } }).catch(() => { itemsBox.innerHTML = '<p class="muted">We could not load the voucher list. Please refresh, or call or WhatsApp an outlet.</p>'; });

    // 3 · details: email or print, send now or on a date
    const f = () => ({ ...Object.fromEntries(new FormData(form).entries()), buyer_email: $('#gv-be').value.trim() });
    const emailFields = $('[data-gift-email-fields]'), printNote = $('[data-gift-print-note]'), whenSel = $('select[name=when]', form), dateIn = $('input[name=send_at]', form);
    form.addEventListener('change', (e) => {
      if (e.target.name === 'delivery') { const print = e.target.value === 'print'; emailFields.hidden = print; printNote.hidden = !print; }
      if (e.target.name === 'when') { dateIn.hidden = e.target.value !== 'date'; if (!dateIn.hidden) { dateIn.min = new Date(Date.now() + 864e5).toISOString().slice(0, 10); dateIn.focus(); } }
    });
    const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    $$('[data-gift-back]').forEach((b) => b.addEventListener('click', () => { const n = +b.closest('[data-stage]').dataset.stage; go(n === 3 && state.designs.length < 2 ? 1 : n - 1); }));
    $('[data-gift-next="2"]').addEventListener('click', () => go(3));
    $('[data-gift-next="3"]').addEventListener('click', () => {
      const d = f(), out = $('[data-gift-error]'); out.textContent = '';
      if (!d.buyer_name.trim()) { out.textContent = 'Please enter your name.'; return; }
      if (d.delivery === 'email') {
        if (!EMAIL.test(d.recipient_email)) { out.textContent = 'Please enter the email address to send the voucher to.'; return; }
        if (d.when === 'date' && !d.send_at) { out.textContent = 'Please choose the date to send it on.'; return; }
      }
      go(4);
    });
    const renderSummary = () => {
      const d = f(), qty = +d.qty || 1, total = state.item.price * qty, print = d.delivery === 'print';
      summary.innerHTML = `<div class="gv-sum-row"><span>${esc(state.item.name)}${qty > 1 ? ` × ${qty}` : ''}${state.design ? `<small>Design: ${esc(state.design.name)}</small>` : ''}</span><b>${sgd(total)}</b></div>
        ${d.recipient_name ? `<div class="gv-sum-line"><span>Recipient:</span> ${esc(d.recipient_name)}</div>` : ''}<div class="gv-sum-line"><span>Your name:</span> ${esc(d.buyer_name)}</div>
        <div class="gv-sum-row"><span>Shipping<br><small>${print ? 'PDF emailed to you to print' : 'By email: ' + esc(d.recipient_email) + (d.when === 'date' && d.send_at ? ' · on ' + day(d.send_at) : '')}</small></span><b>SGD 0</b></div>
        <div class="gv-sum-total"><span>Total:</span><b>${sgd(total)}</b></div>`;
    };
    $('[data-gift-next="3"]').addEventListener('click', () => { if ($('[data-stage="4"]').classList.contains('is-on')) renderSummary(); });
    $('[data-gift-pay]').addEventListener('click', async () => {
      const b = $('[data-gift-pay]'), out = $('[data-gift-pay-error]'); out.textContent = '';
      const d = f();
      if (!EMAIL.test(d.buyer_email)) { out.textContent = 'Please enter your email address for the receipt.'; $('#gv-be').focus(); return; }
      b.disabled = true; b.classList.add('busy');
      try {
        const r = await api('/api/gift/public/checkout', { method: 'POST', body: JSON.stringify({ item_id: state.item.item_id, design_id: state.design?.design_id || null, qty: +d.qty || 1, buyer_name: d.buyer_name, buyer_email: d.buyer_email, recipient_name: d.recipient_name, recipient_email: d.delivery === 'print' ? d.buyer_email : d.recipient_email, from_name: d.buyer_name, message: d.message, delivery: d.delivery, send_at: d.delivery === 'email' && d.when === 'date' && d.send_at ? new Date(d.send_at + 'T09:00:00+08:00').toISOString() : null, return_base: location.origin }) });
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
