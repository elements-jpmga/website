# Elements Restore — staff web app (MVP)

Upload UBIO reports → confirm the extracted readings → run the Restore Interpretation Engine → choose the permitted treatment options → generate the client-facing Restore Profile / Restore Plan PDF.

```bash
cd restore
npm run setup     # compiles the OCR tool (Apple Vision, offline) and installs playwright-core
npm start         # http://localhost:4400
npm test          # engine acceptance tests (spec §13 + band edges)
npm run test:extract   # extraction check against the Leslie sample PDFs
```

Requirements on a laptop: Node 22.5+, `python3` with PyMuPDF (rasterises PDF pages) and Chrome (PDF output). OCR uses Apple Vision on a Mac when `npm run setup` has built `tools/ocr`, and Tesseract (bundled English model in `tools/tessdata`, nothing downloaded) everywhere else. With no environment variables set, data stays on the laptop (SQLite + `data/`) and sign-in is off.

## Going live (assess.elements.com.sg)
Render runs the `Dockerfile` (Playwright image with Chromium + PyMuPDF + Tesseract). Supabase provides Postgres, private file storage and staff sign-in. With `NODE_ENV=production` (set in the Dockerfile) the server refuses to start unless all of these are set:

| Variable | From |
|---|---|
| `DATABASE_URL` | Supabase → Connect → Session pooler URI (password filled in) |
| `SUPABASE_URL` | Supabase → Project Settings → Data API → Project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys → Publishable key (legacy `SUPABASE_ANON_KEY` also accepted) |
| `SUPABASE_SECRET_KEY` | Supabase → Project Settings → API Keys → Secret key (legacy `SUPABASE_SERVICE_ROLE_KEY` also accepted). Server only. |
| `RESEND_API_KEY`, `MAIL_FROM` | Resend (email is refused online until this is set) |

