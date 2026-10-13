/* Elements gift vouchers — staff screens (loaded after app.js, uses its helpers). */
const initGift = () => {
  const { $, $$, app, esc, fmtDate, fmtDay, ago, ava, api, toast, route, go, crumbs, ICON, staff } = window.RestoreApp;
  const money = (n) => 'S$' + Number(n || 0).toLocaleString('en-SG', { maximumFractionDigits: 2 });
  const pill = (s) => `<span class="status ${esc(s)}">${esc(s)}</span>`;
  const OUTLETS = ['ION Orchard', 'The Centrepoint', '313@somerset'];
  const STATUSES = ['active', 'scheduled', 'redeemed', 'expired', 'voided'];
  const worth = (v) => (v.value_initial != null ? money(v.value_initial) : v.title);
  const section = (k) => $$('[data-gift]').forEach((a) => a.classList.toggle('on', a.dataset.gift === k));
  const head = (title, right = '', trail = [], crumb = null) => `${crumbs([['Gift vouchers', '/gift'], ...trail, [crumb ?? title.replace(/<[^>]+>/g, '')]])}<div class="page-head"><h1>${title}</h1><div class="btn-row">${right}</div></div>`;
  const alertBars = (alerts) => alerts.map((a) => `<div class="alert-bar ${a.level}"><b>${a.level === 'out' ? 'No codes left' : 'Running low'}:</b> ${esc(a.name)} — ${a.remaining} code${a.remaining === 1 ? '' : 's'} left${a.level === 'out' ? '. Customers cannot buy it until new WESS codes are imported.' : '.'}<a class="btn sm" href="#/gift/codes/${a.item_id}">Import codes</a></div>`).join('');
  async function refreshAlertBadge() { try { const a = await api('GET', '/api/gift/alerts'); $('[data-gift-alert]').textContent = a.length ? a.length : ''; } catch {} }
  const modal = (html) => { const m = document.createElement('div'); m.className = 'modal-bg'; m.innerHTML = `<div class="modal new-modal" role="dialog" aria-modal="true">${html}</div>`; document.body.appendChild(m); const close = () => m.remove(); m.addEventListener('click', (e) => e.target === m && close()); $$('[data-cancel]', m).forEach((b) => b.addEventListener('click', close)); return { m, close }; };
  const designPicker = (designs, chosen) => designs.length ? `<div class="design-pick">${designs.map((d, i) => `<label><input type="radio" name="design" value="${d.design_id}" ${chosen ? chosen === d.design_id : i === 0 ? 'checked' : ''}><img src="/api/gift/designs/${d.design_id}/image" alt=""><small>${esc(d.name)}</small></label>`).join('')}</div>` : '<p class="small muted">No card designs yet — <a class="link" href="#/gift/designs">add one</a>.</p>';

  /* ---------------- Dashboard ---------------- */
  route(/^\/gift$/, async () => {
    section('dash');
    const s = await api('GET', '/api/gift/summary');
    const diff = s.lastMonth.revenue ? Math.round(((s.thisMonth.revenue - s.lastMonth.revenue) / s.lastMonth.revenue) * 100) : null;
    app.innerHTML = `${head('Gift vouchers', `<a class="btn ghost" href="#/gift/orders">All orders</a><a class="btn" href="#/gift/issue">${ICON.plus}Issue a voucher</a>`)}
      ${alertBars(s.alerts)}
      ${s.mail === 'outbox' ? '<div class="warn-box" style="margin-bottom:12px">Email is not set up on this server — vouchers are saved to the outbox instead of being sent.</div>' : ''}
      ${!s.stripe ? '<div class="warn-box" style="margin-bottom:12px">Online payment is off — the website shows vouchers but cannot take payment until the Stripe keys are added on the server.</div>' : s.stripe === 'test' ? '<div class="warn-box" style="margin-bottom:12px">Stripe is in <b>test mode</b>: website payments are not real.</div>' : ''}
      <div class="kpis">
        <div class="kpi ${diff > 0 ? 'up' : ''}"><span>Sales this month</span><b>${money(s.thisMonth.revenue)}</b><small>${s.thisMonth.orders} order${s.thisMonth.orders === 1 ? '' : 's'}${diff != null ? ` · ${diff >= 0 ? '+' : ''}${diff}% vs last month` : ''}</small></div>
        <div class="kpi"><span>Outstanding (unused)</span><b>${money(s.outstanding.value)}</b><small>${s.outstanding.vouchers} active · ${s.outstanding.units} treatment voucher${s.outstanding.units === 1 ? '' : 's'}</small></div>
        <div class="kpi"><span>Redeemed, last 30 days</span><b>${s.redeemed30}</b><small>marked by staff</small></div>
        <div class="kpi"><span>All-time sales</span><b>${money(s.allTime.revenue)}</b><small>${s.allTime.orders} orders since ${s.allTime.since ? fmtDay(s.allTime.since) : '—'}${s.expiring30 ? ` · ${s.expiring30} expiring in 30 days` : ''}</small></div>
      </div>
      <div class="grid grid-side">
        <div>
          <div class="panel"><div class="panel-head"><h2>Find a voucher</h2></div><p class="small muted">Type or scan the code on the customer's voucher, then mark it redeemed.</p>
            <form class="lookup" id="lk"><input id="lk-code" placeholder="e.g. EWG1-200GIFT-0082 (C01241-8)" autocomplete="off" autofocus><button class="btn" type="submit">Find</button></form><div id="lk-out" style="margin-top:12px"></div></div>
          <div class="panel"><div class="panel-head"><h2>WESS code pools</h2><a class="link small" href="#/gift/codes">Manage</a></div>
            ${s.codes.map((c) => { const lvl = c.available === 0 ? 'out' : c.available <= c.low_stock_threshold ? 'low' : ''; const pct = Math.min(100, Math.round((c.available / Math.max(c.low_stock_threshold * 5, 1)) * 100)); return `<div class="pool ${lvl}"><span>${esc(c.name)}</span><div class="bar"><i style="width:${pct}%"></i></div><span class="n">${c.available} left</span><a class="btn ghost sm" href="#/gift/codes/${c.item_id}">Import</a></div>`; }).join('') || '<p class="small muted">No items yet — <a class="link" href="#/gift/items">add items</a> or <a class="link" href="#/gift/settings">import from Gift Up</a>.</p>'}
          </div>
        </div>
        <div class="panel"><div class="panel-head"><h2>Recent activity</h2></div>${s.recent.length ? `<ul class="timeline">${s.recent.map((e) => `<li class="${/fail|no_code|void/.test(e.type) ? 'bad' : /redeem|sent|imported/.test(e.type) ? 'ok' : ''}">${evText(e)}<small>${ago(e.at)}${e.staff ? ' · ' + esc(e.staff) : ''}</small></li>`).join('')}</ul>` : '<p class="small muted">Nothing yet.</p>'}</div>
      </div>`;
    $('#lk').addEventListener('submit', (e) => { e.preventDefault(); lookup($('#lk-code').value, $('#lk-out')); });
  });
  const evText = (e) => {
    const v = e.code ? `<a class="link" href="#/gift/voucher/${e.voucher_id}">${esc(e.title || 'voucher')}</a> <span class="code muted">${esc(e.code)}</span>` : '';
    const d = e.detail || {};
    return { created: `Issued ${v}`, sent: `Sent ${v} to ${esc(d.to || '')}`, resent: `Resent ${v}`, redeemed: `Redeemed ${v} at ${esc(d.outlet || '')}`, voided: `Voided ${v} — ${esc(d.reason || '')}`, extended: `Extended ${v}`, send_failed: `Email failed for ${v}: ${esc(d.error || '')}`, codes_imported: `Imported ${d.imported} codes for ${esc(d.item || '')}${d.duplicates ? ` (${d.duplicates} duplicates skipped)` : ''}`, no_code: `No code left for ${esc(d.item || '')}`, order_created: `New ${esc(d.source || '')} order · ${money(d.total)}`, receipt_sent: `Receipt emailed to ${esc(d.to || '')}`, reminder_sent: `Expiry reminder sent for ${v}`, giftup_import: `Imported from Gift Up: ${d.vouchers} vouchers, ${d.codes} codes`, recipient_changed: `Recipient changed for ${v}`, unredeemed: `Redemption undone for ${v}` }[e.type] || `${esc(e.type)} ${v}`;
  };
  async function lookup(code, out) {
    out.innerHTML = '<span class="spin"></span>';
    try { const v = await api('GET', '/api/gift/lookup?code=' + encodeURIComponent(code.trim())); out.innerHTML = voucherCard(v); bindRedeem(out, v); }
    catch (e) { out.innerHTML = `<div class="bad-box">${esc(e.message)}</div>`; }
  }
  const voucherCard = (v) => `<div class="panel" style="margin:0;background:var(--hover)"><div style="display:flex;justify-content:space-between;gap:10px;align-items:start"><div><b>${esc(v.title)}</b> ${pill(v.status)}<br><span class="code">${esc(v.code)}</span><br><span class="small muted">${v.recipient_name ? 'For ' + esc(v.recipient_name) + ' · ' : ''}Valid until ${fmtDay(v.expires_at)}${v.status === 'redeemed' ? ` · redeemed ${fmtDay(v.redeemed_at)} at ${esc(v.redeemed_outlet || '—')}` : ''}</span></div><a class="btn ghost sm" href="#/gift/voucher/${v.voucher_id}">Open</a></div>
    ${v.status === 'active' ? `<div class="btn-row" style="margin-top:12px;align-items:center"><select data-outlet>${OUTLETS.map((o) => `<option>${o}</option>`).join('')}</select><button class="btn" data-redeem>Mark redeemed</button></div>` : ''}</div>`;
  function bindRedeem(root, v) {
    const b = $('[data-redeem]', root); if (!b) return;
    b.addEventListener('click', async () => { if (!confirm(`Mark ${v.code} as redeemed at ${$('[data-outlet]', root).value}? The whole voucher is used in one go.`)) return; b.disabled = true; try { const r = await api('POST', `/api/gift/vouchers/${v.voucher_id}/redeem`, { outlet: $('[data-outlet]', root).value }); toast('Marked redeemed'); root.innerHTML = voucherCard(r); } catch (e) { b.disabled = false; toast(e.message, true); } });
  }

  /* ---------------- Orders & vouchers ---------------- */
  route(/^\/gift\/orders$/, async () => {
    section('orders');
    const items = await api('GET', '/api/gift/items?all=1');
    const q = new URLSearchParams(location.hash.split('?')[1] || '');
    app.innerHTML = `${head('Orders & vouchers', `<a class="btn ghost" href="/api/gift/export.csv" target="_blank">Export CSV</a><a class="btn" href="#/gift/issue">${ICON.plus}Issue a voucher</a>`)}
      <div class="panel" style="padding:14px 14px 6px"><div class="form"><div class="row" style="grid-template-columns:2fr 1fr 1fr 1fr">
        <div class="field"><input id="f-q" placeholder="Search code, name, email or order no…" autocomplete="off" value="${esc(q.get('q') || '')}"></div>
        <div class="field"><select id="f-status"><option value="">Any status</option>${STATUSES.map((s) => `<option ${q.get('status') === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
        <div class="field"><select id="f-item"><option value="">Any item</option>${items.map((i) => `<option value="${i.item_id}">${esc(i.name)}</option>`).join('')}</select></div>
        <div class="field"><select id="f-source"><option value="">Any source</option><option value="website">Website</option><option value="staff">Issued by staff</option><option value="giftup">Gift Up (imported)</option></select></div></div></div>
        <div id="vlist" style="margin-top:8px"></div></div>`;
    let t; const load = async () => {
      const p = new URLSearchParams({ q: $('#f-q').value.trim(), status: $('#f-status').value, item_id: $('#f-item').value, source: $('#f-source').value, limit: 200 });
      const list = await api('GET', '/api/gift/vouchers?' + p);
      $('#vlist').innerHTML = list.length ? `<table class="table"><thead><tr><th>Ordered</th><th>Status</th><th>Code</th><th>Item</th><th>Buyer</th><th>Recipient</th><th>Delivery</th></tr></thead><tbody>${list.map((v) => `<tr class="row" data-go="/gift/voucher/${v.voucher_id}"><td>${fmtDay(v.created_at)}<br><span class="small muted">${esc(v.order_no)}</span></td><td>${pill(v.status)}</td><td class="code">${esc(v.code)}</td><td>${esc(v.title)}</td><td>${esc(v.buyer_name || '—')}<br><span class="small muted">${esc(v.buyer_email || '')}</span></td><td>${esc(v.recipient_name || '—')}<br><span class="small muted">${esc(v.recipient_email || '')}</span></td><td class="small">${v.status === 'scheduled' ? 'Sends ' + fmtDay(v.send_at) : v.sent_at ? '<span style="color:#178a4a">● Sent</span> ' + fmtDay(v.sent_at) : v.delivery === 'print' ? 'Print' : '<span class="muted">Not sent</span>'}</td></tr>`).join('')}</tbody></table>${list.length === 200 ? '<p class="small muted" style="padding:10px">Showing the latest 200 — narrow the search to see more.</p>' : ''}` : '<div class="empty">No vouchers match.</div>';
      $$('#vlist [data-go]').forEach((el) => el.addEventListener('click', () => go(el.dataset.go)));
    };
    ['#f-q', '#f-status', '#f-item', '#f-source'].forEach((s) => $(s).addEventListener('input', () => { clearTimeout(t); t = setTimeout(load, 200); }));
    load();
  });

  /* ---------------- Voucher detail ---------------- */
  route(/^\/gift\/voucher\/([^/]+)$/, async (id) => {
    section('orders');
    const v = await api('GET', `/api/gift/vouchers/${id}`);
    const can = { resend: v.status !== 'voided' && v.delivery === 'email', redeem: v.status === 'active', extend: ['active', 'expired'].includes(v.status), void: v.status !== 'voided', unredeem: v.status === 'redeemed' };
    app.innerHTML = `${head(`${esc(v.title)} ${pill(v.status)}`, `<a class="btn ghost" href="/api/gift/vouchers/${id}/pdf" target="_blank">Download PDF</a>${can.resend ? '<button class="btn" id="resend">Resend email</button>' : ''}`, [['Orders & vouchers', '/gift/orders']], v.code)}
      <div class="grid grid-side">
        <div>
          <div class="panel"><div class="panel-head"><h2>Voucher</h2><span class="code">${esc(v.code)}</span></div><iframe class="voucher-frame" src="/api/gift/vouchers/${id}/preview.html" title="Voucher preview"></iframe></div>
          <div class="panel"><h2>Actions</h2><div class="btn-row" style="flex-wrap:wrap;gap:8px">
            ${can.redeem ? `<select id="a-outlet">${OUTLETS.map((o) => `<option>${o}</option>`).join('')}</select><button class="btn" id="a-redeem">Mark redeemed</button>` : ''}
            ${can.unredeem ? '<button class="btn ghost" id="a-unredeem">Undo redemption</button>' : ''}
            <button class="btn ghost" id="a-recipient">Change recipient</button>
            ${can.extend ? '<button class="btn ghost" id="a-extend">Extend expiry</button>' : ''}
            ${can.void ? '<button class="btn ghost" id="a-void" style="color:#9b1c1c">Void</button>' : ''}
          </div><p class="small muted" style="margin:10px 0 0">No partial use: redeeming uses the whole voucher. Every action is recorded below with your name.</p></div>
        </div>
        <div>
          <div class="panel"><h2>Details</h2><div class="kv-grid">
            <span>Worth</span><span><b>${esc(worth(v))}</b></span><span>Valid</span><span>${fmtDay(v.valid_from)} → <b>${fmtDay(v.expires_at)}</b></span>
            <span>Recipient</span><span>${esc(v.recipient_name || '—')}<br><span class="muted">${esc(v.recipient_email || '')}</span></span><span>From</span><span>${esc(v.from_name || '—')}</span>
            <span>Message</span><span>${v.message ? '“' + esc(v.message) + '”' : '—'}</span><span>Delivery</span><span>${v.delivery === 'print' ? 'Print' : v.status === 'scheduled' ? 'Email · sends ' + fmtDate(v.send_at) : v.sent_at ? 'Emailed ' + fmtDate(v.sent_at) : 'Email · not sent yet'}</span>
            ${v.status === 'redeemed' ? `<span>Redeemed</span><span>${fmtDate(v.redeemed_at)} at ${esc(v.redeemed_outlet || '—')} by ${esc(v.redeemed_by || '—')}</span>` : ''}${v.status === 'voided' ? `<span>Voided</span><span>${fmtDate(v.voided_at)} by ${esc(v.voided_by || '—')} — ${esc(v.void_reason || '')}</span>` : ''}
            <span>Design</span><span>${esc(v.design_name || '—')}</span></div></div>
          <div class="panel"><h2>Order ${esc(v.order_no)} ${pill(v.order_status)}</h2><div class="kv-grid"><span>Buyer</span><span>${esc(v.buyer_name || '—')}<br><span class="muted">${esc(v.buyer_email || '')}${v.buyer_phone ? ' · ' + esc(v.buyer_phone) : ''}</span></span><span>Source</span><span>${esc(v.source)}</span><span>Total</span><span>${money(v.order_total)}${v.paid_at ? ' · paid ' + fmtDay(v.paid_at) : ''}</span></div>
            ${v.siblings.length ? `<p class="small muted" style="margin:10px 0 4px">Also in this order</p>${v.siblings.map((s) => `<a class="link small" href="#/gift/voucher/${s.voucher_id}">${esc(s.title)} · ${esc(s.code)} ${pill(s.status)}</a><br>`).join('')}` : ''}</div>
          <div class="panel"><h2>History</h2><ul class="timeline">${v.events.map((e) => `<li class="${/fail|no_code|void/.test(e.type) ? 'bad' : /redeem|sent/.test(e.type) ? 'ok' : e.type === 'expired' ? 'warn' : ''}">${evText({ ...e, code: null })}<small>${fmtDate(e.at)}${e.staff ? ' · ' + esc(e.staff) : ''}${e.detail?.source === 'giftup' ? ' · Gift Up' : ''}</small></li>`).join('')}</ul></div>
        </div></div>`;
    const act = async (fn, msg) => { try { await fn(); toast(msg); window.RestoreApp.render(); } catch (e) { toast(e.message, true); } };
    $('#resend')?.addEventListener('click', () => { if (!v.recipient_email) return toast('Add a recipient email first (Change recipient)', true); if (confirm(`Resend the voucher to ${v.recipient_email}?`)) act(() => api('POST', `/api/gift/vouchers/${id}/resend`, {}), 'Voucher resent'); });
    $('#a-redeem')?.addEventListener('click', () => confirm(`Mark ${v.code} as redeemed at ${$('#a-outlet').value}?`) && act(() => api('POST', `/api/gift/vouchers/${id}/redeem`, { outlet: $('#a-outlet').value }), 'Marked redeemed'));
    $('#a-unredeem')?.addEventListener('click', () => { const reason = prompt('Why is the redemption being undone?'); if (reason) act(() => api('POST', `/api/gift/vouchers/${id}/unredeem`, { reason }), 'Redemption undone'); });
    $('#a-void')?.addEventListener('click', () => { const reason = prompt('Reason for voiding (recorded):'); if (reason) act(() => api('POST', `/api/gift/vouchers/${id}/void`, { reason }), 'Voucher voided'); });
    $('#a-extend')?.addEventListener('click', () => { const { m, close } = modal(`<h2>Extend expiry</h2><form class="form"><p class="small muted">Currently valid until <b>${fmtDay(v.expires_at)}</b>.</p><div class="row"><div class="field"><label>Extend by</label><select id="x-m">${[1, 2, 3, 6, 12].map((n) => `<option value="${n}" ${n === 3 ? 'selected' : ''}>${n} month${n > 1 ? 's' : ''}</option>`).join('')}</select></div><div class="field"><label>Reason</label><input id="x-r" placeholder="e.g. customer was overseas"></div></div><div class="btn-row"><button class="btn" type="submit">Extend</button><button class="btn ghost" type="button" data-cancel>Cancel</button></div></form>`); $('form', m).addEventListener('submit', (e) => { e.preventDefault(); close(); act(() => api('POST', `/api/gift/vouchers/${id}/extend`, { months: +$('#x-m', m).value, reason: $('#x-r', m).value }), 'Expiry extended'); }); });
    $('#a-recipient').addEventListener('click', () => { const { m, close } = modal(`<h2>Change recipient</h2><form class="form"><div class="row"><div class="field"><label>Recipient name</label><input id="r-n" value="${esc(v.recipient_name || '')}"></div><div class="field"><label>Recipient email</label><input id="r-e" type="email" value="${esc(v.recipient_email || '')}"></div></div><div class="field"><label>From</label><input id="r-f" value="${esc(v.from_name || '')}"></div><div class="field"><label>Message</label><textarea id="r-m">${esc(v.message || '')}</textarea></div><label class="check"><input type="checkbox" id="r-send" ${v.status === 'active' ? 'checked' : ''}><span>Email the voucher to the new address now</span></label><div class="btn-row"><button class="btn" type="submit">Save</button><button class="btn ghost" type="button" data-cancel>Cancel</button></div></form>`); $('form', m).addEventListener('submit', (e) => { e.preventDefault(); close(); act(async () => { await api('PUT', `/api/gift/vouchers/${id}/recipient`, { recipient_name: $('#r-n', m).value.trim(), recipient_email: $('#r-e', m).value.trim(), from_name: $('#r-f', m).value.trim(), message: $('#r-m', m).value.trim() }); if ($('#r-send', m).checked && $('#r-e', m).value.trim()) await api('POST', `/api/gift/vouchers/${id}/resend`, {}); }, 'Recipient updated'); }); });
  });

  /* ---------------- Issue a voucher (counter / complimentary) ---------------- */
  route(/^\/gift\/issue$/, async () => {
    section('issue');
    const [items, designs] = await Promise.all([api('GET', '/api/gift/items'), api('GET', '/api/gift/designs')]);
    const sellable = items.filter((i) => i.codes_available > 0);
    app.innerHTML = `${head('Issue a voucher', '', [])}
      <div class="grid grid-side"><form class="panel form" id="iss">
        <h2>What</h2><div class="field"><label>Item <span class="req">*</span></label><select id="i-item" required><option value="">Choose…</option>${items.map((i) => `<option value="${i.item_id}" ${i.codes_available ? '' : 'disabled'}>${esc(i.name)} — ${money(i.price)}${i.codes_available ? ` (${i.codes_available} codes)` : ' — NO CODES LEFT'}</option>`).join('')}</select></div>
        ${sellable.length ? '' : '<div class="warn-box">No item has codes left — <a class="link" href="#/gift/codes">import WESS codes</a> first.</div>'}
        <div class="field"><label>Card design</label>${designPicker(designs)}</div>
        <h2 style="margin-top:8px">Who</h2>
        <div class="row"><div class="field"><label>Recipient name</label><input id="i-rn" placeholder="Who receives the gift"></div><div class="field"><label>Recipient email</label><input id="i-re" type="email" placeholder="Where to send the voucher"></div></div>
        <div class="row"><div class="field"><label>From (shown on the voucher)</label><input id="i-from" placeholder="Buyer's name"></div><div class="field"><label>Send</label><select id="i-del"><option value="email">Email now</option><option value="later">Email on a date…</option><option value="print">Print only (no email)</option></select></div></div>
        <div class="field" id="i-when-wrap" hidden><label>Send on</label><input id="i-when" type="datetime-local"></div>
        <div class="field"><label>Personal message</label><textarea id="i-msg" maxlength="240" placeholder="Printed on the voucher (optional)"></textarea></div>
        <h2 style="margin-top:8px">Payment</h2>
        <div class="row"><div class="field"><label>Paid how <span class="req">*</span></label><select id="i-pay"><option value="counter">Paid at the counter (WESS)</option><option value="complimentary">Complimentary</option><option value="other">Other</option></select></div><div class="field"><label>Buyer email (receipt)</label><input id="i-be" type="email" placeholder="optional"></div></div>
        <div class="field"><label>Notes (internal)</label><input id="i-notes" placeholder="e.g. WESS receipt no."></div>
        <div class="btn-row"><button class="btn" type="submit" ${sellable.length ? '' : 'disabled'}>Issue voucher →</button></div><div id="i-err"></div>
      </form>
      <div class="panel"><h2>How it works</h2><ol class="comps-list"><li>The next unused WESS code for the item is attached to this voucher.</li><li>The e-voucher PDF is created with the chosen card design.</li><li>It is emailed to the recipient (now or on the date), the buyer gets a receipt, and the Elements notification email goes out.</li><li>At the appointment, find the code here and mark it redeemed — then redeem it in WESS as usual.</li></ol></div></div>`;
    $('#i-del').addEventListener('change', () => { $('#i-when-wrap').hidden = $('#i-del').value !== 'later'; });
    $('#iss').addEventListener('submit', async (e) => {
      e.preventDefault(); const b = $('button[type=submit]', e.target); b.disabled = true; $('#i-err').innerHTML = '<span class="spin"></span> Issuing…';
      const del = $('#i-del').value;
      try {
        const r = await api('POST', '/api/gift/issue', { item_id: $('#i-item').value, design_id: $('input[name=design]:checked')?.value || null, recipient_name: $('#i-rn').value, recipient_email: $('#i-re').value, from_name: $('#i-from').value, message: $('#i-msg').value, delivery: del === 'print' ? 'print' : 'email', send_at: del === 'later' && $('#i-when').value ? new Date($('#i-when').value).toISOString() : null, payment: $('#i-pay').value, buyer_name: $('#i-from').value, buyer_email: $('#i-be').value, notes: $('#i-notes').value });
        toast(`Issued ${r.voucher.code}`); go(`/gift/voucher/${r.voucher.voucher_id}`);
      } catch (err) { b.disabled = false; $('#i-err').innerHTML = `<div class="bad-box">${esc(err.message)}</div>`; }
    });
  });

  /* ---------------- WESS code pools ---------------- */
  route(/^\/gift\/codes$/, async () => {
    section('codes');
    const stats = await api('GET', '/api/gift/codes');
    app.innerHTML = `${head('WESS codes')}<div class="panel"><p class="small muted">Each item has its own pool of running numbers generated in WESS. A sale takes the oldest unused code. When a pool reaches its alert level you get a banner here and an email.</p>
      ${stats.map((c) => { const lvl = c.available === 0 ? 'out' : c.available <= c.low_stock_threshold ? 'low' : ''; return `<div class="pool ${lvl}"><span><b>${esc(c.name)}</b><br><span class="small muted">${c.assigned} used · alert at ${c.low_stock_threshold}</span></span><div class="bar"><i style="width:${Math.min(100, Math.round((c.available / Math.max(c.low_stock_threshold * 5, 1)) * 100))}%"></i></div><span class="n">${c.available} left</span><a class="btn sm" href="#/gift/codes/${c.item_id}">Import</a></div>`; }).join('') || '<div class="empty">No active items.</div>'}</div>`;
  });
  route(/^\/gift\/codes\/([^/]+)$/, async (item_id) => {
    section('codes');
    const d = await api('GET', `/api/gift/codes/${item_id}`);
    const avail = d.codes.filter((c) => c.status === 'available');
    app.innerHTML = `${head(esc(d.item.name), '', [['WESS codes', '/gift/codes']])}
      <div class="grid grid-side"><div>
        <div class="panel form"><h2>Import codes</h2><p class="small muted">Generate the next running numbers in WESS, then paste them here — one per line, exactly as WESS prints them, e.g. <code>${esc(d.item.code_prefix || 'EWG1-100GIFT')}-0101 (${esc(d.item.wess_item_code || 'C01240-8')})</code>. Codes already in the system are skipped, never overwritten.</p>
          <textarea class="codes" id="c-text" placeholder="${esc(d.item.code_prefix || 'PREFIX')}-0101 (${esc(d.item.wess_item_code || 'C0xxxx-8')})&#10;${esc(d.item.code_prefix || 'PREFIX')}-0102 (${esc(d.item.wess_item_code || 'C0xxxx-8')})&#10;…"></textarea>
          <div class="row"><div class="field"><label>Or upload a file (CSV / TXT from WESS)</label><input type="file" id="c-file" accept=".csv,.txt,text/plain,text/csv"></div><div class="field"><label>Note</label><input id="c-note" placeholder="e.g. WESS batch 13 Oct"></div></div>
          <div class="btn-row"><button class="btn" id="c-go">Import codes</button><span class="small muted" id="c-count"></span></div><div id="c-out" style="margin-top:10px"></div></div>
        <div class="panel"><h2>Codes (${d.codes.length})</h2><table class="table"><thead><tr><th>Code</th><th>Status</th><th>Voucher</th></tr></thead><tbody>${d.codes.slice(0, 400).map((c) => `<tr><td class="code">${esc(c.code)}</td><td>${c.status === 'available' ? '<span class="status active">available</span>' : '<span class="status redeemed">used</span>'}</td><td class="small">${c.voucher_id ? `<a class="link" href="#/gift/voucher/${c.voucher_id}">${esc(c.recipient_name || 'voucher')}</a> ${c.voucher_status ? pill(c.voucher_status) : ''}` : '—'}</td></tr>`).join('')}</tbody></table>${d.codes.length > 400 ? '<p class="small muted">Showing 400.</p>' : ''}</div>
      </div><div>
        <div class="kpi ${avail.length === 0 ? '' : ''}"><span>Available now</span><b style="color:${avail.length === 0 ? '#c0262c' : avail.length <= d.item.low_stock_threshold ? '#b25b00' : 'inherit'}">${avail.length}</b><small>alert level ${d.item.low_stock_threshold} · <a class="link" href="#/gift/items">change</a></small></div>
        <div class="panel" style="margin-top:12px"><h2>Batches</h2>${d.batches.length ? d.batches.map((b) => `<div class="small" style="padding:8px 0;border-bottom:1px solid var(--line)"><b>${b.count} codes</b> · ${fmtDate(b.imported_at)}<br><span class="muted">${esc(b.imported_by || '')}${b.note ? ' · ' + esc(b.note) : ''}</span></div>`).join('') : '<p class="small muted">No imports yet.</p>'}</div></div></div>`;
    const parse = (t) => t.split(/\r?\n|,|;|\t/).map((s) => s.trim()).filter(Boolean);
    const count = () => { $('#c-count').textContent = parse($('#c-text').value).length + ' code(s) ready'; };
    $('#c-text').addEventListener('input', count);
    $('#c-file').addEventListener('change', async () => { const f = $('#c-file').files[0]; if (!f) return; const text = await f.text(); $('#c-text').value = parse(text).filter((s) => !/^code$/i.test(s)).join('\n'); count(); });
    $('#c-go').addEventListener('click', async () => {
      const codes = parse($('#c-text').value); if (!codes.length) return toast('Paste the codes first', true);
      $('#c-go').disabled = true; $('#c-out').innerHTML = '<span class="spin"></span> Importing…';
      try { const r = await api('POST', `/api/gift/codes/${item_id}/import`, { codes, note: $('#c-note').value }); $('#c-out').innerHTML = `<div class="good-box">Imported <b>${r.imported}</b> new code${r.imported === 1 ? '' : 's'} · ${r.available} now available${r.duplicates.length ? `<br><span class="small">${r.duplicates.length} already in the system were skipped: ${r.duplicates.slice(0, 5).map(esc).join(', ')}${r.duplicates.length > 5 ? '…' : ''}</span>` : ''}${r.repeated ? `<br><span class="small">${r.repeated} repeated line${r.repeated === 1 ? '' : 's'} ignored</span>` : ''}</div>`; toast('Codes imported'); refreshAlertBadge(); setTimeout(() => window.RestoreApp.render(), 1200); }
      catch (e) { $('#c-go').disabled = false; $('#c-out').innerHTML = `<div class="bad-box">${esc(e.message)}</div>`; }
    });
  });

  /* ---------------- Card designs ---------------- */
  route(/^\/gift\/designs$/, async () => {
    section('designs');
    const designs = await api('GET', '/api/gift/designs?all=1');
    app.innerHTML = `${head('Card designs', '<label class="btn">Upload design<input type="file" id="d-file" accept="image/png,image/jpeg" hidden></label>')}
      <div class="panel"><p class="small muted"><b>Making a design in Canva:</b> Custom size <b>1800 × 1200 px</b> (3:2), export as JPG or PNG under 4 MB. Keep the logo and any words at least 100 px from the edges and leave the lower third clear — the voucher value, recipient, message and code are printed below the picture, and a dark band with "Elements Wellness · Gift Voucher" sits along its bottom edge.</p>
        <div class="designs">${designs.map((d) => `<div class="design ${d.active ? '' : 'off'}" data-id="${d.design_id}"><img src="/api/gift/designs/${d.design_id}/image" alt=""><div class="d-body"><b contenteditable="true" data-name>${esc(d.name)}</b><label class="check"><input type="checkbox" data-active ${d.active ? 'checked' : ''}><span>Active</span></label><label class="check"><input type="checkbox" data-pick ${d.customer_pick ? 'checked' : ''}><span>Customers can choose it on the website</span></label><span class="small muted">Added ${fmtDay(d.created_at)}${d.created_by ? ' by ' + esc(d.created_by) : ''}</span></div></div>`).join('') || '<div class="empty">No designs yet. Upload the first one.</div>'}</div></div>`;
    $$('.design').forEach((el) => {
      const id = el.dataset.id; const save = (body, msg) => api('PUT', `/api/gift/designs/${id}`, body).then(() => toast(msg)).catch((e) => toast(e.message, true));
      $('[data-active]', el).addEventListener('change', (e) => { el.classList.toggle('off', !e.target.checked); save({ active: e.target.checked }, e.target.checked ? 'Design active' : 'Design hidden'); });
      $('[data-pick]', el).addEventListener('change', (e) => save({ customer_pick: e.target.checked }, 'Saved'));
      $('[data-name]', el).addEventListener('blur', (e) => save({ name: e.target.textContent.trim() || 'Untitled' }, 'Name saved'));
    });
    $('#d-file').addEventListener('change', async () => {
      const f = $('#d-file').files[0]; if (!f) return;
      const name = prompt('Name for this design (staff see this; customers see it too):', f.name.replace(/\.[^.]+$/, '')); if (name == null) return;
      try { await api('POST', '/api/gift/designs', undefined, { body: await f.arrayBuffer(), headers: { 'Content-Type': f.type, 'x-name': encodeURIComponent(name) } }); toast('Design uploaded'); window.RestoreApp.render(); } catch (e) { toast(e.message, true); }
    });
  });

  /* ---------------- Items for sale ---------------- */
  route(/^\/gift\/items$/, async () => {
    section('items');
    const items = await api('GET', '/api/gift/items?all=1');
    app.innerHTML = `${head('Items for sale', `<button class="btn" id="it-new">${ICON.plus}New item</button>`)}
      <div class="panel" style="padding:8px"><table class="table"><thead><tr><th>Item</th><th>Type</th><th>Price</th><th>WESS code</th><th>Codes left</th><th>Validity</th><th>Website</th><th></th></tr></thead><tbody>${items.map((i) => `<tr class="${i.active ? '' : 'muted'}"><td><b>${esc(i.name)}</b>${i.active ? '' : ' <span class="status voided">inactive</span>'}<br><span class="small muted">${i.vouchers_total} sold all-time</span></td><td>${i.kind === 'value' ? 'Value voucher' : 'Treatment'}</td><td>${money(i.price)}</td><td class="code">${esc(i.wess_item_code || '—')}<br><span class="muted">${esc(i.code_prefix || '')}</span></td><td style="color:${i.codes_available === 0 ? '#c0262c' : i.codes_available <= i.low_stock_threshold ? '#b25b00' : 'inherit'}"><b>${i.codes_available}</b> <span class="small muted">· alert ${i.low_stock_threshold}</span></td><td>${i.validity_months} months</td><td>${i.show_on_website && i.active ? '<span class="status active">shown</span>' : '<span class="status redeemed">hidden</span>'}</td><td><button class="btn ghost sm" data-edit="${i.item_id}">Edit</button></td></tr>`).join('')}</tbody></table></div>`;
    const form = (i = {}) => { const { m, close } = modal(`<h2>${i.item_id ? 'Edit item' : 'New item'}</h2><form class="form">
      <div class="field"><label>Name <span class="req">*</span></label><input id="e-name" value="${esc(i.name || '')}" required></div>
      <div class="row"><div class="field"><label>Type</label><select id="e-kind"><option value="treatment" ${i.kind !== 'value' ? 'selected' : ''}>Treatment voucher</option><option value="value" ${i.kind === 'value' ? 'selected' : ''}>Value voucher (S$)</option></select></div><div class="field"><label>Price (S$) <span class="req">*</span></label><input id="e-price" type="number" step="0.01" min="0" value="${i.price ?? ''}" required></div></div>
      <div class="row"><div class="field"><label>WESS item code</label><input id="e-wess" value="${esc(i.wess_item_code || '')}" placeholder="e.g. C01240-8"></div><div class="field"><label>Code prefix</label><input id="e-prefix" value="${esc(i.code_prefix || '')}" placeholder="e.g. EWG1-100GIFT"></div></div>
      <div class="row"><div class="field"><label>Validity (months)</label><input id="e-valid" type="number" min="1" value="${i.validity_months ?? 12}"></div><div class="field"><label>Low-stock alert at</label><input id="e-low" type="number" min="0" value="${i.low_stock_threshold ?? 10}"></div></div>
      <div class="field"><label>Description (website)</label><textarea id="e-desc">${esc(i.description || '')}</textarea></div>
      <label class="check"><input type="checkbox" id="e-active" ${i.active ?? true ? 'checked' : ''}><span>Active (can be issued)</span></label><label class="check"><input type="checkbox" id="e-web" ${i.show_on_website ?? true ? 'checked' : ''}><span>Show on the website</span></label>
      <div class="btn-row"><button class="btn" type="submit">Save</button><button class="btn ghost" type="button" data-cancel>Cancel</button></div></form>`);
      $('form', m).addEventListener('submit', async (e) => { e.preventDefault(); const body = { name: $('#e-name', m).value, kind: $('#e-kind', m).value, price: $('#e-price', m).value, value: $('#e-price', m).value, wess_item_code: $('#e-wess', m).value, code_prefix: $('#e-prefix', m).value, validity_months: $('#e-valid', m).value, low_stock_threshold: $('#e-low', m).value, description: $('#e-desc', m).value, active: $('#e-active', m).checked, show_on_website: $('#e-web', m).checked }; try { await (i.item_id ? api('PUT', `/api/gift/items/${i.item_id}`, body) : api('POST', '/api/gift/items', body)); close(); toast('Saved'); window.RestoreApp.render(); } catch (err) { toast(err.message, true); } }); };
    $('#it-new').addEventListener('click', () => form());
    $$('[data-edit]').forEach((b) => b.addEventListener('click', () => form(items.find((i) => i.item_id === b.dataset.edit))));
  });

  /* ---------------- Reports ---------------- */
  route(/^\/gift\/reports$/, async () => {
    section('reports');
    const q = new URLSearchParams(location.hash.split('?')[1] || ''); const y = +(q.get('year') || new Date().getFullYear()); const from = `${y - 1}-12-31T16:00:00`, to = `${y}-12-31T16:00:00`;
    const [years, sales, byItem, outlets, expiring] = await Promise.all([api('GET', '/api/gift/reports/years'), api('GET', `/api/gift/reports/sales?year=${y}`), api('GET', `/api/gift/reports/items?from=${from}&to=${to}`), api('GET', `/api/gift/reports/outlets?from=${from}&to=${to}`), api('GET', '/api/gift/reports/expiring?days=30')]);
    const max = Math.max(...sales.map((s) => s.revenue), 1); const yr = years.find((x) => +x.year === y);
    app.innerHTML = `${head('Reports', `<select id="rp-year">${(years.length ? years : [{ year: y }]).map((x) => `<option ${+x.year === y ? 'selected' : ''}>${x.year}</option>`).join('')}</select><a class="btn ghost" href="/api/gift/export.csv?from=${from}&to=${to}" target="_blank">Export ${y} (CSV)</a><a class="btn ghost" href="/api/gift/export.csv" target="_blank">Export all</a>`)}
      <div class="kpis">${years.map((x) => `<div class="kpi ${+x.year === y ? 'up' : ''}"><span>${x.year}</span><b>${money(x.revenue)}</b><small>${x.orders} orders</small></div>`).join('')}</div>
      <div class="panel"><h2>Sales by month, ${y}${yr ? ` — ${money(yr.revenue)}` : ''}</h2>${sales.length ? `<div class="bars" style="grid-template-columns:repeat(${sales.length},1fr)">${sales.map((s) => `<div style="height:${Math.round((s.revenue / max) * 100)}%"><small>${money(s.revenue)}</small><em>${s.month.slice(5)}/${s.month.slice(2, 4)}</em></div>`).join('')}</div>` : '<p class="small muted">No paid orders in this year.</p>'}<p class="small muted" style="margin-top:28px">Months follow Singapore time, the same as the Gift Up dashboard. Orders imported from Gift Up are included.</p></div>
      <div class="grid grid-2">
        <div class="panel"><h2>Sold in ${y}, by item</h2><table class="table"><thead><tr><th>Item</th><th>Vouchers</th><th>Value</th></tr></thead><tbody>${byItem.map((r) => `<tr><td>${esc(r.title)}</td><td>${r.vouchers}</td><td>${money(r.value)}</td></tr>`).join('') || '<tr><td colspan="3" class="muted">None yet</td></tr>'}</tbody></table></div>
        <div class="panel"><h2>Redeemed in ${y}, by outlet</h2><table class="table"><thead><tr><th>Outlet</th><th>Vouchers</th><th>Value</th></tr></thead><tbody>${outlets.map((r) => `<tr><td>${esc(r.outlet)}</td><td>${r.vouchers}</td><td>${money(r.value)}</td></tr>`).join('') || '<tr><td colspan="3" class="muted">None recorded yet</td></tr>'}</tbody></table></div>
      </div>
      <div class="panel"><h2>Expiring in the next 30 days (${expiring.length})</h2>${expiring.length ? `<table class="table"><thead><tr><th>Expires</th><th>Item</th><th>Code</th><th>Recipient</th></tr></thead><tbody>${expiring.map((v) => `<tr class="row" data-go="/gift/voucher/${v.voucher_id}"><td>${fmtDay(v.expires_at)}</td><td>${esc(v.title)}</td><td class="code">${esc(v.code)}</td><td>${esc(v.recipient_name || v.buyer_name || '—')}<br><span class="small muted">${esc(v.recipient_email || '')}</span></td></tr>`).join('')}</tbody></table>` : '<p class="small muted">Nothing expiring soon.</p>'}</div>`;
    $$('[data-go]', app).forEach((el) => el.addEventListener('click', () => go(el.dataset.go)));
    $('#rp-year').addEventListener('change', (e) => go('/gift/reports?year=' + e.target.value));
  });

  /* ---------------- Settings + Gift Up migration ---------------- */
  route(/^\/gift\/settings$/, async () => {
    section('settings');
    const [s, gu] = await Promise.all([api('GET', '/api/gift/settings'), api('GET', '/api/gift/giftup').catch((e) => ({ enabled: false, error: e.message }))]);
    app.innerHTML = `${head('Voucher settings')}
      <div class="grid grid-2"><form class="panel form" id="st">
        <h2>Notifications</h2><div class="field"><label>Who receives "voucher sold" and low-stock emails</label><input id="s-emails" value="${esc((s.notify_emails || []).join(', '))}" placeholder="name@elements.com.sg, another@elements.com.sg"><span class="small muted">Separate several addresses with commas. Leave empty for in-app alerts only.</span></div>
        <div class="row"><div class="field"><label>Default low-stock alert level</label><input id="s-low" type="number" min="0" value="${s.low_stock_threshold}"></div><div class="field"><label>Expiry reminder (days before)</label><input id="s-rem" type="number" min="0" value="${s.expiry_reminder_days}"></div></div>
        <h2 style="margin-top:8px">Terms printed on every voucher</h2><div class="field"><textarea id="s-terms" style="min-height:160px">${esc(s.terms || '')}</textarea></div>
        <div class="btn-row"><button class="btn" type="submit">Save settings</button></div></form>
        <div class="panel"><h2>Move from Gift Up</h2>${gu.enabled ? `<p class="small">Connected (read-only). Gift Up currently holds <b>${gu.giftCards}</b> vouchers and <b>${gu.items}</b> items${gu.archived ? `; <b>${gu.archived}</b> raw Gift Up records are archived here` : ''}. Importing copies every voucher, order, unused code and the card design into this system, plus a complete raw copy of each Gift Up record. Nothing in Gift Up is changed; running it again only adds what is new and updates vouchers Gift Up has since expired or voided.</p><label class="check"><input type="checkbox" id="gu-auto" ${s.giftup_auto_sync !== false ? 'checked' : ''}><span>Sync from Gift Up automatically once a day (until Gift Up is switched off)</span></label><div class="btn-row" style="margin-top:10px"><button class="btn" id="gu-go">Import / sync now</button></div><div id="gu-out" style="margin-top:10px"></div>` : `<p class="small muted">Not connected${gu.error ? ': ' + esc(gu.error) : ' — add GIFTUP_API_KEY on the server'}.</p>`}</div></div>`;
    $('#st').addEventListener('submit', async (e) => { e.preventDefault(); try { await api('PUT', '/api/gift/settings', { notify_emails: $('#s-emails').value, low_stock_threshold: $('#s-low').value, expiry_reminder_days: $('#s-rem').value, terms: $('#s-terms').value }); toast('Settings saved'); } catch (err) { toast(err.message, true); } });
    $('#gu-auto')?.addEventListener('change', (e) => api('PUT', '/api/gift/settings', { giftup_auto_sync: e.target.checked }).then(() => toast(e.target.checked ? 'Daily sync on' : 'Daily sync off')).catch((err) => toast(err.message, true)));
    $('#gu-go')?.addEventListener('click', async () => { if (!confirm('Import everything from Gift Up now? This can take a minute.')) return; $('#gu-go').disabled = true; $('#gu-out').innerHTML = '<span class="spin"></span> Importing… please keep this page open.'; try { const r = await api('POST', '/api/gift/giftup/import'); $('#gu-out').innerHTML = `<div class="good-box">Done: ${r.vouchers} vouchers, ${r.orders} orders, ${r.items} items and ${r.codes} unused codes added${r.updated ? ` · ${r.updated} updated to match Gift Up` : ''}${r.pdfs ? ` · ${r.pdfs} original PDFs archived` : ''}${r.skipped ? ` · ${r.skipped} already up to date` : ''}.</div>`; refreshAlertBadge(); } catch (err) { $('#gu-go').disabled = false; $('#gu-out').innerHTML = `<div class="bad-box">${esc(err.message)}</div>`; } });
  });

  refreshAlertBadge(); setInterval(refreshAlertBadge, 5 * 60e3);
};
if (window.RestoreApp) initGift(); else document.addEventListener('restore:ready', initGift);
