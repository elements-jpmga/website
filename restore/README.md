# Elements Restore — staff web app (MVP)

Upload UBIO reports → confirm the extracted readings → run the Restore Interpretation Engine → choose the permitted treatment options → generate the client-facing Restore Profile / Restore Plan PDF.

```bash
cd restore
npm run setup     # compiles the OCR tool (Apple Vision, offline) and installs playwright-core
npm start         # http://localhost:4400
npm test          # engine acceptance tests (spec §13 + band edges)
npm run test:extract   # extraction check against the Leslie sample PDFs
```

Requirements: macOS (the OCR tool uses the built-in Vision framework), Node 22.5+, `python3` with PyMuPDF (used to rasterise PDF pages), and Chrome (used for PDF output; the Playwright Chrome-for-Testing build or the installed Google Chrome).

## How it maps to the build spec
| Spec | Where |
|---|---|
| §3 Required inputs, §11 no result without confirmation | `POST /api/assessments/:id/confirm` refuses unless `confirmed: true`; the Confirm screen shows each value beside the source page image with the OCR line it came from, and records corrections + staff name. |
| §4 Interpretation engine, §5 priorities, §7 plan | `rules/v1.json` (thresholds, matrix, programs, plan, report copy) + `src/engine.mjs` (pure, config-driven). Each assessment stores the `rules_version` it was calculated with. |
| §6 Fixed programs, OR-options only | `PUT /api/assessments/:id/selections/:program` rejects anything outside the defined options; Component 3 is part of the primary treatment; the enhancer is a separate optional tick. |
| §8 Client report | `src/report.mjs` — HTML template mirroring `03_Elements_Restore_Profile_Leslie_v5.pdf`, printed to A4 PDF. |
| §9 Screens | `public/` — Assessments, Upload, Confirm readings, Results, Recommendation, Suitability/notes, Report, client History; plus a read-only Rules page. |
| §10 Data model | `src/db.mjs` — SQLite tables: clients, assessments, uploads (originals kept, SHA-256), confirmed_readings, domain_results, priorities, program_selections, plans, reports, rule_sets. |
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
Restore Review trend charts, supplements/lifestyle libraries, CRM/booking integration, multi-user login (staff name is recorded from the header field), admin editor for rules.

## Emailing the report to the client
After the PDF is generated, the Report step has an **Email the report to the client** panel: client email (remembered on the client record), consultant name, outlet, subject and message, plus a consent tick box. The client receives the PDF as an attachment only — no link into the system. Every send is logged (to, by whom, when, provider, status) under **Email history**.

Provider is picked from the server environment:
| Setting | Provider |
|---|---|
| `RESEND_API_KEY` | Resend (recommended — HTTPS, no SMTP setup) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (`SMTP_SECURE=1` for port 465) | Any mailbox, e.g. Google Workspace / Microsoft 365 |
| none | Outbox mode: the email is written to `data/outbox/*.eml` (openable in Mail/Outlook) so the flow can be tested |

`MAIL_FROM` (default `Elements Wellness <restore@elements.com.sg>`) and `MAIL_REPLY_TO` (default `ask@elements.com.sg`) set the sender. The sending domain must be verified with the provider before real sends.
