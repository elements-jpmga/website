// Tiny zero-dependency static server for previewing dist/ (mirrors pretty URLs + 404 + _redirects).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fetchGoogleReviews } from './server/google-reviews.mjs';
const root = path.resolve('dist');
const port = +process.env.PORT || 4321;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.xml': 'application/xml', '.txt': 'text/plain', '.json': 'application/json' };
const redirects = Object.fromEntries((fs.existsSync(path.join(root, '_redirects')) ? fs.readFileSync(path.join(root, '_redirects'), 'utf8') : '').split('\n').filter(Boolean).map((l) => l.split(' ')));
// Live Google ratings: /api/reviews (cached 6 hours). Without an API key the page keeps its built-in snapshot.
let reviewCache = { at: 0, data: null };
async function apiReviews(res) {
  if (!process.env.GOOGLE_PLACES_API_KEY) { res.writeHead(404, { 'Content-Type': 'application/json' }); return res.end('{"error":"GOOGLE_PLACES_API_KEY not set"}'); }
  try {
    if (!reviewCache.data || Date.now() - reviewCache.at > 6 * 3600e3) reviewCache = { at: Date.now(), data: await fetchGoogleReviews() };
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' }); res.end(JSON.stringify(reviewCache.data));
  } catch (e) { res.writeHead(502, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e.message })); }
}
http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/api/reviews') return apiReviews(res);
  if (redirects[url]) { res.writeHead(301, { Location: redirects[url] }); return res.end(); }
  let file = path.join(root, url);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!url.endsWith('/')) { res.writeHead(301, { Location: url + '/' }); return res.end(); }
    file = path.join(file, 'index.html');
  }
  if (!fs.existsSync(file)) { res.writeHead(404, { 'Content-Type': types['.html'] }); return fs.createReadStream(path.join(root, '404.html')).pipe(res); }
  res.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Elements Wellness preview → http://localhost:${port}`));
