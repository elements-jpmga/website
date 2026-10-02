# Elements Wellness: content extraction notes

Source: https://elements.com.sg/ (WordPress + Elementor + WooCommerce), fetched 2026-09-29. The structured data is in `content.json`.

## What's captured
- **Story** (/our-story/): the full text, the mission line and key facts (a million+ massages, 4 rooms grown to "almost 100 rooms", the Olympian anecdote). Also the homepage headline ("Where Wellness Meets Results"), its signature treatments and a few testimonials.
- **Outlets**: 3 locations. Hours are the same everywhere: Mon–Fri 11am–9:00pm; Weekends & PH 10:30am–8:00pm.
  | Outlet | Address | Phone | WhatsApp | Email |
  |---|---|---|---|---|
  | ION Orchard | #B1-30, 2 Orchard Turn, S238801 | 6738 3788 | 8938 2878 | ion@elements.com.sg |
  | 313@somerset | #B2-50/51, 313 Orchard Road, S238895 | 6636 8878 | 8875 1677* | 313@elements.com.sg |
  | The Centrepoint | #02-28, 176 Orchard Road, S238843 | 6737 8488 | 9357 8183 | cpoint@elements.com.sg |
  \*The /services/massage/ page lists 313 WhatsApp as **9669 6460**, but the contact page and footer say 8875 1677.
  - Services tied to one outlet: Koyamaki Onsen is Centrepoint only. Chill & Heal (contrast/ice bath), Herbal Bath and Chiropractic are 313 only.
- **Awards**: 48 entries, 2014–2026. Each has year, publication, category, award label, treatment, description and "learn more" link. The publications are Daily Vanity, Beauty Insider, Harper's Bazaar, Her World, Singapore Women's Weekly and ELLE.
- **Promotions**: 17 priced items with first-visit, web-promo and usual (U.P.) prices, plus the T&Cs. All prices are after GST, and first-trial pricing is for local first-time visitors.
- **Gift vouchers**: 10 items, from $100/$200/$300 cash vouchers up to a Couple Aromatherapy massage at SGD 195. This is a Gift Up! iframe widget, so I read it from a rendered browser view. Nothing was clicked or bought.
- **FAQ**: 6 Q&As.
- **Blog**: only 3 posts exist (the WP REST API confirms a total of 3): Men's Facial (2024-07-23), Pearl Light Facial (2024-05-30) and Massage & Herbal Volcanic Mud (2023-04-24).
- **Services**: every item in the nav.
  - Massage: 10 nav items, plus Muscle & Joint Vitality and Menopause from the category page.
  - Facial: 18 treatments, plus the 6 concern pages and the older treatments listed on the category page.
  - Wellness: 10 items.
  - Slimming: 5 items.
  - Spa Ritual: 3 items.
  - Each has name, URL, a short description, concerns, duration and price where the site gives them.
- **Images**: 61 URLs, all checked and returning 200. They cover outlet interiors and shopfronts, onsen suites, jacuzzis, couple and single treatment rooms, the contrast-therapy room, in-house therapist photos (Acu-Wave, fascia, facials), key visuals and products (Antedote oils, shower gel and lotion; Clarity Skin Lab ampoules and serum).

## Gaps and inconsistencies (don't invent)
- **No price or duration listed** for these: Omega Light Therapy, Medi-Stretch, Meridian Flush, TCM Slimming, TCM Tummy Trim, 3D Cavitation, 3D Fat Freeze and Massage Enhancements. INDIBA pages use the Promotions "INDIBA Body Therapy" price (30 min, $109 first visit / $188 web / U.P. $400).
- **Price conflicts** (both values are recorded in the JSON):
  - AquaGlow U.P.: $218 on its page vs $118 on Promotions.
  - Power Dose U.P.: $288 on its page vs $188 on Promotions.
  - Meridian Bojin: the banner says $128, the form option says $88.
  - Body massage first-trial U.P.: $153 on the massage category page vs $158 elsewhere.
- **Pages with no content**:
  - /services/ and /spa-ritual/ have empty main content.
  - /services/massage/menopause-massage/ returns 404, even though the category page links to it.
- **Old pages**: the /services/wellness/ and /services/facial/ category pages still list older treatments (Power Moxa, Hyperwave, ACE Face Shaper, Biocell, etc.) that aren't in the current nav. They're kept under `servicesExtra`.
- **Wrong award link**: the Probiotic Facial award's "learn more" points to the Lymphatic Drainage page. The correct page is noted in the JSON.
- **Unclear founding date**: the story says "more than a decade ago", while the acne page claims "over 24 years" of experience.
- **Stock images**: many images are stock (shutterstock_*). The real in-house photos are flagged "In-house photo" in their descriptions. Award logos and icons were left out.
- **Not captured**: the voucher T&Cs (collapsed in the widget) and the full body text of each service page (only summaries). The raw page text is in the session scratchpad if more is needed.
