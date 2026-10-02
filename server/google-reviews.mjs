// Fetches each outlet's Google rating, review count and latest reviews from the
// Google Places API (New). Needs GOOGLE_PLACES_API_KEY (Places API enabled, billing on).
// Used by: serve.mjs  → GET /api/reviews (live, cached in memory)
//          scripts/update-reviews.mjs → refreshes src/data/google-reviews.json before a build
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT = path.join(root, 'src/data/google-reviews.json');

// How each outlet is found on Google. Place IDs are resolved once and remembered in the snapshot.
const OUTLETS = [
  { id: 'centrepoint', name: 'The Centrepoint', query: 'Elements Wellness Centrepoint, 176 Orchard Rd, Singapore' },
  { id: '313', name: '313@somerset', query: 'Elements Wellness 313@Somerset, 313 Orchard Rd, Singapore' },
  { id: 'ion', name: 'ION Orchard', query: 'Elements ION Orchard, 2 Orchard Turn, Singapore' },
];
const FIELDS = 'id,displayName,rating,userRatingCount,reviews,googleMapsUri';

const shortName = (n = '') => { const p = n.trim().split(/\s+/); return p.length < 2 ? n : `${p[0]} ${p[p.length - 1][0].toUpperCase()}.`; };
const trim = (t = '', n = 300) => { t = t.replace(/\s+/g, ' ').trim(); if (t.length <= n) return t; const c = t.slice(0, n); const m = Math.max(c.lastIndexOf('. '), c.lastIndexOf('! '), c.lastIndexOf('.'), c.lastIndexOf('!')); return m > 80 ? c.slice(0, m + 1) : c.replace(/\s+\S*$/, '') + '…'; };

async function placesFetch(url, key, init = {}) {
  const res = await fetch(url, { ...init, headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': init.fieldMask || FIELDS, 'Content-Type': 'application/json', ...(init.headers || {}) } });
  if (!res.ok) throw new Error(`Places API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function resolvePlaceId(o, key) {
  const d = await placesFetch('https://places.googleapis.com/v1/places:searchText', key, { method: 'POST', fieldMask: 'places.id,places.displayName', body: JSON.stringify({ textQuery: o.query, regionCode: 'SG', maxResultCount: 1 }) });
  const id = d.places?.[0]?.id; if (!id) throw new Error(`No Google place found for ${o.query}`);
  return id;
}

export async function fetchGoogleReviews(key = process.env.GOOGLE_PLACES_API_KEY) {
  if (!key) throw new Error('GOOGLE_PLACES_API_KEY is not set');
  const prev = fs.existsSync(SNAPSHOT) ? JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8')) : { places: [] };
  const places = [];
  for (const o of OUTLETS) {
    const before = prev.places.find((p) => p.id === o.id) || {};
    const placeId = before.placeId || (await resolvePlaceId(o, key));
    const d = await placesFetch(`https://places.googleapis.com/v1/places/${placeId}`, key);
    const fresh = (d.reviews || [])
      .filter((r) => r.rating >= 5 && (r.text?.text || '').length >= 60) // show only 5-star reviews with some substance
      .map((r) => ({ author: shortName(r.authorAttribution?.displayName), when: r.relativePublishTimeDescription, rating: r.rating, text: trim(r.text.text), uri: r.authorAttribution?.uri }));
    // keep curated reviews too, newest (from Google) first, no duplicates
    const seen = new Set(); const reviews = [...fresh, ...(before.reviews || [])].filter((r) => { const k = r.author + r.text.slice(0, 40); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 6);
    places.push({ ...before, id: o.id, name: o.name, googleName: d.displayName?.text || before.googleName, placeId, rating: d.rating, count: d.userRatingCount, mapsUrl: d.googleMapsUri || before.mapsUrl, writeReviewUrl: `https://search.google.com/local/writereview?placeid=${placeId}`, reviews });
  }
  const total = places.reduce((a, p) => a + p.count, 0);
  const average = places.reduce((a, p) => a + p.rating * p.count, 0) / total;
  return { source: 'Google Places API', snapshotDate: new Date().toISOString().slice(0, 10), total, average: Math.round(average * 10) / 10, averageExact: Math.round(average * 1000) / 1000, places };
}

export function saveSnapshot(data) { fs.writeFileSync(SNAPSHOT, JSON.stringify(data, null, 1)); }
