/* Elements Restore — staff app (vanilla JS, hash router). */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const app = $('#app');
  const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const fmtDate = (iso) => { if (!iso) return '—'; const d = new Date(iso); return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('en-SG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };
  const fmtDay = (iso) => { if (!iso) return '—'; const d = new Date(iso); return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }); };
  const ago = (iso) => { const s = (Date.now() - new Date(iso).getTime()) / 1000; if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + ' min ago'; if (s < 86400) return Math.floor(s / 3600) + ' h ago'; if (s < 86400 * 7) return Math.floor(s / 86400) + ' d ago'; return fmtDay(iso); };
  const initials = (n = '') => n.trim() ? n.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() : '?';
  const grads = ['linear-gradient(145deg,#c46a5c,#72181b)', 'linear-gradient(145deg,#ffb36b,#e0662a)', 'linear-gradient(145deg,#6aa8ff,#2a5bd7)', 'linear-gradient(145deg,#b88cff,#6a3fd1)', 'linear-gradient(145deg,#5fd39a,#178a4a)', 'linear-gradient(145deg,#ff8fa0,#c22d3b)'];
  const grad = (n = '') => grads[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % grads.length];
  const ava = (n, cls = '') => `<span class="ava ${cls}" style="--g:${grad(n)}" title="${esc(n)}">${esc(initials(n))}</span>`;

  /* ---- staff name (remembered on this device) ---- */
  const staffInput = $('#staff');
  try { staffInput.value = localStorage.getItem('restore-staff') || ''; } catch {}
  const avatar = $('#avatar');
  const setAvatar = () => { avatar.textContent = initials(staffInput.value); avatar.style.background = grad(staffInput.value.trim()); };
  setAvatar();
  staffInput.addEventListener('input', setAvatar);
  staffInput.addEventListener('change', () => { try { localStorage.setItem('restore-staff', staffInput.value); } catch {} refreshChrome(); });
  const staff = () => staffInput.value.trim() || 'staff';

  /* ---- api ---- */
  const api = async (method, url, body, raw) => {
    const headers = { 'x-staff': encodeURIComponent(staff()) };
    if (!raw && body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await fetch(url, { method, headers: { ...headers, ...(raw?.headers || {}) }, body: raw ? raw.body : body !== undefined ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) showSignin();
    if (!res.ok) throw Object.assign(new Error(data.error || res.statusText), { status: res.status, errors: data.errors });
    return data;
  };
  let toastT;
  const toast = (msg, bad) => { const t = $('#toast'); t.textContent = msg; t.className = 'toast show' + (bad ? ' bad' : ''); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3200); };
  let config = null;
  const loadConfig = async () => { config ||= await api('GET', '/api/config'); return config; };

  /* ---- AI writing help (only when the server has an OpenAI key) ---- */
  const aiOn = () => !!config?.ai?.enabled;
  const ICON_AI = '<svg viewBox="0 0 24 24"><path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/></svg>';
  async function aiFill(btn, textarea, url) {
    const cur = textarea.value.trim();
    const label = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin"></span>Writing…';
    try {
      const r = await api('POST', url);
      textarea.value = r.text; textarea.dispatchEvent(new Event('input', { bubbles: true })); textarea.focus();
      toast('AI draft added — please read and edit before saving');
    } catch (e) { toast(e.message, true); }
    finally { btn.disabled = false; btn.innerHTML = label; }
  }

  /* ---- workflow stage of an assessment (drives board columns and progress rings) ---- */
  const STAGES = [
    { id: 'upload', label: 'Awaiting upload', color: '#ff8a3d', pct: 10 },
    { id: 'confirm', label: 'To confirm', color: '#b8b8c2', pct: 30 },
    { id: 'report', label: 'Plan & report', color: '#0a84ff', pct: 60 },
    { id: 'send', label: 'Ready to send', color: '#8e5cf6', pct: 85 },
    { id: 'sent', label: 'Sent to client', color: '#22b35e', pct: 100 },
  ];
  const stageOf = (a) => a.emails > 0 ? 'sent' : a.reports > 0 ? 'send' : a.status === 'calculated' ? 'report' : (a.uploads > 0 || a.status === 'extracted') ? 'confirm' : 'upload';
  const priorityChips = (a) => {
    if (!a.priorities_json) return '<span class="chip pending">Awaiting results</span>';
    const p = JSON.parse(a.priorities_json);
    return a.maintain ? '<span class="chip maintain">Maintain</span>' : p.map((x) => `<span class="chip ${esc(x)}">${esc(x[0].toUpperCase() + x.slice(1))}</span>`).join('');
  };
  const priorityCell = (a) => `<span class="chips">${priorityChips(a)}</span>`;

  /* ---- board filters (sidebar) ---- */
  const FILTERS = { all: 'All assessments', mine: 'My assessments', confirm: 'To confirm', report: 'Plan & report', send: 'Ready to send' };
  let filter = 'all', view = 'board', boardQuery = '';
  try { view = localStorage.getItem('restore-view') || 'board'; } catch {}
  const applyFilter = (list) => list.filter((a) => {
    if (boardQuery && !a.client_name.toLowerCase().includes(boardQuery.toLowerCase())) return false;
    if (filter === 'mine') return (a.created_by || '').toLowerCase() === staff().toLowerCase();
    if (['confirm', 'report', 'send'].includes(filter)) return stageOf(a) === filter;
    return true;
  });
  $$('[data-filter]').forEach((l) => l.addEventListener('click', (e) => { e.preventDefault(); filter = l.dataset.filter; if (location.hash.replace(/^#/, '') !== '/' && location.hash !== '') go('/'); else render(); }));
  $('#side-q').addEventListener('input', (e) => { boardQuery = e.target.value; if (location.hash.replace(/^#/, '') === '/' || !location.hash) renderBoardOnly(); else go('/'); });

  /* ---- chrome: sidebar counts, today widget, recent clients, activity inbox ---- */
  let lastList = [], lastFeed = [], inboxTab = 'all';
  async function refreshChrome() {
    try { [lastList, lastFeed] = await Promise.all([api('GET', '/api/assessments'), api('GET', '/api/activity')]); } catch { return; }
    const cnt = (f) => { const keep = filter; filter = f; const n = applyFilter(lastList).length; filter = keep; return n; };
    $$('[data-count]').forEach((el) => el.textContent = cnt(el.dataset.count) || '');
    const today = new Date().toDateString();
    $('[data-today-count]').textContent = lastList.filter((a) => new Date(a.created_at).toDateString() === today).length;
    const seen = new Set(); const recent = lastList.filter((a) => !seen.has(a.client_id) && seen.add(a.client_id)).slice(0, 6);
    $('[data-recent-clients]').innerHTML = recent.map((a) => `<a class="recent" href="#/client/${a.client_id}">${ava(a.client_name)}${esc(a.client_name)}</a>`).join('') || '<p class="small muted" style="padding:4px 8px">No clients yet.</p>';
    renderInbox();
  }
  const evText = (e) => {
    const who = `<b>${esc(e.who || 'Staff')}</b>`, client = `<b>${esc(e.client)}</b>`;
    switch (e.kind) {
      case 'created': return `${who} started an assessment for ${client}`;
      case 'upload': return `${who} uploaded the ${esc(e.detail)} report for ${client}`;
      case 'confirmed': return `${who} confirmed readings and ran the engine for ${client}`;
      case 'report': return `${who} generated the Restore Profile for ${client}`;
      case 'email': { const [st, to] = (e.detail || '').split('|'); return st === 'failed' ? `Email to ${client} <b>failed</b> (${esc(to)})` : `${who} ${st === 'sent' ? 'emailed' : 'queued'} the report to ${client}`; }
      default: return client;
    }
  };
  function renderInbox() {
    const list = lastFeed.filter((e) => inboxTab === 'all' || e.kind === inboxTab);
    const fresh = (e) => Date.now() - new Date(e.at).getTime() < 86400e3;
    $('[data-inbox-list]').innerHTML = list.length ? list.map((e, i) => `<div class="ev" data-aid="${e.assessment_id}" style="animation-delay:${Math.min(i, 12) * 30}ms">${ava(e.who || e.client)}<div><p>${evText(e)}</p><small>${ago(e.at)} · ${esc(e.client)}</small></div>${fresh(e) ? '<i class="new"></i>' : '<i></i>'}</div>`).join('') : '<div class="ev-empty">Nothing here yet.</div>';
    $$('[data-inbox-list] .ev').forEach((el) => el.addEventListener('click', () => go(`/assessment/${el.dataset.aid}`)));
    $('[data-inbox-dot]').hidden = !lastFeed.some(fresh);
  }
  $$('[data-inbox-tab]').forEach((b) => b.addEventListener('click', () => { inboxTab = b.dataset.inboxTab; $$('[data-inbox-tab]').forEach((x) => x.classList.toggle('on', x === b)); renderInbox(); }));
  const wide = () => window.matchMedia('(min-width: 1681px)').matches;
  try { if (localStorage.getItem('restore-inbox') === 'closed') document.body.classList.add('inbox-closed'); } catch {}
  $$('[data-inbox-toggle]').forEach((b) => b.addEventListener('click', () => {
    if (wide()) { const closed = document.body.classList.toggle('inbox-closed'); try { localStorage.setItem('restore-inbox', closed ? 'closed' : 'open'); } catch {} }
    else document.body.classList.toggle('inbox-open');
  }));

  /* ---- router ---- */
  const routes = [];
  const route = (re, fn) => routes.push({ re, fn });
  const go = (hash) => { location.hash = hash; };
  async function render() {
    const h = location.hash.replace(/^#/, '') || '/';
    const section = h.startsWith('/rules') ? 'rules' : h.startsWith('/client') ? 'clients' : 'home';
    $$('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === section));
    $$('[data-filter]').forEach((a) => a.classList.toggle('on', section === 'home' && h === '/' && a.dataset.filter === filter));
    document.body.classList.remove('inbox-open');
    app.style.animation = 'none'; void app.offsetWidth; app.style.animation = '';
    for (const r of routes) { const m = h.match(r.re); if (m) { app.innerHTML = '<p class="muted"><span class="spin"></span>Loading…</p>'; try { await r.fn(...m.slice(1)); } catch (e) { app.innerHTML = `<div class="bad-box">${esc(e.message)}</div>`; } window.scrollTo(0, 0); refreshChrome(); return; } }
    go('/');
  }
  window.addEventListener('hashchange', render);
  const crumbs = (items) => `<nav class="crumbs">${items.map(([t, h], i) => (i ? '<i>/</i>' : '') + (h ? `<a href="#${h}">${esc(t)}</a>` : `<span class="cur">${esc(t)}</span>`)).join('')}</nav>`;
  const ICON = {
    board: '<svg viewBox="0 0 24 24"><rect x="3.5" y="4" width="5" height="16" rx="1.6"/><rect x="9.5" y="4" width="5" height="11" rx="1.6"/><rect x="15.5" y="4" width="5" height="8" rx="1.6"/></svg>',
    list: '<svg viewBox="0 0 24 24"><path d="M5 7h1M5 12h1M5 17h1M10 7h9M10 12h9M10 17h9"/></svg>',
    clip: '<svg viewBox="0 0 24 24"><path d="m15.5 7.5-6.4 6.4a1.8 1.8 0 0 0 2.5 2.5l6.7-6.7a3.5 3.5 0 0 0-5-5L6.6 11.4a5.2 5.2 0 0 0 7.4 7.4l5-5"/></svg>',
    mail: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="m4.5 7 7.5 6 7.5-6"/></svg>',
    doc: '<svg viewBox="0 0 24 24"><path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z"/><path d="M14 3.5V8h4"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 6v12M6 12h12"/></svg>',
    dots: '<svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="18" cy="12" r="1" fill="currentColor"/></svg>',
    user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.5"/><path d="M5 19.5c1.2-3.4 4-5 7-5s5.8 1.6 7 5"/></svg>',
    rules: '<svg viewBox="0 0 24 24"><path d="M5 7h14M5 12h14M5 17h14"/></svg>',
    bell: '<svg viewBox="0 0 24 24"><path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/></svg>',
  };

  /* =====================================================================
     1. Assessments — board / list
     ===================================================================== */
  const card = (a, i) => {
    const st = STAGES.find((s) => s.id === stageOf(a));
    return `<article class="card" data-go="/assessment/${a.assessment_id}" style="animation-delay:${Math.min(i, 10) * 35}ms" tabindex="0">
      <div class="card-title"><span>${esc(a.client_name)}</span><small>${a.client_age ? 'Age ' + a.client_age : ''}</small></div>
      <div class="chips">${priorityChips(a)}</div>
      <div class="card-meta"><span class="pct"><i class="ring" style="--p:${st.pct};--c:${st.color}"></i>${st.pct}%</span><span>${esc(fmtDay(a.assessed_at || a.created_at))}</span></div>
      <div class="card-foot">${ava(a.created_by || 'staff')}<span class="counts"><span title="UBIO reports">${ICON.clip}${a.uploads || 0}</span><span title="Reports">${ICON.doc}${a.reports || 0}</span><span title="Emails">${ICON.mail}${a.emails || 0}</span></span></div>
    </article>`;
  };
  function boardHtml(list) {
    if (view === 'list') {
      return list.length ? `<div class="panel" style="padding:8px 8px 4px"><table class="table"><thead><tr><th>Client</th><th>Assessed</th><th>Stage</th><th>Priority</th><th>Staff</th></tr></thead><tbody>
        ${list.map((a) => { const st = STAGES.find((s) => s.id === stageOf(a)); return `<tr class="row" data-go="/assessment/${a.assessment_id}"><td><b>${esc(a.client_name)}</b><br><span class="small muted">Age ${a.client_age ?? '—'}</span></td><td>${fmtDate(a.assessed_at || a.created_at)}</td><td><span class="pct" style="display:inline-flex;align-items:center;gap:8px"><i class="ring" style="--p:${st.pct};--c:${st.color}"></i>${esc(st.label)}</span></td><td>${priorityCell(a)}</td><td>${ava(a.created_by || 'staff')}</td></tr>`; }).join('')}
      </tbody></table></div>` : '<div class="empty">No assessments match.</div>';
    }
    const cols = ['confirm', 'report', 'send'].includes(filter) ? STAGES.filter((s) => s.id === filter) : STAGES;
    return `<div class="board">${cols.map((s) => { const items = list.filter((a) => stageOf(a) === s.id); return `
      <section class="col"><div class="col-head"><i class="sd" style="--c:${s.color}"></i>${esc(s.label)}<span class="n">— ${items.length}</span><span class="more">${ICON.dots}</span></div>
        ${s.id === 'upload' ? `<button class="col-add" type="button" data-new-inline aria-label="New assessment">${ICON.plus}</button>` : ''}
        ${items.map(card).join('') || '<div class="col-empty">Nothing here</div>'}
      </section>`; }).join('')}</div>`;
  }
  function bindBoard() {
    $$('[data-go]', app).forEach((el) => { el.addEventListener('click', () => go(el.dataset.go)); el.addEventListener('keydown', (e) => e.key === 'Enter' && go(el.dataset.go)); });
    $$('[data-new-inline]', app).forEach((b) => b.addEventListener('click', () => newAssessmentModal()));
  }
  function renderBoardOnly() { const holder = $('#board-holder'); if (!holder) return; holder.innerHTML = boardHtml(applyFilter(lastList)); bindBoard(); }
  route(/^\/$/, async () => {
    lastList = await api('GET', '/api/assessments');
    const list = applyFilter(lastList);
    app.innerHTML = `
      ${crumbs([['Restore', '/'], [FILTERS[filter]]])}
      <div class="page-head"><h1>${esc(FILTERS[filter])}</h1><div class="btn-row"><button class="btn" id="new">${ICON.plus}New assessment</button></div></div>
      <nav class="tabs"><button type="button" data-view="board" class="${view === 'board' ? 'on' : ''}">${ICON.board}Board</button><button type="button" data-view="list" class="${view === 'list' ? 'on' : ''}">${ICON.list}List</button><span class="spacer"></span><button class="tool" type="button" data-palette>⌘K &nbsp;Command menu</button></nav>
      <div id="board-holder">${boardHtml(list)}</div>`;
    bindBoard();
    $('#new').addEventListener('click', () => newAssessmentModal());
    $$('[data-view]', app).forEach((b) => b.addEventListener('click', () => { view = b.dataset.view; try { localStorage.setItem('restore-view', view); } catch {} $$('[data-view]', app).forEach((x) => x.classList.toggle('on', x === b)); renderBoardOnly(); }));
    $$('[data-palette]', app).forEach((b) => b.addEventListener('click', openPalette));
  });

  function newAssessmentModal(preClient) {
    const m = document.createElement('div'); m.className = 'modal-bg';
    m.innerHTML = `<div class="modal"><h2>New Restore assessment</h2>
      <div class="form">
        <div class="field"><label>Existing client</label><div class="search"><input id="m-q" placeholder="Search name…" autocomplete="off"><button class="btn sm ghost" id="m-qb" type="button">Search</button></div><div id="m-list" class="small"></div></div>
        <div class="divider"></div>
        <h3>Or create a client</h3>
        <div class="row"><div class="field"><label>Name</label><input id="m-name"></div><div class="field"><label>Age</label><input id="m-age" type="number" min="1" max="120"></div></div>
        <div class="row"><div class="field"><label>Sex</label><select id="m-sex"><option value="">—</option><option>Female</option><option>Male</option></select></div><div class="field"><label>Email (for sending the report)</label><input id="m-email" type="email" placeholder="client@email.com"></div></div>
        <div class="field"><label>Contact reference (optional)</label><input id="m-ref" placeholder="Mobile / member no."></div>
        <div class="btn-row"><button class="btn" id="m-create" type="button">Create client &amp; start</button><button class="btn ghost" id="m-cancel" type="button">Cancel</button></div>
      </div></div>`;
    document.body.appendChild(m);
    const close = () => m.remove();
    $('#m-cancel', m).addEventListener('click', close); m.addEventListener('click', (e) => e.target === m && close());
    document.addEventListener('keydown', function esc_(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc_); } });
    const start = async (client_id) => { const a = await api('POST', '/api/assessments', { client_id }); close(); go(`/assessment/${a.assessment_id}/upload`); };
    const search = async () => { const cs = await api('GET', '/api/clients?q=' + encodeURIComponent($('#m-q', m).value)); $('#m-list', m).innerHTML = cs.slice(0, 8).map((c) => `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)"><span style="display:flex;align-items:center;gap:10px">${ava(c.name)}<span><b>${esc(c.name)}</b> <span class="muted">· age ${c.age ?? '—'} · ${c.assessments} prior</span></span></span><button class="btn sm" data-id="${c.client_id}" type="button">Start</button></div>`).join('') || '<p class="muted">No match.</p>'; $('#m-list', m).querySelectorAll('button').forEach((b) => b.addEventListener('click', () => start(b.dataset.id))); };
    $('#m-qb', m).addEventListener('click', search); $('#m-q', m).addEventListener('keydown', (e) => e.key === 'Enter' && search());
    $('#m-create', m).addEventListener('click', async () => { try { const c = await api('POST', '/api/clients', { name: $('#m-name', m).value, age: $('#m-age', m).value, sex: $('#m-sex', m).value, contact_ref: $('#m-ref', m).value, email: $('#m-email', m).value }); await start(c.client_id); } catch (e) { toast(e.message, true); } });
    if (preClient) start(preClient); else setTimeout(() => $('#m-q', m).focus(), 50);
  }

  /* =====================================================================
     Clients
     ===================================================================== */
  route(/^\/clients$/, async () => {
    app.innerHTML = `${crumbs([['Restore', '/'], ['Clients']])}
      <div class="page-head"><h1>Clients</h1><div class="btn-row"><button class="btn" id="new">${ICON.plus}New assessment</button></div></div>
      <div class="panel" style="padding:14px 14px 6px"><div class="search" style="margin-bottom:8px"><input id="cq" placeholder="Search by name…" autocomplete="off"></div><div id="clist"></div></div>`;
    $('#new').addEventListener('click', () => newAssessmentModal());
    const load = async () => { const cs = await api('GET', '/api/clients?q=' + encodeURIComponent($('#cq').value)); $('#clist').innerHTML = cs.length ? `<table class="table"><thead><tr><th>Client</th><th>Age</th><th>Email</th><th>Assessments</th><th>Last</th></tr></thead><tbody>${cs.map((c) => `<tr class="row" data-go="/client/${c.client_id}"><td><span style="display:flex;align-items:center;gap:10px">${ava(c.name)}<b>${esc(c.name)}</b></span></td><td>${c.age ?? '—'}</td><td class="muted">${esc(c.email || '—')}</td><td>${c.assessments}</td><td class="muted">${c.last_assessment ? ago(c.last_assessment) : '—'}</td></tr>`).join('')}</tbody></table>` : '<div class="empty">No clients match.</div>'; $$('#clist [data-go]').forEach((el) => el.addEventListener('click', () => go(el.dataset.go))); };
    $('#cq').addEventListener('input', load); load();
  });
  route(/^\/client\/([^/]+)$/, async (cid) => {
    const c = await api('GET', `/api/clients/${cid}`);
    app.innerHTML = `${crumbs([['Clients', '/clients'], [c.name]])}
      <div class="page-head"><div style="display:flex;align-items:center;gap:14px">${ava(c.name).replace('class="ava ', 'class="ava big ').replace('<span class="ava ', '<span style="width:48px;height:48px;font-size:16px" class="ava ')}<div><h1>${esc(c.name)}</h1><p class="muted" style="margin:2px 0 0">Age ${c.age ?? '—'} · ${c.sex || '—'}${c.email ? ' · ' + esc(c.email) : ''}${c.contact_ref ? ' · ' + esc(c.contact_ref) : ''}</p></div></div><div class="btn-row"><button class="btn" id="new">${ICON.plus}New assessment</button></div></div>
      <nav class="tabs"><button type="button" class="on">${ICON.list}Restore history</button></nav>
      ${c.assessments.length ? `<div class="board" style="grid-auto-columns:minmax(250px,300px)"><section class="col">${c.assessments.map((a, i) => card({ ...a, client_name: fmtDay(a.assessed_at || a.created_at), client_age: null }, i)).join('')}</section></div>` : '<div class="empty">No assessments yet.</div>'}
      <p class="small muted" style="margin-top:14px">Restore Review (trend comparison across assessments) is planned for Phase 2.</p>`;
    $$('[data-go]', app).forEach((el) => el.addEventListener('click', () => go(el.dataset.go)));
    $('#new').addEventListener('click', () => newAssessmentModal(cid));
  });

  /* =====================================================================
     Assessment workflow
     ===================================================================== */
  // Treatments come straight from the client's fixed programmes (OR-options are chosen by the consultant during the session,
  // exactly as the Leslie sample report says), so there is no separate recommendation or notes step.
  const STEPS = [['upload', 'Upload'], ['confirm', 'Confirm readings'], ['results', 'Results'], ['report', 'Report']];
  const stepIndex = (a) => (a.result ? 4 : a.uploads?.length ? 2 : 1); // highest reachable step index (1-based)

  route(/^\/assessment\/([^/]+)(?:\/(\w+))?$/, async (aid, step) => {
    const a = await api('GET', `/api/assessments/${aid}`);
    const rules = (await loadConfig()).rules;
    const reach = stepIndex(a);
    if (!step) step = a.reports?.length ? 'report' : a.result ? 'results' : a.uploads?.length ? 'confirm' : 'upload';
    const si = STEPS.findIndex(([k]) => k === step);
    if (si < 0 || si + 1 > reach) return go(`/assessment/${aid}`);
    app.innerHTML = `
      ${crumbs([['Assessments', '/'], [a.client_name, `/client/${a.client_id}`], [STEPS[si][1]]])}
      <div class="page-head"><div style="display:flex;align-items:center;gap:12px">${ava(a.client_name).replace('<span class="ava ', '<span style="width:40px;height:40px;font-size:14px" class="ava ')}<h1>${esc(a.client_name)}</h1></div>
        <div class="meta">Assessed ${fmtDate(a.assessed_at || a.created_at)}<br>Rules ${esc(a.rules_version || rules.version)} · <span class="status ${a.emails?.length ? 'sent' : a.status}">${a.emails?.length ? 'sent' : a.status}</span></div></div>
      <nav class="tabs">${STEPS.map(([k, t], i) => `<a href="#/assessment/${aid}/${k}" class="${i === si ? 'on' : ''} ${i + 1 < reach || (i + 1 <= reach && i < si) ? 'done' : ''} ${i + 1 > reach ? 'locked' : ''}"><span class="step-n">${i + 1 < reach || (i + 1 <= reach && i < si) ? '✓' : i + 1}</span>${t}</a>`).join('')}</nav>
      <div id="step"></div>`;
    const el = $('#step');
    ({ upload: stepUpload, confirm: stepConfirm, results: stepResults, report: stepReport })[step](el, a, rules);
  });

  /* ---- Step 1: Upload ---- */
  function stepUpload(el, a) {
    const have = (k) => a.uploads.filter((u) => u.kind === k).slice(-1)[0];
    const card = (k, title, hint) => {
      const u = have(k);
      return `<div class="panel"><h2>${title}</h2><p class="small muted">${hint}</p>
        <div class="drop" data-kind="${k}"><input type="file" accept="application/pdf"><h3>${u ? 'Replace file' : 'Drop the UBIO PDF here'}</h3><span class="small muted">or click to choose · PDF only</span></div>
        <div class="up-status" style="margin-top:12px">${u ? uploadCard(u) : ''}</div></div>`;
    };
    el.innerHTML = `<div class="grid grid-2">${card('stress', 'Stress Index Report', 'Provides Stress Index and Pulse Complexity.')}${card('vascular', 'Vascular Age Test Report', 'Provides Vascular Age Type and Vascular Age Index.')}</div>
      <div class="panel" style="margin-top:20px;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap"><div><b>Next:</b> confirm the extracted values before the engine runs.<br><span class="small muted">Original PDFs are kept unchanged on the client record.</span></div><a class="btn primary" id="next" href="#/assessment/${a.assessment_id}/confirm" ${a.uploads.length ? '' : 'disabled'}>Continue to confirm readings →</a></div>`;
    el.querySelectorAll('.drop').forEach((d) => {
      const input = d.querySelector('input');
      d.addEventListener('click', () => input.click());
      ['dragenter', 'dragover'].forEach((ev) => d.addEventListener(ev, (e) => { e.preventDefault(); d.classList.add('over'); }));
      ['dragleave', 'drop'].forEach((ev) => d.addEventListener(ev, (e) => { e.preventDefault(); d.classList.remove('over'); }));
      d.addEventListener('drop', (e) => e.dataTransfer.files[0] && upload(d, e.dataTransfer.files[0]));
      input.addEventListener('change', () => input.files[0] && upload(d, input.files[0]));
    });
    async function upload(d, file) {
      const status = d.parentElement.querySelector('.up-status');
      status.innerHTML = `<p><span class="spin"></span> Uploading and reading <b>${esc(file.name)}</b>…</p>`;
      try {
        const r = await api('POST', `/api/assessments/${a.assessment_id}/uploads`, undefined, { body: await file.arrayBuffer(), headers: { 'Content-Type': 'application/pdf', 'x-kind': d.dataset.kind, 'x-filename': encodeURIComponent(file.name) } });
        a = await api('GET', `/api/assessments/${a.assessment_id}`);
        status.innerHTML = uploadCard(a.uploads.find((u) => u.upload_id === r.upload_id));
        $('#next').removeAttribute('disabled');
        toast('Extracted. Please confirm the readings.');
      } catch (e) { status.innerHTML = `<div class="bad-box">${esc(e.message)}</div>`; }
    }
  }
  const uploadCard = (u) => {
    const f = u.extraction?.fields || {}; const keys = u.kind === 'stress' ? ['stress_index', 'pulse_complexity'] : ['vascular_age_type', 'vascular_age_index'];
    const kv = [['File', u.filename], ['Detected', u.extraction?.kind || '—'], ['Client', f.client_name?.value ?? '—'], ['Date', f.assessed_at?.value ? fmtDate(f.assessed_at.value) : '—'], ...keys.map((k) => [labelOf(k), f[k]?.value ?? '<span class="muted">not found</span>'])];
    return `<div class="upload-card"><img src="/api/uploads/${u.upload_id}/preview" alt="" onerror="this.style.display='none'"><div><div class="kv">${kv.map(([k, v]) => `<span>${k}</span><span><b>${v}</b></span>`).join('')}</div>
      ${u.extraction?.warning ? `<div class="warn-box" style="margin-top:10px">${esc(u.extraction.warning)}</div>` : ''}${u.extraction?.error ? `<div class="bad-box" style="margin-top:10px">Could not read this PDF automatically: ${esc(u.extraction.error)}. Enter the values manually on the next step.</div>` : ''}
      <p class="small" style="margin:10px 0 0"><a class="link" href="/api/uploads/${u.upload_id}/file" target="_blank">Open original PDF</a></p></div></div>`;
  };
  const LABELS = { stress_index: 'Stress Index', pulse_complexity: 'Pulse Complexity', vascular_age_type: 'Vascular Age Type', vascular_age_index: 'Vascular Age Index' };
  const labelOf = (k) => LABELS[k] || k;

  /* ---- Step 2: Confirm readings ---- */
  function stepConfirm(el, a, rules) {
    const latest = (k) => a.uploads.filter((u) => u.kind === k).slice(-1)[0];
    const st = latest('stress'), va = latest('vascular');
    const f = { ...(st?.extraction?.fields || {}), ...(va?.extraction?.fields || {}) };
    if (st?.extraction?.fields?.assessed_at) f.assessed_at = st.extraction.fields.assessed_at;
    const prior = a.readings; // re-confirming after a change
    const fieldDefs = [
      ['stress_index', 'Stress Index', st, 'e.g. 47', 'Drives Stress Load'],
      ['pulse_complexity', 'Pulse Complexity', st, 'e.g. 30.11', 'Drives Recovery Capacity'],
      ['vascular_age_type', 'Vascular Age Type (A-G)', va, 'e.g. B', 'Primary driver of Circulation'],
      ['vascular_age_index', 'Vascular Age Index', va, 'e.g. -13', 'Supporting modifier for Circulation'],
    ];
    const box = ([k, label, up, ph, use]) => {
      const x = f[k]; const val = prior ? prior[k] : (x?.value ?? '');
      const flag = !up || !x || x.needsReview;
      return `<div class="reading ${flag ? 'flag' : ''}" data-k="${k}"><div class="lbl"><b>${label}</b><span class="small muted">${use}</span></div>
        <input id="r-${k}" value="${esc(val ?? '')}" placeholder="${ph}" autocomplete="off" ${k === 'vascular_age_type' ? 'maxlength="1" style="text-transform:uppercase"' : 'inputmode="decimal"'}>
        <div class="src">${!up ? `<span class="warn-box" style="display:block">No ${k.startsWith('v') ? 'Vascular' : 'Stress'} report uploaded — enter manually or <a class="link" href="#/assessment/${a.assessment_id}/upload">upload it</a>.</span>` : x?.value == null ? `<span class="warn-box" style="display:block">Not found automatically${x?.note ? ' — ' + esc(x.note) : ''}. Please read it from the PDF and type it in.</span>` : `Read from PDF: <code>${esc(x.source)}</code>${x.confidence < 0.6 ? ' <b class="changed">low confidence — please check</b>' : ''}${x.note ? ` · ${esc(x.note)}` : ''}`}</div>
        <div class="changed" data-changed hidden>Edited from extracted value ${esc(x?.value ?? '—')}</div><div class="err small" data-err></div></div>`;
    };
    el.innerHTML = `<div class="grid grid-side">
      <div>
        <div class="panel"><h2>Client &amp; assessment</h2><div class="form"><div class="row">
          <div class="field"><label>Client name</label><input id="c-name" value="${esc(a.client_name)}"></div>
          <div class="field"><label>Age</label><input id="c-age" type="number" value="${esc(a.client_age ?? f.age?.value ?? '')}"></div></div>
          <div class="row"><div class="field"><label>Client email</label><input id="c-email" type="email" value="${esc(a.client_email || '')}" placeholder="client@email.com"></div><div class="field"><label>Assessment date &amp; time</label><input id="c-date" type="datetime-local" value="${esc((a.assessed_at || f.assessed_at?.value || '').slice(0, 16))}"></div></div>
          <div class="row">
          <div class="field"><label>Read from PDF</label><div class="small muted" style="padding-top:12px">${f.client_name?.value ? `${esc(f.client_name.value)} · ${f.sex?.value || ''} · ${f.age?.value ?? ''} yrs` : '—'}${f.client_name?.value && f.client_name.value.toLowerCase() !== a.client_name.toLowerCase() ? '<br><b class="changed">Name on PDF differs from the client record</b>' : ''}</div></div></div>
        </div></div>
        <div class="panel" style="margin-top:20px"><h2>Extracted readings</h2><p class="small muted">Check each value against the source report on the right. Edit anything that is wrong; corrections are recorded with your name.</p>
          <div class="confirm-grid">${fieldDefs.map(box).join('')}</div>
          <div class="divider"></div>
          <label class="check"><input type="checkbox" id="ok"><span>I have checked these values against the UBIO reports and confirm they are correct.</span></label>
          <div class="btn-row" style="margin-top:16px"><button class="btn primary" id="run" disabled>Confirm &amp; run Restore engine →</button><a class="btn ghost" href="#/assessment/${a.assessment_id}/upload">Back to upload</a></div>
          <div id="err" style="margin-top:12px"></div>
        </div>
      </div>
      <div class="preview"><div class="tabs">${[st, va].filter(Boolean).map((u, i) => `<button data-p="${u.upload_id}" class="${i === 0 ? 'on' : ''}">${u.kind === 'stress' ? 'Stress report' : 'Vascular report'}</button>`).join('')}</div>
        ${[st, va].filter(Boolean)[0] ? `<img id="pimg" src="/api/uploads/${[st, va].filter(Boolean)[0].upload_id}/preview" alt="Source report"><p class="small" style="margin-top:8px"><a class="link" id="popen" href="/api/uploads/${[st, va].filter(Boolean)[0].upload_id}/file" target="_blank">Open PDF</a></p>` : '<div class="empty">No report uploaded.</div>'}</div>
    </div>`;
    el.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => { el.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('on', x === b)); $('#pimg').src = `/api/uploads/${b.dataset.p}/preview`; $('#popen').href = `/api/uploads/${b.dataset.p}/file`; }));
    const ok = $('#ok'), run = $('#run');
    ok.addEventListener('change', () => run.disabled = !ok.checked);
    el.querySelectorAll('.reading input').forEach((inp) => inp.addEventListener('input', () => { const k = inp.closest('.reading').dataset.k; const orig = f[k]?.value; inp.closest('.reading').querySelector('[data-changed]').hidden = String(orig ?? '') === inp.value.trim(); ok.checked = false; run.disabled = true; }));
    run.addEventListener('click', async () => {
      const readings = Object.fromEntries(fieldDefs.map(([k]) => [k, $(`#r-${k}`).value.trim()]));
      const corrections = fieldDefs.filter(([k]) => String(f[k]?.value ?? '') !== readings[k]).map(([k]) => ({ field: k, extracted: f[k]?.value ?? null, confirmed: readings[k], by: staff(), at: new Date().toISOString() }));
      el.querySelectorAll('[data-err]').forEach((e) => e.textContent = '');
      run.disabled = true; run.innerHTML = '<span class="spin"></span> Running…';
      try {
        await api('POST', `/api/assessments/${a.assessment_id}/confirm`, { readings, confirmed: true, extracted: Object.fromEntries(fieldDefs.map(([k]) => [k, f[k] || null])), corrections, assessed_at: $('#c-date').value ? new Date($('#c-date').value).toISOString() : null, client: { name: $('#c-name').value.trim(), age: $('#c-age').value, email: $('#c-email').value.trim() || null } });
        toast('Restore engine complete'); go(`/assessment/${a.assessment_id}/results`);
      } catch (e) {
        run.disabled = false; run.textContent = 'Confirm & run Restore engine →';
        if (e.errors) Object.entries(e.errors).forEach(([k, m]) => { const r = el.querySelector(`.reading[data-k="${k}"]`); if (r) r.querySelector('[data-err]').textContent = m; });
        $('#err').innerHTML = `<div class="bad-box">${esc(e.message)}</div>`;
      }
    });
  }

  /* ---- Step 3: Results ---- */
  function stepResults(el, a, rules) {
    const R = a.result;
    el.innerHTML = `
      <div class="grid grid-3">${R.domains.map((d) => `<div class="domain s${d.severity}"><h3>${esc(d.label)}</h3><div class="out">${esc(d.outcome)}</div><div class="raw">${esc(d.readings)}</div><span class="sev pill s${d.severity}">Severity ${d.severity}${d.severity >= rules.priority.threshold ? ' · Restore Priority' : d.severity === 1 ? ' · Monitor' : ''}</span><p class="small" style="margin:8px 0 0">${esc(d.explanation)}</p><div class="ideal"><b>Ideal range</b><br>${esc(d.idealRange)}</div></div>`).join('')}</div>
      <div class="grid grid-2" style="margin-top:20px">
        <div class="priority-box"><h3 style="color:#d8d0c7">Restore Priorit${R.priorities.length > 1 ? 'ies' : 'y'}</h3><div class="big">${esc(R.priorityLabel)}</div><p>${esc(R.priorityText)}</p></div>
        <div><div class="plan-strip"><div><span class="eyebrow">Program${R.programs.length > 1 ? 's' : ''}</span><b>${R.programs.join(' + ')}</b></div><div><span class="eyebrow">Plan duration</span><b>${esc(R.plan.duration)}</b></div><div><span class="eyebrow">Frequency</span><b style="font-size:14px">${esc(R.plan.frequency)}</b></div></div>
          <p class="small muted" style="margin-top:12px">${esc(R.plan.basis)} Every domain with severity ${rules.priority.threshold}+ becomes a priority (severity 3 listed before 2).</p></div>
      </div>
      <div class="panel" style="margin-top:20px"><h2>Treatment recommendation</h2><p class="small muted">The matching fixed Restore Program${R.programs.length > 1 ? 's' : ''}, exactly as printed on the client's report. Where alternatives are shown, the consultant selects the suitable option during the session.</p>
        <div class="grid grid-${Math.min(R.programs.length, 3)}" style="margin-top:12px">${R.programs.map((code) => { const p = rules.programs[code]; return `<div class="prog"><h3>${esc(p.name)}</h3><p class="small muted" style="margin:0 0 10px">${esc(p.benefit)}</p><ol class="comps-list">${p.components.map((c) => `<li><b>${c.options.map(esc).join(' <span class="or">OR</span> ')}</b> — ${esc(c.duration)}<br><span class="small muted">${esc(c.blurb)}</span></li>`).join('')}</ol><p class="small" style="margin:8px 0 0">Optional enhancer: <b>${esc(p.enhancer)}</b></p></div>`; }).join('')}</div></div>
      <div class="panel" style="margin-top:20px;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap"><div class="small muted">Confirmed by ${esc(a.readings?.confirmed_by || '—')} · ${fmtDate(a.readings?.confirmed_at)}${a.readings?.corrections?.length ? ` · ${a.readings.corrections.length} value${a.readings.corrections.length > 1 ? 's' : ''} corrected manually` : ' · no manual corrections'} · rules ${esc(R.rulesVersion)}</div>
        <div class="btn-row"><a class="btn ghost" href="#/assessment/${a.assessment_id}/confirm">Edit readings</a><a class="btn primary" href="#/assessment/${a.assessment_id}/report">Continue to report →</a></div></div>`;
  }

  /* ---- Step 4: Report ---- */
  function stepReport(el, a) {
    const latest = a.reports[0];
    const prov = config?.mailProvider || 'outbox';
    const provNote = prov === 'outbox' ? '<div class="warn-box" style="margin-bottom:12px">No email provider is configured yet — emails are saved to the outbox folder instead of being sent. Set RESEND_API_KEY or SMTP_* on the server to send for real.</div>' : '';
    el.innerHTML = `<div class="grid grid-side">
      <div>
        <div class="panel"><div class="panel-head"><h2>Preview</h2><button class="btn ghost sm" type="button" id="view-full"><svg viewBox="0 0 24 24"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>View full report</button></div><iframe class="report-frame" src="/api/assessments/${a.assessment_id}/report.html?screen=1" title="Restore Profile preview"></iframe></div>
        <div class="panel" id="email-panel" style="margin-top:20px"><h2>Email the report to the client</h2>
          ${latest ? `${provNote}<p class="small muted">Sends the PDF generated ${fmtDate(latest.generated_at)} as an attachment. The client receives only the PDF — no link into this system.</p>
          <div class="form">
            <div class="row"><div class="field"><label for="e-to">Client email</label><input id="e-to" type="email" value="${esc(a.client_email || '')}" placeholder="client@email.com" autocomplete="off"></div><div class="field"><label for="e-from">From (consultant name)</label><input id="e-from" value="${esc(staff() === 'staff' ? '' : staff())}" placeholder="Your name"></div></div>
            <div class="row"><div class="field"><label for="e-outlet">Outlet</label><select id="e-outlet"><option value="">—</option><option>ION Orchard</option><option>The Centrepoint</option><option>313@somerset</option></select></div><div class="field"><label for="e-subject">Subject</label><input id="e-subject" value="Your Elements Restore Profile — ${esc(fmtDay(a.assessed_at || a.created_at))}"></div></div>
            <div class="field"><div class="label-row"><label for="e-msg">Message</label>${aiOn() ? `<button class="btn ghost sm" type="button" id="e-ai">${ICON_AI}Write with AI</button>` : ''}</div><textarea id="e-msg">Thank you for completing your Restore assessment with us. Attached is your Restore Profile with your Stress Load, Recovery Capacity and Circulation results, and the Restore Plan we discussed.

If you have any questions, simply reply to this email or speak to us at your next visit.</textarea></div>
            <label class="check"><input type="checkbox" id="e-consent"><span>The client has agreed to receive their Restore Profile at this email address.</span></label>
            <div class="btn-row"><button class="btn primary" id="e-send" disabled>Send email with PDF</button><button class="btn ghost" type="button" id="e-preview">Preview email</button></div>
            <div id="e-status" class="small"></div>
          </div>` : '<p class="muted small">Generate the PDF first — then you can email it to the client here.</p>'}
        </div>
      </div>
      <div><div class="panel"><h2>Generate PDF</h2><p class="small muted">The PDF is saved to the client record with the rules and template version used, so it stays reproducible.</p>
        <button class="btn primary" id="gen" style="width:100%">${latest ? 'Regenerate PDF' : 'Generate & save PDF'}</button><div id="gen-status" class="small" style="margin-top:10px"></div></div>
        <div class="panel"><h2>Saved reports</h2>${a.reports.length ? a.reports.map((r) => `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line)"><span class="small">${fmtDate(r.generated_at)}<br><span class="muted">${esc(r.rules_version)}</span></span><a class="btn ghost sm" href="/api/reports/${r.report_id}/file" target="_blank">Download</a></div>`).join('') : '<p class="muted small">None yet.</p>'}</div>
        <div class="panel"><h2>Email history</h2>${a.emails?.length ? a.emails.map((e) => `<div style="padding:10px 0;border-bottom:1px solid var(--line)" class="small"><b>${esc(e.to_address)}</b> <span class="status ${e.status === 'sent' ? 'calculated' : e.status === 'failed' ? 'uploading' : 'extracted'}">${esc(e.status)}</span><br><span class="muted">${fmtDate(e.sent_at)} · by ${esc(e.sent_by)}${e.error ? ' · ' + esc(e.error) : ''}</span></div>`).join('') : '<p class="muted small">Not emailed yet.</p>'}</div>
        <div class="panel"><h2>Next</h2><p class="small">Suggested Restore Review in 8-12 weeks.</p><a class="btn ghost" href="#/client/${a.client_id}">Client record</a></div></div></div>`;
    $('#view-full').addEventListener('click', () => openViewer(a, latest));
    $('#gen').addEventListener('click', async () => {
      const b = $('#gen'); b.disabled = true; $('#gen-status').innerHTML = '<span class="spin"></span> Generating PDF…';
      try { const r = await api('POST', `/api/assessments/${a.assessment_id}/report`); toast('PDF saved'); window.open(`/api/reports/${r.report_id}/file`, '_blank'); render(); }
      catch (e) { b.disabled = false; $('#gen-status').innerHTML = `<div class="bad-box">${esc(e.message)}</div>`; }
    });
    if (!latest) return;
    const consent = $('#e-consent'), sendBtn = $('#e-send');
    const check = () => sendBtn.disabled = !(consent.checked && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('#e-to').value.trim()));
    consent.addEventListener('change', check); $('#e-to').addEventListener('input', check);
    if (aiOn() && $('#e-ai')) $('#e-ai').addEventListener('click', () => aiFill($('#e-ai'), $('#e-msg'), `/api/assessments/${a.assessment_id}/ai/email`));
    $('#e-preview').addEventListener('click', () => window.open(`/api/reports/${latest.report_id}/email-preview?message=${encodeURIComponent($('#e-msg').value)}&from=${encodeURIComponent($('#e-from').value)}&outlet=${encodeURIComponent($('#e-outlet').value)}`, '_blank'));
    sendBtn.addEventListener('click', async () => {
      sendBtn.disabled = true; $('#e-status').innerHTML = '<span class="spin"></span> Sending…';
      try {
        const r = await api('POST', `/api/reports/${latest.report_id}/email`, { to: $('#e-to').value.trim(), subject: $('#e-subject').value, message: $('#e-msg').value, fromName: $('#e-from').value.trim(), outlet: $('#e-outlet').value, consent: consent.checked });
        toast(r.emailStatus === 'sent' ? 'Email sent to ' + $('#e-to').value.trim() : 'Saved to outbox (no email provider configured)');
        render();
      } catch (e) { sendBtn.disabled = false; $('#e-status').innerHTML = `<div class="bad-box">${esc(e.message)}</div>`; }
    });
  }


  /* ---- Full-size report viewer ---- */
  function openViewer(a, latest) {
    const v = document.createElement('div'); v.className = 'viewer';
    v.innerHTML = `<div class="viewer-box" role="dialog" aria-modal="true" aria-label="Restore Profile">
      <div class="viewer-bar"><div><b>${esc(a.client_name)}</b> <span class="muted">· Restore Profile &amp; Plan</span></div>
        <div class="btn-row">${latest ? `<a class="btn ghost sm" href="/api/reports/${latest.report_id}/file" target="_blank">Open PDF</a>` : '<span class="small muted">Generate the PDF to download</span>'}<button class="icon-btn" type="button" data-x aria-label="Close"><svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7 7 17"/></svg></button></div></div>
      <iframe src="/api/assessments/${a.assessment_id}/report.html?screen=1" title="Full Restore Profile"></iframe></div>`;
    document.body.appendChild(v);
    const close = () => { v.classList.add('out'); setTimeout(() => v.remove(), 200); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    v.addEventListener('click', (e) => { if (e.target === v) close(); });
    $('[data-x]', v).addEventListener('click', close);
    document.addEventListener('keydown', onKey);
  }

  /* =====================================================================
     Rules (read-only view of the active configuration)
     ===================================================================== */
  route(/^\/rules$/, async () => {
    const c = await loadConfig(); const r = c.rules; const D = r.domains;
    const band = (b) => `${b.min == null ? '' : b.min}${b.min == null ? '<' + b.max : b.max == null ? '+' : ' – ' + (b.max - 0.01)}`;
    el2 = `<div class="page-head"><div><span class="eyebrow">Configuration</span><h1>Interpretation rules</h1><p class="muted">Active version <b>${esc(r.version)}</b>. Rules live in <code>rules/*.json</code>; each assessment records the version it was calculated with.</p></div></div>
      <div class="grid grid-3">
        <div class="panel"><h2>Stress Load</h2><table class="table rule-table">${D.stress.bands.map((b) => `<tr><td>${band(b)}</td><td>${b.outcome}</td><td><span class="pill s${b.severity}">${b.severity}</span></td></tr>`).join('')}</table></div>
        <div class="panel"><h2>Recovery Capacity</h2><table class="table rule-table">${D.recovery.bands.map((b) => `<tr><td>${band(b)}</td><td>${b.outcome}</td><td><span class="pill s${b.severity}">${b.severity}</span></td></tr>`).join('')}</table></div>
        <div class="panel"><h2>Circulation</h2><table class="table rule-table"><tr><th>Type</th><th>-30 to +5</th><th>+6 to +20</th><th>&gt;+20</th></tr>${Object.entries(D.circulation.matrix).map(([g, m]) => `<tr><td>${g.split('').join('-')}</td>${['favourable', 'monitor', 'review'].map((k) => `<td>${m[k][0]} <span class="pill s${m[k][1]}">${m[k][1]}</span></td>`).join('')}</tr>`).join('')}</table></div>
      </div>
      <div class="grid grid-2" style="margin-top:20px">
        <div class="panel"><h2>Programs</h2>${Object.entries(r.programs).map(([k, p]) => `<p><b>${k}</b>: ${p.components.map((c) => c.options.join(' OR ') + ' ' + c.duration).join(' + ')}<br><span class="small muted">Enhancer: ${esc(p.enhancer)}</span></p>`).join('')}</div>
        <div class="panel"><h2>Plan rules</h2><table class="table">${r.plan.map((p) => `<tr><td>${p.priorities} priorit${p.priorities === 1 ? 'y' : 'ies'}</td><td>${p.duration}</td><td>${p.frequency}</td></tr>`).join('')}</table><p class="small muted" style="margin-top:12px">Priority threshold: severity ≥ ${r.priority.threshold}. Maintain → ${r.priority.maintainProgram} Program.</p></div>
      </div>
      <div class="panel" style="margin-top:20px"><h2>Raw configuration</h2><pre class="json">${esc(JSON.stringify(r, null, 2))}</pre></div>`;
    app.innerHTML = el2;
  });
  let el2;

  /* =====================================================================
     Command palette (⌘K)
     ===================================================================== */
  const pal = $('[data-palette-root]'), palIn = $('[data-palette-input]'), palList = $('[data-palette-list]');
  const ACTIONS = [
    { t: 'New assessment', k: 'N', icon: ICON.plus, run: () => newAssessmentModal() },
    { t: 'Open board', k: 'B', icon: ICON.board, run: () => { filter = 'all'; go('/'); render(); } },
    { t: 'Assessments to confirm', k: 'C', icon: ICON.list, run: () => { filter = 'confirm'; go('/'); render(); } },
    { t: 'Ready to send', k: 'S', icon: ICON.mail, run: () => { filter = 'send'; go('/'); render(); } },
    { t: 'Clients', k: 'L', icon: ICON.user, run: () => go('/clients') },
    { t: 'Interpretation rules', k: 'R', icon: ICON.rules, run: () => go('/rules') },
    { t: 'Toggle activity panel', k: 'A', icon: ICON.bell, run: () => $('[data-inbox-toggle]').click() },
  ];
  let palItems = [], palIdx = 0;
  async function drawPalette() {
    const q = palIn.value.trim().toLowerCase();
    const acts = ACTIONS.filter((a) => !q || a.t.toLowerCase().includes(q));
    let clients = [];
    if (q) { try { clients = (await api('GET', '/api/clients?q=' + encodeURIComponent(q))).slice(0, 6); } catch {} }
    palItems = [...acts.map((a) => ({ ...a, group: 'Actions' })), ...clients.map((c) => ({ t: c.name, sub: `${c.assessments} assessment${c.assessments === 1 ? '' : 's'}`, icon: ava(c.name), run: () => go(`/client/${c.client_id}`), group: 'Clients' }))];
    palIdx = Math.min(palIdx, Math.max(0, palItems.length - 1));
    let lastGroup = '';
    palList.innerHTML = palItems.map((it, i) => { const g = it.group !== lastGroup ? `<div class="pl-label">${it.group}</div>` : ''; lastGroup = it.group; return `${g}<div class="pl-item ${i === palIdx ? 'on' : ''}" data-i="${i}">${it.icon}<span>${esc(it.t)}</span>${it.k ? `<kbd>${it.k}</kbd>` : it.sub ? `<small>${esc(it.sub)}</small>` : ''}</div>`; }).join('') || '<div class="ev-empty">No results</div>';
    $$('.pl-item', palList).forEach((el) => { el.addEventListener('mousemove', () => { if (palIdx !== +el.dataset.i) { palIdx = +el.dataset.i; $$('.pl-item', palList).forEach((x) => x.classList.toggle('on', x === el)); } }); el.addEventListener('click', () => runPal(+el.dataset.i)); });
  }
  function openPalette() { pal.hidden = false; palIn.value = ''; palIdx = 0; palIn.focus(); drawPalette(); }
  function closePalette() { pal.hidden = true; }
  function runPal(i) { const it = palItems[i]; if (!it) return; closePalette(); it.run(); }
  palIn.addEventListener('input', () => { palIdx = 0; drawPalette(); });
  palIn.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); palIdx = Math.min(palIdx + 1, palItems.length - 1); drawPalette(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); palIdx = Math.max(palIdx - 1, 0); drawPalette(); }
    else if (e.key === 'Enter') { e.preventDefault(); runPal(palIdx); }
  });
  pal.addEventListener('click', (e) => { if (e.target === pal) closePalette(); });
  $('[data-palette-close]').addEventListener('click', closePalette);
  $$('[data-palette]').forEach((b) => b.addEventListener('click', openPalette));
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal.hidden ? openPalette() : closePalette(); return; }
    if (e.key === 'Escape' && !pal.hidden) { closePalette(); return; }
    const typing = /input|textarea|select/i.test(document.activeElement?.tagName || '') || document.activeElement?.isContentEditable;
    if (!typing && pal.hidden && !e.metaKey && !e.ctrlKey && !e.altKey && !$('.modal-bg')) {
      const hit = ACTIONS.find((a) => a.k.toLowerCase() === e.key.toLowerCase());
      if (hit) { e.preventDefault(); hit.run(); }
    }
  });
  $('[data-new]').addEventListener('click', () => newAssessmentModal());

  /* ---- staff sign-in (when the server has it turned on) ---- */
  function showSignin() {
    const box = $('[data-signin]'); if (!box.hidden) return;
    box.hidden = false; $('#si-email').focus();
  }
  $('[data-signin-form]').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.currentTarget, btn = $('button[type=submit]', f), out = $('[data-signin-err]');
    btn.disabled = true; out.textContent = '';
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: f.email.value, password: f.password.value }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not sign in');
      location.reload();
    } catch (err) { out.textContent = err.message; btn.disabled = false; f.password.select(); }
  });
  $('[data-signout]').addEventListener('click', async (e) => {
    e.preventDefault();
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    location.hash = '#/'; location.reload();
  });
  (async () => {
    let me = { authEnabled: false };
    try { me = await (await fetch('/api/auth/me')).json(); } catch {}
    if (me.authEnabled && !me.staff) return showSignin();
    if (me.staff) {
      staffInput.value = me.staff.name; staffInput.readOnly = true; staffInput.title = me.staff.email;
      setAvatar(); $('[data-signout]').hidden = false;
    }
    render();
  })();
})();
