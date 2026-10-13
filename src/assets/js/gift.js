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

  /* ---------- Buy ---------- */
  const shop = $('[data-gift-shop]');
  if (shop) {
    // Occasions: the headline printed on the card, and a starter message. "For myself" sends the voucher to the buyer.
    const OCCASIONS = [
      { id: 'birthday', label: 'Birthday', headline: 'Happy Birthday', hint: 'Wishing you a year of calm, glow and well-deserved rest.' },
      { id: 'thanks', label: 'Thank you', headline: 'Thank You', hint: 'For everything you do — take an hour that is just for you.' },
      { id: 'anniversary', label: 'Anniversary', headline: 'Happy Anniversary', hint: 'To many more years of taking care of each other.' },
      { id: 'congrats', label: 'Congratulations', headline: 'Congratulations', hint: 'You did it — now go and celebrate with some time out.' },
      { id: 'mum', label: "Mother's Day", headline: 'Happy Mother’s Day', hint: 'You look after everyone. Today, let someone look after you.' },
      { id: 'getwell', label: 'Get well', headline: 'Get Well Soon', hint: 'Rest, recover and come back glowing.' },
      { id: 'love', label: 'Just because', headline: 'With Love', hint: 'No reason needed — you deserve a little pampering.' },
      { id: 'self', label: 'For myself', headline: 'Treat Yourself', hint: 'Me time, booked.', self: true },
    ];
    const state = { kind: 'value', item: null, design: null, occasion: OCCASIONS[0], items: [], designs: [] };
    const itemsBox = $('[data-gift-items]'), designBox = $('[data-gift-designs]'), occBox = $('[data-gift-occasions]'), words = $('[data-gift-words]'), form = $('[data-gift-form]'), preview = $('[data-gift-preview]'), side = $('[data-gift-side]'), steps = $$('[data-gift-step]');
    const headIn = $('[name=headline]', words), msgIn = $('[name=message]', words);
    const title = (i) => (i.kind === 'value' ? money(i.value ?? i.price) + ' spa credit' : i.name);

    const renderItems = () => {
      const list = state.items.filter((i) => (state.kind === 'value' ? i.kind === 'value' : i.kind !== 'value')).sort((a, b) => a.price - b.price);
      itemsBox.innerHTML = list.map((i) => i.kind === 'value'
        ? `<button type="button" class="gv-amount ${state.item?.item_id === i.item_id ? 'on' : ''}" data-id="${i.item_id}"><b>${money(i.value ?? i.price)}</b><span>Spa credit · any treatment</span>${i.description ? `<small>${esc(i.description).replace(/\r?\n/g, '<br>')}</small>` : ''}</button>`
        : `<button type="button" class="gv-item ${state.item?.item_id === i.item_id ? 'on' : ''}" data-id="${i.item_id}"><span class="gv-kind">Treatment</span><b>${esc(i.name)}</b>${i.description ? `<small>${esc(i.description).replace(/\r?\n/g, '<br>')}</small>` : ''}<span class="gv-price">${money(i.price)}</span></button>`).join('')
        || `<p class="muted">${state.items.length ? 'No vouchers of this kind are available online right now.' : 'Vouchers are temporarily unavailable online — please call or WhatsApp an outlet.'}</p>`;
      $$('[data-id]', itemsBox).forEach((b) => b.addEventListener('click', () => {
        state.item = state.items.find((i) => i.item_id === b.dataset.id); renderItems(); renderPreview();
        const first = side.hidden; side.hidden = false; steps.forEach((s) => (s.hidden = false));
        if (first) requestAnimationFrame(() => $('#design').scrollIntoView({ behavior: 'smooth', block: 'start' }));
      }));
    };
    const renderTabs = () => $$('[data-gift-tabs] button').forEach((b) => { const on = b.dataset.kind === state.kind; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    $$('[data-gift-tabs] button').forEach((b) => b.addEventListener('click', () => { state.kind = b.dataset.kind; renderTabs(); renderItems(); }));

    const renderOccasions = () => {
      occBox.innerHTML = OCCASIONS.map((o) => `<button type="button" class="gv-chip ${state.occasion.id === o.id ? 'on' : ''}" data-id="${o.id}">${o.label}</button>`).join('');
      $$('.gv-chip', occBox).forEach((b) => b.addEventListener('click', () => { const was = state.occasion; state.occasion = OCCASIONS.find((o) => o.id === b.dataset.id); if (!headIn.value || headIn.value === was.headline) headIn.value = state.occasion.headline; msgIn.placeholder = state.occasion.hint; applySelf(); renderOccasions(); renderPreview(); }));
    };
    const applySelf = () => { // "For myself": no recipient fields, the voucher goes to the buyer's email, no signature line
      const self = !!state.occasion.self; $('[data-gift-recipient]', form).hidden = self; $('[data-gift-from]', form).hidden = self; $('[name=recipient_name]', form).required = !self;
      if (self) { $('[name=recipient_name]', form).value = ''; $('[name=recipient_email]', form).value = ''; $('[name=from_name]', form).value = ''; $('[name=send_when]', form).value = 'now'; $('[data-send-date]', form).hidden = true; }
    };
    const renderDesigns = () => {
      designBox.innerHTML = state.designs.map((d, n) => `<label class="gv-design ${(state.design?.design_id || state.designs[0]?.design_id) === d.design_id ? 'on' : ''}"><input type="radio" name="design" value="${d.design_id}" ${n === 0 ? 'checked' : ''}><img src="${API}${d.image}" alt="${esc(d.name)}" loading="lazy"><span>${esc(d.name)}</span></label>`).join('') || '<p class="muted small">Our classic card will be used.</p>';
      if (!state.design) state.design = state.designs[0] || null;
      $$('input[name=design]', designBox).forEach((r) => r.addEventListener('change', () => { state.design = state.designs.find((d) => d.design_id === r.value); $$('.gv-design', designBox).forEach((l) => l.classList.toggle('on', l.contains(r))); renderPreview(); }));
    };
    const renderPreview = () => {
      const self = !!state.occasion.self;
      const to = self ? ($('[name=buyer_name]', form)?.value.trim() || '') : $('[name=recipient_name]', form)?.value.trim(), from = self ? '' : ($('[name=from_name]', form)?.value.trim() || $('[name=buyer_name]', form)?.value.trim()), msg = msgIn.value.trim(), head = headIn.value.trim() || 'A gift for you';
      preview.innerHTML = `<div class="gv-card"><div class="gv-card-art">${state.design ? `<img src="${API}${state.design.image}" alt="">` : '<div class="gv-card-blank"></div>'}<div class="gv-card-ribbon"><span>Elements Wellness · Gift Voucher</span><b>${esc(head)}</b></div></div><div class="gv-card-body"><small>${state.item?.kind === 'value' ? 'Voucher value' : 'Treatment'}</small><b>${state.item ? esc(state.item.kind === 'value' ? money(state.item.value ?? state.item.price) : state.item.name) : 'Choose a voucher'}</b>${to ? `<span>For <strong>${esc(to)}</strong>${from ? ' · From <strong>' + esc(from) + '</strong>' : ''}</span>` : '<span class="muted">For … · From …</span>'}${msg ? `<em>“${esc(msg)}”</em>` : ''}<code>EWG1-●●●●-●●●● </code></div></div>`;
      const sum = $('[data-gift-total]'); if (sum) sum.textContent = state.item ? money(state.item.price) : '—';
      const line = $('[data-gift-summary]'); if (line) line.textContent = state.item ? `${title(state.item)} · ${state.occasion.label} · ${state.design?.name || 'Classic card'}` : '';
      const btn = $('button[type=submit]', form); if (btn) btn.disabled = !state.item;
      const c = $('[data-gift-count]'); if (c) c.textContent = msgIn.value.length;
    };

    api('/api/gift/public/catalog').then((c) => { state.items = c.items; state.designs = c.designs; if (!state.items.some((i) => i.kind === 'value')) state.kind = 'treatment'; renderTabs(); renderItems(); renderDesigns(); renderPreview(); }).catch(() => { itemsBox.innerHTML = '<p class="muted">We could not load the voucher list. Please refresh, or call or WhatsApp an outlet.</p>'; });
    headIn.value = state.occasion.headline; msgIn.placeholder = state.occasion.hint; renderOccasions(); applySelf();
    words.addEventListener('input', renderPreview); form.addEventListener('input', renderPreview);
    words.addEventListener('submit', (e) => e.preventDefault());
    $('[name=send_when]', form)?.addEventListener('change', (e) => { $('[data-send-date]', form).hidden = e.target.value !== 'later'; });
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); if (!state.item) return itemsBox.scrollIntoView({ behavior: 'smooth' });
      if (!form.checkValidity()) return form.reportValidity();
      const btn = $('button[type=submit]', form), out = $('[data-gift-error]', form); btn.disabled = true; btn.classList.add('busy'); out.textContent = '';
      const f = Object.fromEntries(new FormData(form).entries()), self = !!state.occasion.self;
      try {
        const r = await api('/api/gift/public/checkout', { method: 'POST', body: JSON.stringify({ item_id: state.item.item_id, design_id: state.design?.design_id || null, buyer_name: f.buyer_name, buyer_email: f.buyer_email, buyer_phone: f.buyer_phone, recipient_name: self ? f.buyer_name : f.recipient_name, recipient_email: self ? f.buyer_email : (f.recipient_email || f.buyer_email), from_name: self ? '' : (f.from_name || f.buyer_name), headline: headIn.value.trim(), occasion: state.occasion.id, message: msgIn.value.trim(), send_at: !self && f.send_when === 'later' && f.send_date ? new Date(f.send_date + 'T09:00:00+08:00').toISOString() : null, return_base: location.origin }) });
        location.href = r.url;
      } catch (err) { out.textContent = err.message; btn.disabled = false; btn.classList.remove('busy'); }
    });
    if (new URLSearchParams(location.search).get('cancelled')) { const n = $('[data-gift-notice]'); if (n) { n.hidden = false; n.textContent = 'Your payment was cancelled — nothing has been charged. You can try again whenever you like.'; } }
  }

  /* ---------- Thank-you page ---------- */
  const thanks = $('[data-gift-thanks]');
  if (thanks) {
    const sid = new URLSearchParams(location.search).get('session_id');
    const render = (o) => {
      if (o.status === 'paid') thanks.innerHTML = `<p class="lede">Thank you${o.buyer_name ? ', ' + esc(o.buyer_name) : ''}. Your order <b>${esc(o.order_no)}</b> is confirmed and a receipt has been sent to <b>${esc(o.buyer_email || '')}</b>.</p>
        ${o.vouchers.map((v) => `<div class="gv-done"><div><b>${esc(v.title)}</b><br><span class="muted">${v.recipient_name ? 'For ' + esc(v.recipient_name) + ' · ' : ''}${v.status === 'scheduled' ? 'Will be emailed on ' + day(v.send_at) : v.sent_at ? 'Emailed to ' + esc(v.recipient_email) : 'Being emailed to ' + esc(v.recipient_email)}</span></div><code>${esc(v.code)}</code></div>`).join('')}
        <p class="form-note">Vouchers are valid until ${o.vouchers[0] ? day(o.vouchers[0].expires_at) : 'the date shown on the voucher'} and can be used at ION Orchard, The Centrepoint and 313@somerset. Can't find the email? Check the spam folder, or contact us with your order number.</p>`;
      else if (o.status === 'pending') thanks.innerHTML = '<p class="lede"><span class="spin"></span> Confirming your payment…</p>';
      else thanks.innerHTML = `<p class="lede">This order (${esc(o.order_no)}) was ${esc(o.status)}. Nothing has been charged. <a class="link-arrow" href="/gift-vouchers/">Try again</a></p>`;
    };
    if (!sid) thanks.innerHTML = '<p class="lede">We could not find your order. If you have paid, please contact us with your receipt.</p>';
    else (async () => { for (let i = 0; i < 12; i++) { try { const o = await api('/api/gift/public/order?session_id=' + encodeURIComponent(sid)); render(o); if (o.status !== 'pending') return; } catch (e) { thanks.innerHTML = `<p class="lede">${esc(e.message)}</p>`; return; } await new Promise((r) => setTimeout(r, 2500)); } thanks.innerHTML += '<p class="form-note">Still confirming — your receipt email will arrive once the payment completes.</p>'; })();
  }

  /* ---------- Check a voucher ---------- */
  const check = $('[data-gift-check]');
  if (check) check.addEventListener('submit', async (e) => {
    e.preventDefault(); const out = $('[data-gift-check-out]'); const code = $('input', check).value.trim(); if (!code) return;
    out.innerHTML = '<span class="spin"></span>';
    try { const v = await api('/api/gift/public/check?code=' + encodeURIComponent(code)); const label = { active: 'Valid', scheduled: 'Not yet sent', redeemed: 'Already used', expired: 'Expired', voided: 'Cancelled' }[v.status] || v.status; out.innerHTML = `<div class="gv-check-result ${v.status}"><b>${label}</b> — ${esc(v.title)}${v.value_remaining != null ? ` · balance ${money(v.value_remaining)}` : ''}<br><small>${v.status === 'redeemed' && v.redeemed_at ? 'Used on ' + day(v.redeemed_at) : 'Valid until ' + day(v.expires_at)}</small></div>`; }
    catch (err) { out.innerHTML = `<div class="gv-check-result voided">${esc(err.message)}</div>`; }
  });
})();
