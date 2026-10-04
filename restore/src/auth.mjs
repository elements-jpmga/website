// Staff sign-in with Supabase Auth (email + password). The browser never sees a Supabase key:
// the server signs in on the staff member's behalf and keeps the session in httpOnly cookies.
// Without SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY (a laptop), sign-in is off and the typed staff name is used.
const URL_ = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '';
export const enabled = Boolean(URL_ && KEY);

const AT = 'rs_at', RT = 'rs_rt';
const cache = new Map(); // access token → { user, until } — rechecked with Supabase at least every minute
const TTL = 60e3;
const failures = new Map(); // ip → [timestamps]

const cookies = (req) => Object.fromEntries((req.headers.cookie || '').split(/;\s*/).filter(Boolean).map((c) => { const i = c.indexOf('='); return [c.slice(0, i), decodeURIComponent(c.slice(i + 1))]; }));
const secure = (req) => (req.headers['x-forwarded-proto'] || '').toString().startsWith('https') || process.env.NODE_ENV === 'production';
const cookie = (req, name, value, maxAge) => `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure(req) ? '; Secure' : ''}`;
const expOf = (jwt) => { try { return JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString()).exp * 1000; } catch { return 0; } };
export const ipOf = (req) => (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();

async function gotrue(pathname, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${URL_}/auth/v1/${pathname}`, { method, headers: { apikey: KEY, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

const staffOf = (u) => ({ id: u.id, email: u.email, name: (u.user_metadata?.name || u.user_metadata?.display_name || u.user_metadata?.full_name || u.email.split('@')[0]).toString().slice(0, 80) });

function setSession(req, res, s) {
  res.setHeader('Set-Cookie', [cookie(req, AT, s.access_token, s.expires_in || 3600), cookie(req, RT, s.refresh_token, 60 * 60 * 24 * 14)]);
  cache.set(s.access_token, { user: staffOf(s.user), until: Math.min(expOf(s.access_token) || Infinity, Date.now() + TTL) });
}

// Returns the signed-in staff member, refreshing an expired session when possible; null when signed out.
export async function currentStaff(req, res) {
  const c = cookies(req);
  if (c[AT]) {
    const hit = cache.get(c[AT]);
    if (hit && hit.until > Date.now() + 5000) return hit.user;
    if (expOf(c[AT]) > Date.now() + 5000) {
      const r = await gotrue('user', { token: c[AT] });
      if (r.ok) { const user = staffOf(r.data); cache.set(c[AT], { user, until: Math.min(expOf(c[AT]), Date.now() + TTL) }); return user; }
    }
  }
  if (c[RT]) {
    const r = await gotrue('token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: c[RT] } });
    if (r.ok) { setSession(req, res, r.data); return staffOf(r.data.user); }
  }
  return null;
}

export async function login(req, res, { email, password }) {
  const ip = ipOf(req), t = Date.now();
  const recent = (failures.get(ip) || []).filter((x) => t - x < 15 * 60e3);
  const all = [...failures.values()].flat().filter((x) => t - x < 15 * 60e3).length; // forwarded IPs can be spoofed, so also cap globally
  if (recent.length >= 8 || all >= 40) return { status: 429, error: 'Too many attempts. Please wait 15 minutes and try again.' };
  const r = await gotrue('token?grant_type=password', { method: 'POST', body: { email: String(email || '').trim(), password: String(password || '') } });
  if (!r.ok) { failures.set(ip, [...recent, t]); return { status: 401, error: 'Email or password is incorrect' }; }
  failures.delete(ip);
  setSession(req, res, r.data);
  return { status: 200, staff: staffOf(r.data.user) };
}

export async function logout(req, res) {
  const c = cookies(req);
  if (c[AT]) {
    // Supabase signs the person out everywhere; forget every cached session of theirs too
    const who = cache.get(c[AT])?.user.id;
    for (const [k, v] of cache) if (k === c[AT] || (who && v.user.id === who)) cache.delete(k);
    await gotrue('logout', { method: 'POST', token: c[AT] }).catch(() => {});
  }
  res.setHeader('Set-Cookie', [cookie(req, AT, '', 0), cookie(req, RT, '', 0)]);
}

export async function changePassword(req, password) {
  const c = cookies(req);
  if (String(password || '').length < 10) return { status: 422, error: 'Use at least 10 characters' };
  const r = await gotrue('user', { method: 'PUT', token: c[AT], body: { password } });
  return r.ok ? { status: 200 } : { status: r.status, error: r.data.msg || r.data.error_description || 'Could not change the password' };
}
