# Elements Wellness — website revamp + Elements Restore app

This repository holds two projects for Elements Wellness (Singapore):

| Folder | What it is | Run |
|---|---|---|
| `/` (root) | **Website revamp** — static site generator for elements.com.sg (157 pages, same sitemap and content as the current site, new design) | `npm run dev` → http://localhost:4321 |
| `restore/` | **Elements Restore** — staff-only web app: upload UBIO PDFs → confirm readings → Restore engine → client Restore Profile PDF → email to client | `cd restore && npm run setup && npm start` → http://localhost:4400 |

Requirements: Node.js 22.5+. The Restore app also needs macOS (PDF text recognition uses Apple Vision), Python 3 with PyMuPDF, and Google Chrome (for PDF output).

**Not in this repository (by design):** the client's developer pack (build spec, interpretation-engine Excel, sample UBIO and Restore Profile PDFs — confidential), Restore runtime data (`restore/data/`: client records, uploads, reports), and build output (`dist/`). Place the developer pack folder `Elements_Restore_Web_App_Developer_Pack/` in the project root to run `npm run test:extract`.

---

# Elements Wellness — website revamp (front-end)

Static, SEO-first rebuild of elements.com.sg, following the Brilliance Advisory proposal (3 Sep 2026).

```
npm run dev      # build → dist/ and preview at http://localhost:4321
npm run build    # build only
```

## Structure
- `build/data.mjs`: all content (services, concerns, outlets, awards, promos, blog, products). It is seeded from the live site crawl in `_research/`. In production this is the CMS.
- `build/ui.mjs`: the shell (header + mega menu, mobile menu, treatment finder, footer, SEO head).
- `build/pages/`: page templates. `build.mjs` writes **132 pages**, `sitemap.xml`, `robots.txt` and `_redirects`.
- `src/assets/css/main.css`: design system (v2, Clarté Med-style reference): Manrope in light sentence case with fading-word headlines, pill labels, rounded photo cards, maroon → wine gradients. The wordmark keeps the logo's tracked Quicksand capitals. Palette: Elements maroon `#72181B`.
- `src/assets/js/main.js`: all motion — preloader, fade / drop-in reveals, the steam-to-spa hero (canvas; the pointer parts the steam), Lenis smooth scroll, the fanned photo stack, the Google-review carousel (auto-advancing, with placeholder guest photos) plus review marquee, steps image crossfade, five-elements ring, concern hover-image list, magnetic buttons, page-transition fade and the finder overlay. Motion respects `prefers-reduced-motion`.

## URLs
Every existing service URL is retained, including root-level ones like `/medi-stretch/` and `/indiba-slimming/`, the facial concern pages and the three blog posts at `/2024/07/23/...`. Legacy award links (`/onsen/`, `/massage/` …) 301 via `_redirects`.

## Needs Elements Wellness input (flagged in the UI)
- Finder concern list and concern→treatment mapping. The current list is a draft (`concerns` in data.mjs).
- Supplement products, pricing and images. These are placeholders.
- Health Analysis report layout and key points. The page uses an illustrative sample.
- Price conflicts on the live site, for example AquaGlow U.P. $218 vs $118, Power Dose $288 vs $188, and the 313 WhatsApp number.
- Full policy texts. Longer service-page body copy.

## Backend (phase 2)
Forms (booking, contact, vouchers, newsletter) are front-end only (`data-demo`). They are to be wired to the backend: client analyses, promotions/promo codes, gift cards, CMS and products.

## Elements Restore app
The staff-facing Restore assessment app lives in [restore/](restore/README.md) (`cd restore && npm start` → http://localhost:4400).

## Google reviews (always up to date)
- Snapshot: `src/data/google-reviews.json` — each outlet's Google rating, review count and selected 5-star reviews (collected 30 Sep 2026: Centrepoint 4.6 (572), 313@somerset 4.5 (416), ION Orchard 4.3 (306) → 1,294 reviews, 4.5 average).
- Live: set `GOOGLE_PLACES_API_KEY` (Google Maps Platform, Places API (New) enabled) on the server. `GET /api/reviews` then returns the current numbers (cached 6 h) and the page updates the rating, counts and "Write a review" links on load. Without a key, the page shows the snapshot.
- Scheduled refresh: `GOOGLE_PLACES_API_KEY=... npm run reviews` refreshes the snapshot and rebuilds — run daily via cron / CI.
- The Places API returns at most 5 reviews per place. To show every review (and reply to them), use the Google Business Profile API with the owner's account instead.
- To switch the live reviews call on in production, build with `LIVE_REVIEWS=1 node build.mjs` (adds a meta flag the page checks before calling `/api/reviews`).
