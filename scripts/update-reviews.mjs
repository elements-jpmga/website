// Refresh Google ratings/reviews and rebuild the site.
// Run on a schedule (e.g. daily cron / GitHub Action):  GOOGLE_PLACES_API_KEY=... npm run reviews
import { execSync } from 'node:child_process';
import { fetchGoogleReviews, saveSnapshot } from '../server/google-reviews.mjs';
const data = await fetchGoogleReviews();
saveSnapshot(data);
console.log(`Google reviews: ${data.total} reviews, ${data.average}★ average — ` + data.places.map((p) => `${p.name} ${p.rating} (${p.count})`).join(', '));
execSync('node build.mjs', { stdio: 'inherit' });
