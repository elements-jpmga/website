// File storage for uploaded UBIO PDFs, page previews and generated reports.
// Supabase Storage (private bucket) when SUPABASE_URL + SUPABASE_SECRET_KEY are set, the local data folder otherwise.
// Keys look like "uploads/<assessment>/<upload>.pdf"; rows created before this module may hold absolute local paths.
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from './db.mjs';

const URL_ = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BUCKET = process.env.SUPABASE_BUCKET || 'restore-files';
export const remote = Boolean(URL_ && KEY);
export const storageKind = remote ? 'supabase' : 'local';

const headers = (extra = {}) => ({ apikey: KEY, Authorization: `Bearer ${KEY}`, ...extra });
const objectUrl = (key) => `${URL_}/storage/v1/object/${BUCKET}/${key.split('/').map(encodeURIComponent).join('/')}`;
const localPath = (key) => (path.isAbsolute(key) ? key : path.join(DATA_DIR, key));

// Creates the private bucket on first start so nothing has to be clicked in the dashboard.
export async function ensureBucket() {
  if (!remote) return;
  const res = await fetch(`${URL_}/storage/v1/bucket/${BUCKET}`, { headers: headers() });
  if (res.ok) {
    const b = await res.json();
    if (b.public) throw new Error(`Storage bucket "${BUCKET}" is public. Make it private in Supabase → Storage before going live.`);
    return;
  }
  const made = await fetch(`${URL_}/storage/v1/bucket`, { method: 'POST', headers: headers({ 'Content-Type': 'application/json' }), body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false, file_size_limit: 30 * 1024 * 1024 }) });
  if (!made.ok) throw new Error(`Could not create storage bucket "${BUCKET}": ${res.status}/${made.status} ${await made.text()}`);
}

export async function put(key, buf, contentType) {
  if (!remote) { const p = localPath(key); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, buf); return key; }
  const res = await fetch(objectUrl(key), { method: 'POST', headers: headers({ 'Content-Type': contentType, 'x-upsert': 'false' }), body: buf });
  if (!res.ok) throw new Error(`Storage upload failed (${res.status}): ${await res.text()}`);
  return key;
}

export async function get(key) {
  if (!key) return null;
  if (!remote || path.isAbsolute(key)) { const p = localPath(key); return fs.existsSync(p) ? fs.readFileSync(p) : null; }
  const res = await fetch(objectUrl(key), { headers: headers() });
  if (res.status === 404 || res.status === 400) return null;
  if (!res.ok) throw new Error(`Storage download failed (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}