On first start the server creates its tables (row level security on, no access for Supabase's public Data API roles) and a private storage bucket `restore-files`. Staff accounts are created in Supabase → Authentication → Users; public sign-up should be turned off. Health check: `GET /healthz`.

## How it maps to the build spec
| Spec | Where |
|---|---|
| §3 Required inputs, §11 no result without confirmation | `POST /api/assessments/:id/confirm` refuses unless `confirmed: true`; the Confirm screen shows each value beside the source page image with the OCR line it came from, and records corrections + staff name. |
| §4 Interpretation engine, §5 priorities, §7 plan | `rules/v1.json` (thresholds, matrix, programs, plan, report copy) + `src/engine.mjs` (pure, config-driven). Each assessment stores the `rules_version` it was calculated with. |
| §6 Fixed programs, OR-options only | `PUT /api/assessments/:id/selections/:program` rejects anything outside the defined options; Component 3 is part of the primary treatment; the enhancer is a separate optional tick. |
| §8 Client report | `src/report.mjs` — HTML template mirroring `03_Elements_Restore_Profile_Leslie_v5.pdf`, printed to A4 PDF. |
| §9 Screens | `public/` — Assessments, Upload, Confirm readings, Results, Recommendation, Suitability/notes, Report, client History; plus a read-only Rules page. |
| §10 Data model | `src/db.mjs` — Postgres (Supabase) or SQLite tables: clients, assessments, uploads (originals kept, SHA-256), confirmed_readings, domain_results, priorities, program_selections, plans, reports, rule_sets. |
| §13 Acceptance tests | `tests/engine.test.mjs` — Leslie, Maintain, two-priority, three-priority, spreadsheet example, band edges, invalid input. |

## Extraction
The UBIO PDFs are scanned images (no text layer). Page 1 is rasterised at 200 dpi and OCR'd with Apple Vision (`tools/ocr.swift`). Field rules in `src/extract.mjs`:
- Stress Index: the large number in the left column beneath the "Stress Index" tab.
- Pulse Complexity: `Complexity = <n>` on the Pulse Variability line.
- Vascular Age Index / Type: the Measurement column beside the row label in "Result of Measurement", cross-checked against the "Previous Test Results" table.
- Name / sex / age from the `name / Male / 53 years` line; date/time from the header.
Anything missing or low-confidence is flagged for manual entry — never guessed. Other UBIO values (LF/HF, SDNN, average pulse…) are archived only and do not affect results.

## Rules changes
Add a new file `rules/v2.json` (bump `version`). The newest file becomes active for new assessments; old assessments keep their version so historical reports stay reproducible. Phase 2: an admin UI to edit this in the browser.

## Not in this MVP (Phase 2)
Restore Review trend charts, supplements/lifestyle libraries, CRM/booking integration, admin editor for rules.

## Emailing the report to the client
After the PDF is generated, the Report step has an **Email the report to the client** panel: client email (remembered on the client record), consultant name, outlet, subject and message, plus a consent tick box. The client receives the PDF as an attachment only — no link into the system. Every send is logged (to, by whom, when, provider, status) under **Email history**.

Provider is picked from the server environment:
| Setting | Provider |
|---|---|
| `RESEND_API_KEY` | Resend (recommended — HTTPS, no SMTP setup) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (`SMTP_SECURE=1` for port 465) | Any mailbox, e.g. Google Workspace / Microsoft 365 |
| none | Outbox mode: the email is written to `data/outbox/*.eml` (openable in Mail/Outlook) so the flow can be tested |

`MAIL_FROM` (default `Elements Wellness <restore@elements.com.sg>`) and `MAIL_REPLY_TO` (default `ask@elements.com.sg`) set the sender. The sending domain must be verified with the provider before real sends.

## Gift vouchers (Elements' own system, replacing Gift Up)
Staff app → **Gift vouchers** (`public/gift.js`, API in `src/gift/`). Tables `gift_*` live beside the Restore tables.
- **WESS codes:** each item has a pool of running numbers generated in WESS (`gift_codes`). A sale takes the oldest unused code. Pools are topped up by pasting/uploading codes (duplicates skipped). At or below the item's alert level (default 10) an alert opens in the app and an email goes to `notify_emails`.
- **Issue:** staff (counter / complimentary) via Vouchers → Issue; website purchases arrive through Stripe (`STRIPE_*`, phase 2). Each voucher gets an A5 e-voucher PDF (card design + value + QR + code + terms), emailed to the recipient now or on a chosen date; the buyer gets a receipt; Elements gets a "voucher sold" email.
- **Redeem:** staff look up the code (dashboard or scan) and mark it redeemed at an outlet — no partial use. Then redeem in WESS as usual.
- **Card designs:** Canva custom size 1800 × 1200 px (3:2), JPG/PNG under 4 MB, keep text 100 px from the edges and the lower third clear.
- **Gift Up migration:** `GIFTUP_API_KEY` (read-only key) → Vouchers → Settings → Import. Copies every voucher, order, unused code and the card design; re-running only adds what is new.
- Public endpoints for the website: `GET /api/gift/public/catalog`, `GET /api/gift/public/check?code=`, `POST /api/gift/public/checkout` (creates a Stripe Checkout session), `GET /api/gift/public/order?session_id=` (thank-you page), `POST /api/gift/stripe/webhook`.
- **Stripe:** `STRIPE_SECRET_KEY` (sk_test_/sk_live_), `STRIPE_WEBHOOK_SECRET` (from Developers → Webhooks → endpoint `https://assess.elements.com.sg/api/gift/stripe/webhook`, event `checkout.session.completed`). Without a key the website shows vouchers but says online payment is not switched on. `PUBLIC_SITE_URL` (default https://elements.com.sg) is where Stripe returns customers; `PUBLIC_SITE_ORIGINS` adds extra allowed origins. The website page (`src/assets/js/gift.js`) talks to the staff app; locally it uses http://localhost:4400.
