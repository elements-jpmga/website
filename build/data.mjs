// Site content. In production these lists are managed in the CMS; here they
// are seeded from the live elements.com.sg (crawled into _research/) so every
// existing URL, award, price and article is retained.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => (fs.existsSync(path.join(root, p)) ? fs.readFileSync(path.join(root, p), 'utf8') : '');
const research = JSON.parse(read('_research/content.json') || '{}');

const img = (n) => `/assets/img/${n}`;
const slugify = (s) => s.toLowerCase().replace(/[’'®]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const norm = (u = '') => u.replace(/^https?:\/\/[^/]+/, '').split('#')[0].replace(/\/?$/, '/');
const lastSeg = (u = '') => norm(u).split('/').filter(Boolean).pop() || '';

export const site = {
  url: 'https://elements.com.sg',
  email: 'ask@elements.com.sg',
  whatsapp: 'https://wa.me/6589499605',
  massages: '1M+',
  footerBlurb: 'Award-winning spa and wellness on Orchard Road — where feeling good and real results go hand in hand.',
  hoursSummary: 'Open daily. Mon–Fri 11am–9pm · Weekends & PH 10:30am–8pm.',
  announcements: ['First-visit body massage $69', 'Koyamaki Onsen Ritual from $165 · The Centrepoint', 'New · Health Analysis', 'Chill & Heal contrast ritual · 313@somerset', 'Quote “website promotion” when booking'],
  socials: [
    { label: 'Instagram', icon: 'ig', url: 'https://www.instagram.com/elementswellness_sg/' },
    { label: 'Facebook', icon: 'fb', url: 'https://www.facebook.com/ElementsWellness.SG' },
    { label: 'YouTube', icon: 'yt', url: 'https://www.youtube.com/channel/UCC7rJ7aQC6xVIeqReQmVmFw' },
    { label: 'TikTok', icon: 'tt', url: 'https://www.tiktok.com/@elementswellness_sg' },
    { label: 'Xiaohongshu', icon: 'xhs', url: 'https://www.xiaohongshu.com/user/profile/6624711a000000000700546f' },
  ],
};

/* About each outlet (facts from the current site: facilities, exclusive rituals, photos) */
const outletAbout = {
  ion: {
    intro: 'Our ION Orchard spa is at basement level B1 of ION Orchard, directly connected to Orchard MRT — an easy escape between meetings, shopping or the commute home.',
    about: ['Step in from the mall into a calm reception and private treatment rooms, where our therapists offer the full Elements menu: therapeutic massage, results-driven facials, TCM wellness therapies and slimming treatments.', 'At ION Orchard, the Fire element of The 5 Elements Massage is paired with Red Light Therapy, a technology that works at the cellular level to support circulation and recovery.'],
    highlights: ['Directly connected to Orchard MRT', 'Full massage, facial, wellness and slimming menu', 'Red Light Therapy enhancement for the 5 Elements Massage (Fire)', 'Open daily, including weekends and public holidays'],
    gallery: ['ion-interior.jpg', 'ion-storefront.jpg', 'aquaglow.jpg'],
  },
  centrepoint: {
    intro: 'The Centrepoint is home to our private Koyamaki Onsen suites — authentic Japanese Koyamaki baths where you soak, scrub and unwind in complete privacy.',
    about: ['Level up your spa experience with Onsen Therapy in a private suite: a 40-minute Koyamaki onsen, a 60-minute Ocha body massage and a back scrub, for one or for two.', 'The Couple Koyamaki Onsen ritual has been recognised by Beauty Insider (Best Couple Wellness Ritual Experience 2026, Best Couple Spa 2024), Singapore Women\u2019s Weekly and Daily Vanity. Onsen and jacuzzi bookings are made by WhatsApp with the outlet.'],
    highlights: ['Private Koyamaki Onsen suites', 'Solo and couple onsen rituals', 'Couple jacuzzi suite', 'Full massage, facial, wellness and slimming menu'],
    gallery: ['onsen-1.jpg', 'couple-onsen-2.jpg', 'jacuzzi.jpg'],
  },
  '313': {
    intro: 'At 313@somerset, recover like an athlete with our Chill & Heal contrast therapy — alternating heat and ice-cold immersion — and soothing TCM herbal baths.',
    about: ['The Chill & Heal Ritual pairs 45 minutes of contrast therapy with a 60-minute body massage, solo or as a couple. Prefer warmth? The TCM Herbal Harmony ritual combines a 45-minute herbal bath with a massage.', 'Contrast therapy and herbal bath rituals are exclusive to 313@somerset, alongside our full treatment menu, a short walk from Somerset MRT.'],
    highlights: ['Chill & Heal contrast therapy (sauna + ice bath)', 'TCM herbal bath rituals', 'Solo and couple recovery rituals', 'Full massage, facial, wellness and slimming menu'],
    gallery: ['contrast-therapy.jpg', 'herbal-bath.jpg', '313-front.jpg'],
  },
};

/* ---------------- Outlets ---------------- */
const hours = [['Mon – Fri', '11am – 9pm'], ['Sat, Sun & PH', '10:30am – 8pm']];
export const outlets = [
  { id: 'ion', name: 'ION Orchard', short: 'ION Orchard', url: '/locations/ion-orchard/', feature: 'Beside Orchard MRT', street: '2 Orchard Turn, #B1-30', postal: '238801', address: '2 Orchard Turn, #B1-30<br>ION Orchard, Singapore 238801', addressPlain: '#B1-30 ION Orchard, 2 Orchard Turn, Singapore 238801', phone: '6738 3788', whatsapp: '8938 2878', email: 'ion@elements.com.sg', img: img('ion-interior.jpg'), mapQuery: 'ION Orchard 2 Orchard Turn B1-30', blurb: 'Our ION Orchard spa sits right beside Orchard MRT — an easy escape for massage, facials and recovery therapy in the heart of the shopping belt.' },
  { id: 'centrepoint', name: 'The Centrepoint', short: 'Centrepoint', url: '/locations/the-centrepoint/', feature: 'Home of the Koyamaki Onsen', street: '176 Orchard Road, #02-28', postal: '238843', address: '176 Orchard Road, #02-28<br>The Centrepoint, Singapore 238843', addressPlain: '#02-28 The Centrepoint, 176 Orchard Road, Singapore 238843', phone: '6737 8488', whatsapp: '9357 8183', email: 'cpoint@elements.com.sg', img: img('centrepoint-front.jpg'), mapQuery: 'The Centrepoint 176 Orchard Road 02-28', blurb: 'The Centrepoint is home to our award-winning private Koyamaki onsen suites — soak, scrub and massage in a ritual built for one or two.' },
  { id: '313', name: '313@somerset', short: '313@somerset', url: '/locations/313-somerset/', feature: 'Contrast therapy & herbal baths', street: '313 Orchard Road, #B2-50/51', postal: '238895', address: '313 Orchard Road, #B2-50/51<br>313@somerset, Singapore 238895', addressPlain: '#B2-50/51 313@somerset, 313 Orchard Road, Singapore 238895', phone: '6636 8878', whatsapp: '8875 1677', email: '313@elements.com.sg', img: img('313-front.jpg'), mapQuery: '313@somerset 313 Orchard Road B2-50', blurb: 'At 313@somerset, recover like an athlete with our Chill & Heal contrast therapy and TCM herbal baths, alongside the full treatment menu.' },
].map((o) => ({ ...o, ...outletAbout[o.id] })).map((o) => {
  const r = (research.outlets || []).find((x) => x.name && x.name.toLowerCase().includes(o.short.toLowerCase().slice(0, 5)));
  return { ...o, email: r?.email || o.email, hours, schemaHours: ['Mo-Fr 11:00-21:00', 'Sa-Su 10:30-20:00'] };
});

/* ---------------- Concerns (finder) — DRAFT list pending Elements approval ---------------- */
export const concerns = [
  { id: 'back-pain', label: 'Tight shoulders & back', phrase: 'tight shoulders', blurb: 'Knots, desk posture and stiffness that never quite leaves.', img: img('main-massage.jpg') },
  { id: 'stress-sleep', label: 'Stress & poor sleep', phrase: 'stress & poor sleep', blurb: 'Switch off a busy mind and sleep deeper.', img: img('candle-bed.jpg') },
  { id: 'recovery', label: 'Sore muscles & recovery', phrase: 'sore, tired muscles', blurb: 'Bounce back from training, travel or long days on your feet.', img: img('contrast-therapy.jpg') },
  { id: 'ageing', label: 'Ageing & sagging skin', phrase: 'fine lines & sagging', blurb: 'Firm, lift and restore bounce — without needles.', img: img('lymphatic-sculpt.jpg') },
  { id: 'dull-skin', label: 'Dull, uneven skin', phrase: 'dull, uneven skin', blurb: 'Bring back clarity, brightness and an even tone.', img: img('aquaglow.jpg') },
  { id: 'stubborn-fat', label: 'Stubborn fat & bloating', phrase: 'stubborn tummy fat', blurb: 'Contour and de-bloat with TCM and body technology.', img: img('indiba.jpg') },
  { id: 'puffiness', label: 'Puffiness & water retention', phrase: 'puffiness', blurb: 'Drain, de-puff and feel lighter.', img: img('post-massage.jpg') },
  { id: 'acne', label: 'Acne, oil & open pores', phrase: 'breakouts', blurb: 'Calm, clarify and refine pores.', img: img('facial-mask.jpg') },
  { id: 'dry-skin', label: 'Dry, dehydrated skin', phrase: 'dry, tight skin', blurb: 'Deep hydration for plump, comfortable skin.', img: img('power-dose.jpg') },
  { id: 'sensitive', label: 'Sensitive skin', phrase: 'sensitive skin', blurb: 'Gentle treatments that soothe and strengthen.', img: img('probiotic.jpg') },
  { id: 'mobility', label: 'Stiffness & mobility', phrase: 'stiff joints', blurb: 'Loosen up and move freely again.', img: img('stretch-2.jpg') },
  { id: 'womens-health', label: 'Pregnancy & women’s health', phrase: 'post-pregnancy recovery', blurb: 'Care for every stage — prenatal, postnatal and hormonal balance.', img: img('herbal-bath.jpg') },
  { id: 'together', label: 'Time together', phrase: 'a date for two', blurb: 'Couple rituals, private onsen and shared relaxation.', img: img('couple-onsen-2.jpg') },
];

/* ---------------- Categories ---------------- */
const rs = research.servicesExtra || {};
const concernPages = rs.facialConcernPages || [];
const cpIntro = (u, fb) => concernPages.find((p) => norm(p.url) === u)?.intro || fb;
export const categories = [
  { id: 'massage', label: 'Massage', url: '/services/massage/', element: 'Wood', glyph: '木', img: img('main-massage.jpg'), hero: img('massage-banner.jpg'), blurb: 'Not every body needs the same massage. From TCM Tuina to sports and lymphatic techniques, our therapists work with your body — not a script.' },
  { id: 'facial', label: 'Facial', url: '/services/facial/', element: 'Water', glyph: '水', img: img('lymphatic-sculpt.jpg'), hero: img('facial-mask.jpg'), blurb: 'Results-driven facials that pair skilled hands with professional-grade products and advanced skin technology — for clarity, firmness and glow you can see.',
    subpages: [
      ['Aging / Wrinkles / Sagging', '/services/facial/aging-wrinkles-sagging/', 'ageing', 'Caring for your skin as it changes with time.'],
      ['Dull / Uneven', '/services/facial/dull-uneven/', 'dull-skin', 'Facials that brighten without compromise.'],
      ['Dry / Dehydrated', '/services/facial/dry-dehydrated/', 'dry-skin', 'Hydrate, restore, glow.'],
      ['Oily / Acne / Open Pores', '/services/facial/oily-acne-open-pores/', 'acne', 'Clear skin starts here — facials that deliver real results for acne, oily skin and open pores.'],
      ['Sensitive Skin', '/services/facial/sensitive/', 'sensitive', 'Hydrate. Soothe. Restore — even in the humid heat.'],
      ['Eye Area Treatment', '/services/facial/eye-area-treatment/', 'puffiness', 'Treatments for the delicate eye contour — recommended as add-ons during a facial.'],
    ].map(([label, url, concern, blurb]) => ({ label, url, concern, blurb: cpIntro(url, blurb), recommended: concernPages.find((p) => norm(p.url) === url)?.recommended || [] })) },
  { id: 'wellness', label: 'Wellness', url: '/services/wellness/', element: 'Fire', glyph: '火', img: img('contrast-therapy.jpg'), hero: img('red-light.jpg'), blurb: 'Recovery and restoration — contrast therapy, herbal baths, red light, moxibustion, Acu-Wave and INDIBA®. Ancient healing traditions meet modern science.' },
  { id: 'slimming', label: 'Slimming', url: '/services/slimming/', element: 'Earth', glyph: '土', img: img('indiba.jpg'), hero: img('cat-slimming.jpg'), blurb: 'Contour, de-bloat and reshape with TCM slimming therapy, INDIBA® radiofrequency, cavitation and fat-freeze technology.' },
  { id: 'spa-ritual', label: 'Spa Ritual', url: '/spa-ritual/', element: 'Metal', glyph: '金', img: img('couple-onsen-2.jpg'), hero: img('jacuzzi.jpg'), blurb: 'Private Koyamaki onsen, Chill & Heal contrast and TCM herbal rituals — designed for one, or for two.' },
];

/* ---------------- Services (every current URL retained) ---------------- */
const S = (id, name, url, category, image, concernIds, short, extra = {}) => ({ id, name, url, category, img: img(image), concerns: concernIds, short, ...extra });
const raw = [
  // Massage
  S('5-elements-massage', 'The 5 Elements Massage', '/services/massage/the-5-elements-massage/', 'massage', 'five-elements-massage.jpg', ['stress-sleep', 'back-pain'], 'A TCM massage series — you always choose the element you need: Wood, Fire, Earth, Metal or Water.', { signature: true, tag: 'Signature' }),
  S('tuina', 'Tuina Massage', '/services/massage/tuina-massage/', 'massage', 'main-massage.jpg', ['back-pain', 'mobility'], 'Authentic Chinese massage therapy working along the meridians to release deep tension.', { signature: true }),
  S('swedish', 'Swedish Massage', '/services/massage/swedish-massage/', 'massage', 'massage-banner.jpg', ['stress-sleep'], 'Long, flowing strokes to calm the nervous system and melt away everyday stress.'),
  S('sports', 'Sports Massage', '/services/massage/sports-massage/', 'massage', 'cat-massage.jpg', ['recovery', 'back-pain', 'mobility'], 'Targeted deep-tissue work for active bodies — ease soreness, improve mobility and recover faster.', { signature: true }),
  S('lymphatic', 'Lymphatic Drainage Massage', '/services/massage/lymphatic-drainage-massage/', 'massage', 'post-massage.jpg', ['puffiness', 'stubborn-fat'], 'A rhythmic technique to reduce fluid retention, de-puff and lighten the body.', { signature: true, tag: 'Award-winning' }),
  S('muscle-joints', 'Muscle & Joint Vitality Massage', '/services/massage/muscle-joints-massage/', 'massage', 'fascia-back.jpg', ['back-pain', 'mobility', 'recovery'], 'A therapeutic massage focused on stiff muscles and achy joints.', { tag: 'Award-winning' }),
  S('ginseng-bojin', 'Ginseng Bojin Meridian Massage', '/services/massage/ginseng-bojin-meridian-massage/', 'massage', 'herbal-compress.jpg', ['back-pain', 'stress-sleep'], 'A TCM Bojin technique with ginseng to clear the meridians and revive tired bodies.'),
  S('prenatal', 'Prenatal Massage', '/services/massage/prenatal-massage/', 'massage', 'candle-bed.jpg', ['womens-health'], 'Safe, therapist-guided care for mums-to-be — relieve aches, swelling and fatigue.', { tag: 'Award-winning' }),
  S('postnatal', 'Postnatal Massage', '/services/massage/postnatal-massage/', 'massage', 'post-massage.jpg', ['womens-health', 'puffiness'], 'Restorative care for new mothers — support recovery, reduce water retention and rest.'),
  S('couple-massage', 'Couples Spa and Massage', '/services/massage/couple-massage/', 'massage', 'couple-room-warm.jpg', ['together', 'stress-sleep'], 'Side-by-side massages in a private couple room, each tailored to your own preferences.'),
  S('massage-enhancements', 'Massage Enhancements', '/services/massage/massage-enhancements/', 'massage', 'herbal-flatlay.jpg', ['stress-sleep', 'back-pain'], 'Add-ons to deepen any massage — cupping, moxibustion, warming masks and more.'),
  // Facial
  S('medi-jet', 'Medi-Jet Facial', '/services/facial/medi-jet-facial/', 'facial', 'medi-jet.jpg', ['dull-skin', 'dry-skin', 'acne'], 'A medi-facial from our Medispa range that deep-cleanses and delivers actives with a precise air-jet.'),
  S('lymphatic-sculpt', 'Lymphatic Sculpt Facial', '/services/facial/lymphatic-sculpt-facial/', 'facial', 'lymphatic-sculpt.jpg', ['ageing', 'puffiness'], 'A 100% hands-on facial that de-puffs and lifts to bring back your natural definition.', { signature: true, tag: 'Award-winning' }),
  S('aquaglow', 'AquaGlow Facial', '/services/facial/aquaglow/', 'facial', 'aquaglow.jpg', ['dry-skin', 'dull-skin'], 'For a clean, refreshed and naturally radiant complexion.', { tag: 'Most booked' }),
  S('omega-light', 'Omega Light Therapy', '/services/facial/omega-light-therapy/', 'facial', 'nir.jpg', ['acne', 'sensitive', 'ageing'], 'LED light therapy to calm, clarify and support skin renewal.'),
  S('mens-facial', 'Men’s Facial', '/services/facial/men_facial/', 'facial', 'blog-mens-facial.jpg', ['acne', 'dull-skin'], 'A no-fuss deep-cleansing facial designed for men’s skin.'),
  S('3c-vit-glow', '3C Vitamin Glow Facial', '/services/facial/3c-vitamin-glow-facial/', 'facial', 'facial-mask.jpg', ['dull-skin'], 'A vitamin C brightening facial for radiance and an even-looking tone.', { signature: true }),
  S('hydrolux', 'HydroLux Facial', '/services/facial/hydrolux-facial/', 'facial', 'cat-facial.jpg', ['dry-skin', 'dull-skin', 'ageing'], 'Deep hydration for plump, dewy skin.'),
  S('probiotic', 'Probiotic Facial', '/services/facial/probiotic-facial/', 'facial', 'probiotic.jpg', ['sensitive', 'acne'], 'Infuses probiotics to “train” the skin barrier and calm inflammation.', { tag: 'Award-winning' }),
  S('power-dose', 'Power Dose Brightening Facial', '/services/facial/power-dose-facial/', 'facial', 'power-dose.jpg', ['dull-skin', 'dry-skin'], 'Plumps and restores skin with a concentrated dose of HA and glutathione.', { tag: 'Award-winning' }),
  S('nano-fibroblast', 'Nano Fibroblast Facial', '/services/facial/nano-fibroblast-facial/', 'facial', 'facial-mask.jpg', ['ageing'], 'Supports firmness and elasticity for visibly smoother, lifted skin.', { signature: true }),
  S('nir-cellbright', 'NIR CellBright Facial', '/services/facial/nir-cellbright-facial/', 'facial', 'nir.jpg', ['dull-skin', 'ageing'], 'Near-infrared light to energise skin for brightness and renewal.'),
  S('wishpro', 'WishPro Facial', '/services/facial/wishpro-facial/', 'facial', 'power-dose.jpg', ['ageing', 'dull-skin', 'sensitive'], 'A multi-step technology facial to cleanse, infuse and lift.'),
  S('rejuran', 'Needle-less Rejuran Facial', '/services/facial/needleless-rejuran-facial/', 'facial', 'aquaglow.jpg', ['ageing', 'dry-skin'], 'Rejuran’s skin-healing benefits — delivered without needles.'),
  S('lpg-mobilift', 'LPG Mobilift Facial', '/services/facial/lpg-mobilift-facial/', 'facial', 'cat-facial.jpg', ['ageing', 'puffiness'], 'Mechanical stimulation to firm, lift and de-puff the face.'),
  S('indiba-facial', 'INDIBA® Proionic Gravity Defy Facial', '/services/facial/indiba-proionic-facial/', 'facial', 'lymphatic-sculpt.jpg', ['ageing'], 'INDIBA® radiofrequency to firm and lift — a non-invasive, gravity-defying facial.'),
  S('24k-gold', '24K Pure Gold Facial', '/services/facial/24k-pure-gold-facial/', 'facial', 'gold-facial.jpg', ['ageing', 'dull-skin', 'dry-skin'], 'An indulgent gold-infused facial for radiance and a firmer look.', { tag: 'Award-winning' }),
  S('meridian-bojin-facial', 'Meridian Bojin Facial', '/services/facial/meridian-bojin-facial/', 'facial', 'fascia-face.jpg', ['puffiness', 'dull-skin', 'ageing'], 'A TCM Bojin facial that clears the meridians to de-puff, lift and brighten.', { signature: true }),
  S('ipl', 'IPL Facial (Intense Pulsed Light)', '/services/facial/ipl-facial/', 'facial', 'nir.jpg', ['dull-skin', 'acne'], 'Intense pulsed light to target pigmentation, redness and uneven tone.'),
  // Wellness
  S('fascia', 'Fascia Release Therapy', '/services/massage/fascia-release-therapy/', 'wellness', 'fascia-back.jpg', ['back-pain', 'mobility', 'recovery'], 'Releases tight fascia with a gold-plated tool to free up stiffness and restore movement.', { signature: true, tag: 'Award-winning' }),
  S('contrast', 'Contrast Therapy', '/services/wellness/ice-bath-therapy/', 'wellness', 'contrast-therapy.jpg', ['recovery', 'stress-sleep'], 'Alternate heat and ice-cold immersion to boost circulation, recovery and mood.', { signature: true, outlets: ['313'], tag: '313@somerset' }),
  S('herbal-bath', 'Herbal Bath Therapy', '/services/wellness/herbal-bath-therapy/', 'wellness', 'herbal-bath.jpg', ['stress-sleep', 'womens-health'], 'A soothing TCM herbal soak in a cedar tub to warm, relax and restore.', { outlets: ['313'], tag: '313@somerset' }),
  S('red-light', 'Red Light Therapy', '/services/wellness/red-light-therapy/', 'wellness', 'red-light.jpg', ['recovery', 'stress-sleep'], 'Red light to support recovery, energy and restful sleep.'),
  S('moxibustion', 'Meridian Moxibustion', '/moxibustion/', 'wellness', 'herbal-flatlay.jpg', ['womens-health', 'stress-sleep'], 'Warming TCM moxibustion to boost energy and circulation along the meridians.'),
  S('acuwave', 'Acu-Wave Relief Therapy', '/acuwave-relief-therapy/', 'wellness', 'acuwave.jpg', ['back-pain', 'mobility', 'recovery'], 'Acoustic-wave therapy for stubborn pain, frozen shoulder and tension.', { signature: true, tag: 'Award-winning' }),
  S('medi-stretch', 'Medi-Stretch', '/medi-stretch/', 'wellness', 'stretch-2.jpg', ['mobility', 'back-pain', 'recovery'], 'Therapist-assisted stretching to improve flexibility, posture and mobility.', { signature: true }),
  S('meridian-flush', 'Meridian Flush Therapy', '/meridian-flush-therapy/', 'wellness', 'acuwave-leg.jpg', ['puffiness', 'back-pain', 'stress-sleep'], 'A TCM meridian-clearing therapy to boost flow, de-bloat and energise.', { tag: 'Award-winning' }),
  S('indiba-recovery', 'INDIBA® Pro-Recovery', '/indiba-recovery/', 'wellness', 'indiba.jpg', ['recovery', 'back-pain'], 'INDIBA® radiofrequency to accelerate recovery and ease muscle and joint pain.'),
  S('indiba-womb', 'INDIBA® Womb Care', '/indiba-womb-care/', 'wellness', 'indiba.jpg', ['womens-health'], 'Gentle INDIBA® warmth to support women’s wellness and comfort.'),
  // Slimming
  S('tcm-slimming', 'TCM Slimming Therapy', '/tcm-slimming-therapy/', 'slimming', 'cat-slimming.jpg', ['stubborn-fat', 'puffiness'], 'TCM-based slimming to support metabolism, de-bloat and contour.', { tag: 'Award-winning' }),
  S('tcm-tummy-trim', 'TCM Tummy Trim', '/tcm-tummy-trim/', 'slimming', 'post-massage.jpg', ['stubborn-fat', 'puffiness'], 'A focused TCM treatment for a flatter, lighter-feeling tummy.', { signature: true }),
  S('indiba-slimming', 'INDIBA® Slimming', '/indiba-slimming/', 'slimming', 'indiba.jpg', ['stubborn-fat'], 'INDIBA® radiofrequency body contouring to firm and reshape.', { signature: true }),
  S('3d-cavitation', '3D Cavitation', '/3d-cavitation/', 'slimming', 'cat-slimming.jpg', ['stubborn-fat'], 'Ultrasound cavitation to target stubborn fat pockets.'),
  S('3d-fat-freeze', '3D Fat Freeze', '/3d-fat-freeze/', 'slimming', 'cat-slimming.jpg', ['stubborn-fat'], 'Non-invasive cooling to reduce stubborn fat.', { signature: true }),
  // Treatment pages that exist on the old site outside the main navigation (kept at their URLs)
  S('deep-tissue', 'Deep Tissue Massage', '/services/massage/deep-tissue-massage/', 'massage', 'massage-banner.jpg', ['back-pain', 'recovery', 'mobility'], 'Releases chronic muscle tension, restores range of movement and addresses pain at its source.', { hidden: true }),
  S('antedote', 'Antedote Aromatherapy', '/antedote-aromatherapy/', 'massage', 'five-elements-massage.jpg', ['stress-sleep'], 'Harmony in every drop — Antedote essential-oil blends as a massage enhancement.', { hidden: true, tag: 'Award-winning' }),
  S('collagen-firming', 'Collagen Firming Body Massage', '/collagen-firming-body-massage/', 'massage', 'main-massage.jpg', ['stubborn-fat', 'ageing'], 'Award-winning body massage with collagen peptides to relax and firm.', { hidden: true, tag: 'Award-winning' }),
  S('postnatal-care', 'Postnatal Body Care', '/postnatal-body-care/', 'massage', 'candle-bed.jpg', ['womens-health'], 'Mummy’s Glow: specialised postnatal treatments to support your recovery after birth.', { hidden: true }),
  S('dermo-peel', 'Dermo Peel Facial', '/services/facial/dermo-peel-facial/', 'facial', 'facial-mask.jpg', ['dull-skin', 'acne', 'ageing'], 'Exceptional skin peeling to correct, renew and perfect — liquid microneedling for radiant, youthful skin.', { hidden: true }),
  S('pearl-light', 'Pearl Light Facial', '/services/facial/pearl-light-facial/', 'facial', 'blog-pearl-light.jpg', ['ageing', 'dull-skin'], 'Translucent, bouncy skin that reflects light — firmness and flawlessness in tone and texture.', { hidden: true }),
  S('eye-bojin', 'Eye Bojin Treatment', '/eye-bojin-treatment/', 'facial', 'fascia-face.jpg', ['puffiness', 'stress-sleep'], 'A TCM Bojin technique for the eye area — reduces puffiness, dark circles and fine lines, relieves eye strain.', { hidden: true, tag: 'Award-winning' }),
  S('biocell', 'Biocell Facial', '/biocell-stem-cell-science-face-treatment/', 'facial', 'facial-mask.jpg', ['ageing', 'dull-skin'], 'Biocell Stem Cell Science Face Treatment — promotes the skin’s natural re-birth for a younger, firmer appearance.', { hidden: true }),
  S('bridal-facial', 'Bridal Facials', '/bridal-facial/', 'facial', 'aquaglow.jpg', ['dull-skin', 'ageing'], 'Achieve your dream bridal glow with non-invasive facials — lift, brighten and hydrate for your big day.', { hidden: true }),
  S('skin-brightening', 'Skin Brightening', '/skin-brightening/', 'facial', 'power-dose.jpg', ['dull-skin'], 'Say goodbye to uneven skin tone with our skin brightening facial treatments.', { hidden: true }),
  S('skin-rejuvenation', 'Skin Rejuvenation', '/skin-rejuvenation-treatment-singapore/', 'facial', 'nir.jpg', ['ageing', 'dull-skin'], 'A transformative path to unlock your skin’s full potential.', { hidden: true }),
  S('power-moxa', 'Power Moxa', '/power-moxa/', 'wellness', 'herbal-compress.jpg', ['stress-sleep', 'womens-health'], 'The modern way of doing moxibustion therapy — modern technology applied to TCM moxibustion.', { hidden: true }),
  S('meridian-flush-hyperwave', 'Meridian Flush and Hyperwave', '/meridian-flush-and-hyperwave/', 'wellness', 'acuwave-leg.jpg', ['back-pain', 'puffiness'], '2-in-1 Health Rejuvenation — a 30-min body massage with a 30-min wellness treat.', { hidden: true }),
  // Spa Ritual
  S('onsen', 'Koyamaki Onsen Spa @Centrepoint', '/spa-ritual/onsen-spa/', 'spa-ritual', 'onsen-1.jpg', ['together', 'stress-sleep'], 'A private Koyamaki onsen suite, Ocha body massage and back scrub — a 115-minute ritual for one or two.', { signature: true, outlets: ['centrepoint'], tag: 'Award-winning' }),
  S('couple-contrast', 'Couple Contrast Therapy', '/services/wellness/ice-bath-therapy/#couple', 'spa-ritual', 'contrast-therapy.jpg', ['together', 'recovery'], 'The Couple Chill & Heal Ritual — 45-min contrast therapy and 60-min massage for two.', { outlets: ['313'], alias: 'contrast' }),
  S('couple-herbal', 'Couple Herbal Harmony', '/services/wellness/herbal-bath-therapy/#couple', 'spa-ritual', 'herbal-bath.jpg', ['together', 'stress-sleep'], 'A 45-min TCM herbal bath and 60-min massage, shared by two.', { outlets: ['313'], alias: 'herbal-bath' }),
];

const researchServices = Object.values(research.services || {}).flat().filter(Boolean);
const money = (s = '') => {
  const first = s.match(/(?:first\s*(?:trial|visit)[^$]*?|try it now at\s*)S?\$\s?(\d+(?:\.\d+)?)/i);
  const up = s.match(/U\.?P\.?\s*S?\$\s?(\d+(?:\.\d+)?)/i);
  const any = s.match(/S?\$\s?(\d+(?:\.\d+)?)/);
  const v = first?.[1] || any?.[1];
  return v ? { price: `$${v}`, priceNum: +v, priceNote: first ? 'First trial' : (/per couple|2 pax/i.test(s) ? 'Per couple' : 'From'), up: up ? `$${up[1]}` : '' } : {};
};
const availability = (a = '') => /313/i.test(a) ? ['313'] : /centrepoint/i.test(a) ? ['centrepoint'] : /ion/i.test(a) && !/all/i.test(a) ? ['ion'] : null;

export const services = raw.map((s) => {
  const r = researchServices.find((x) => x.url && norm(x.url) === norm(s.url) && (!s.alias || x.name === s.name))
    || (s.alias ? researchServices.find((x) => x.name === s.name) : null);
  const cat = categories.find((c) => c.id === s.category);
  const m = { ...s, categoryLabel: cat.label, keywords: '', targets: [] };
  if (r) {
    if (r.description) m.description = r.description;
    if (r.duration) m.duration = r.duration.replace(/\s*\(.*\)$/, '').replace(/\bmin\b/, 'min');
    Object.assign(m, money(r.price || ''));
    if (r.concerns?.length) m.targets = r.concerns;
    const av = availability(r.availability || '');
    if (av && !m.outlets) m.outlets = av;
    m.keywords = [...(r.concerns || []), r.tagline || ''].join(' ');
    if (r.elements) m.elements = r.elements;
  }
  m.keywords += ' ' + s.concerns.map((k) => concerns.find((c) => c.id === k)?.label).join(' ');
  m.hidden = s.hidden || (!!s.alias && s.category !== 'spa-ritual');
  return m;
});
const byId = Object.fromEntries(services.map((s) => [s.id, s]));

/* ---------------- Awards (48, each with its own page) ---------------- */
const logoFor = (pub, year) => {
  const p = pub.toLowerCase();
  const table = [
    [/daily vanity/, 2024, 'daily-vanity-2024.png'], [/beauty insider/, 2024, 'beauty-insider-2024.png'],
    [/bazaar/, 2024, 'bazaar-spa-2024.png'], [/bazaar/, 2021, 'bazaar-spa-2021.jpg'],
    [/women.s weekly/, 2021, 'sww-2021.png'], [/women.s weekly/, 2019, 'sww-2019.png'], [/women.s weekly/, 2017, 'sww-2017.jpg'], [/women.s weekly/, 2016, 'sww-2016.png'],
    [/her world/, 2019, 'her-world-2019.png'], [/her world/, 2017, 'her-world-2017.png'],
  ];
  const hit = table.find(([re, y]) => re.test(p) && y === year);
  return hit ? img('awards/' + hit[2]) : '';
};
const pubShort = (p) => p.replace(/\b(Beauty Treatment Awards|Spa & Salon Awards|Spa & Wellness Awards|Spa & Hair Awards|Spa Awards Winner|Spa Awards?|Beauty Awards|Beauty Treats)\b/gi, '').replace(/\b(19|20)\d\d\b/g, '').replace(/^The\s+/i, '').replace(/\s+/g, ' ').trim();
const linkAlias = { onsen: 'onsen', 'ha-glutathione-power-dose-facial': 'power-dose', 'ginseng-bojin-meridian': 'ginseng-bojin', 'prenatal-massage': 'prenatal', 'sports-massage': 'sports', 'lpg-mobilift-facial': 'lpg-mobilift', '24k-pure-gold-facial': '24k-gold' };
const matchService = (a) => {
  const t = (a.treatment || '').toLowerCase().replace(/^the\s+/, '');
  const byName = services.find((s) => !s.alias && t && (t.includes(s.name.toLowerCase().replace(/\s*\(.*\)/, '')) || s.name.toLowerCase().includes(t)));
  if (/probiotic/.test(t)) return 'probiotic';
  if (/chill & heal/.test(t)) return 'contrast';
  if (/onsen/.test(t)) return 'onsen';
  if (byName) return byName.id;
  const seg = lastSeg(a.link || '');
  if (linkAlias[seg]) return linkAlias[seg];
  const bySeg = services.find((s) => !s.alias && lastSeg(s.url) === seg);
  return bySeg?.id || null;
};
export const awards = (research.awards || []).map((a) => {
  const pub = a.publication || '';
  const short = pubShort(pub) || pub;
  const sid = matchService(a);
  const slug = slugify(`${short} ${a.year} ${a.category || a.treatment}`);
  return {
    slug, url: `/awards/${slug}/`, year: a.year, publication: pub, publicationShort: short, category: a.category || '', label: a.awardLabel || '',
    title: a.category || a.treatment, treatment: a.treatment || '', summary: a.description || '',
    serviceIds: sid ? [sid] : [], logo: logoFor(pub, a.year),
  };
}).sort((a, b) => b.year - a.year);
// Press & award logos for the marquee.
export const pressLogos = [
  ...[...new Map(awards.filter((a) => a.logo).map((a) => [a.logo, a])).values()].map((a) => ({ img: a.logo, title: a.publication, url: a.url })),
  { img: img('awards/thesmartlocal.png'), title: 'TheSmartLocal' },
  { img: img('awards/mothership.png'), title: 'Mothership' },
];

/* ---------------- Reviews (Google, from the live site) ---------------- */
// Google ratings & reviews per outlet — snapshot in src/data/google-reviews.json, refreshed live by /api/reviews
export const google = JSON.parse(read('src/data/google-reviews.json') || '{"total":0,"average":0,"places":[]}');
export const googleFor = (outletId) => google.places.find((p) => p.id === outletId);

export const reviews = [
  { name: 'Brad Bones', text: 'I come back weekly to see my super star Nicole! My wife also enjoys. Amazing at what they do!' },
  { name: 'Marissa Teo', text: 'My husband and I thoroughly enjoyed the full body massage and Onsen experience. We will be back!' },
  { name: 'Izwan Ahmad Danial', text: 'Great massage spa package with body scrub, massage and onsen. Price was good too and located centrally in Orchard Centrepoint.' },
  { name: 'Iain Wong', text: 'Massage was very relaxing and really helps in loosening the tight muscles. Felt energized after the session. Thumbs up.' },
  { name: 'Elspeth Jiang', text: 'Their onsen package for 2 pax was amazing. You get a good full body massage plus a private onsen room by yourself.' },
  { name: 'Mary J', text: 'My family likes the ambience, the service from the Reception and the therapists. I’m going back there to buy another package.' },
  { name: 'Andy', text: 'The massage was great. It was very relaxing and comfortable, you would expect from a well-established spa. The highlight is the onsen.' },
  { name: 'Nuruljannah AM', text: 'The standard is still as good as I last remembered. I felt so rejuvenated after that. I had a really good night sleep.' },
];

/* ---------------- FAQ ---------------- */
export const faqs = [
  ...(research.faq || []).filter((f) => f.q && f.a),
  { q: 'How do I make a booking?', a: 'Call or WhatsApp your preferred outlet, or use our <a href="/book-appointment/">booking page</a>. Quote “website promotion” to enjoy web promo prices.' },
  { q: 'Which outlet has the onsen and contrast therapy?', a: 'The private Koyamaki Onsen is at The Centrepoint. Chill & Heal contrast therapy and TCM herbal baths are at 313@somerset.' },
];
export const etiquette = [
  'Arrive 10–15 minutes early to relax and complete your consultation.',
  'Tell us about any health conditions, allergies or pregnancy when booking.',
  'Switch your phone to silent to keep the spa calm for everyone.',
  'Leave valuables at home — lockers are provided for essentials.',
  'Speak up during your treatment if you would like more or less pressure.',
  'Hydrate after your session to help your body recover.',
];

/* ---------------- Promotions ---------------- */
const promoLinks = { 'Body Massage': '/services/massage/', 'The 5 Elements Massage': '/services/massage/the-5-elements-massage/', 'Couple Aromatherapy Massage': '/services/massage/couple-massage/', 'Lymphatic Drainage Massage': '/services/massage/lymphatic-drainage-massage/', 'Pre/ Postnatal Massage': '/services/massage/prenatal-massage/', 'INDIBA Body Therapy': '/indiba-slimming/', 'Customised Pain Management Therapy': '/acuwave-relief-therapy/', 'AquaGlow Facial': '/services/facial/aquaglow/', 'Probiotic Facial': '/services/facial/probiotic-facial/', 'HA Power Dose Facial': '/services/facial/power-dose-facial/', 'Customised Facial Solution Treatment': '/services/facial/' };
const promoImg = (n, c) => /onsen/i.test(n + c) ? img(/couple/i.test(n) ? 'couple-onsen-2.jpg' : 'onsen-1.jpg') : /chill|contrast/i.test(n + c) ? img('contrast-therapy.jpg') : /couple/i.test(n) ? img('couple-room-warm.jpg') : /5 elements/i.test(n) ? img('five-elements-massage.jpg') : /lymph/i.test(n) ? img('post-massage.jpg') : /natal/i.test(n) ? img('candle-bed.jpg') : /indiba/i.test(n) ? img('indiba.jpg') : /pain/i.test(n) ? img('acuwave.jpg') : /aquaglow/i.test(n) ? img('aquaglow.jpg') : /probiotic/i.test(n) ? img('probiotic.jpg') : /power/i.test(n) ? img('power-dose.jpg') : /facial/i.test(n) ? img('facial-mask.jpg') : img('main-massage.jpg');
export const promoTerms = research.promotions?.terms || [];
export const promotions = (research.promotions?.items || []).map((p) => {
  const pr = p.prices || {};
  const lead = pr.firstVisit ? [pr.firstVisit, 'First visit'] : pr.weekdays ? [pr.weekdays, 'Weekdays'] : pr.webPromo ? [pr.webPromo, 'Web promo'] : pr.from ? [pr.from, 'From'] : pr.solo ? [pr.solo.split(' ')[0], 'Solo'] : ['', ''];
  const rows = [['First visit', pr.firstVisit], ['Web promo', pr.webPromo], ['Weekdays', pr.weekdays], ['Weekends', pr.weekends], ['Solo', pr.solo], ['Couple', pr.couple], ['Usual', pr.usual]].filter(([, v]) => v && v !== lead[0]);
  const url = promoLinks[p.name] || (/onsen/i.test(p.name + p.category) ? '/spa-ritual/onsen-spa/' : /chill/i.test(p.name + p.category) ? '/services/wellness/ice-bath-therapy/' : '/book-appointment/');
  return { group: p.category.replace(/\s*\(.*\)/, ''), groupNote: (p.category.match(/\((.*)\)/) || [])[1] || '', title: p.name, desc: p.description, duration: p.duration, price: lead[0], priceLabel: lead[1], rows, tag: p.tag ? p.tag.toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : '', img: promoImg(p.name, p.category), url };
});

/* ---------------- Gift vouchers ---------------- */
export const voucherItems = (research.giftVouchers?.items || []).map((v) => ({ name: v.name, price: v.price.replace('SGD ', 'S$'), desc: v.description }));

/* ---------------- Blog (existing posts keep their URLs) ---------------- */
const blogBody = (slug) => {
  let h = read(`_research/blog/${slug}.html`);
  if (!h) return '';
  h = h.replace(/[\t ]+/g, ' ').replace(/^\s*<h2>.*?<\/h2>/s, '').replace(/<br>\s*<br>/g, '</p><p>').replace(/<p>\s*<\/p>/g, '');
  return h;
};
const postMeta = {
  'blog-mens-facial': { category: 'Skin', img: img('blog-mens-facial.jpg'), serviceIds: ['mens-facial', 'hydrolux', 'aquaglow'] },
  'blog-pearl-light-facial': { category: 'Skin', img: img('blog-pearl-light.jpg'), serviceIds: ['nir-cellbright', 'lpg-mobilift', 'indiba-facial'] },
  'benefits-of-massage-herbal-volcanic-mud-therapy': { category: 'Massage & TCM', img: img('five-elements-massage.jpg'), serviceIds: ['5-elements-massage', 'massage-enhancements', 'tuina'] },
};
export const posts = (research.blog || []).map((b) => {
  const slug = lastSeg(b.url);
  const meta = postMeta[slug] || { category: 'Wellness', img: img('candles.jpg'), serviceIds: [] };
  return {
    slug, url: norm(b.url), title: b.displayTitle || b.title, excerpt: (b.excerpt || '').replace(/\s*\[…\]\s*$/, '…').slice(0, 200).replace(/\s+\S*$/, '…'),
    date: b.date, dateLabel: new Date(b.date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }),
    body: blogBody(slug) || `<p>${b.excerpt}</p>`, ...meta,
  };
}).sort((a, b) => b.date.localeCompare(a.date));
export const blogTopics = ['Treatment guides', 'Concern-by-concern advice', 'Treatment comparisons', 'TCM explained', 'Recovery & sleep'];

/* ---------------- Shop: the four products sold on the old site (kept at their /product/ URLs) ---------------- */
const wc = JSON.parse(read('_research/wc-products.json') || '[]');
export const shopProducts = wc.map((p) => ({
  id: p.id, name: p.name, slug: lastSeg(p.permalink), url: norm(p.permalink),
  price: 'S$' + (Number(p.prices.price) / 100).toFixed(0), desc: (p.short_description || p.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  descHtml: (p.description || p.short_description || '').replace(/<img[^>]*>/g, ''), img: p.localImg || p.images?.[0]?.src || '', imgAlt: p.images?.[0]?.alt || '',
}));

/* ---------------- Supplements — PLACEHOLDERS until Elements supplies range ---------------- */
export const products = [
  { slug: 'daily-balance', name: 'Daily Balance Complex', short: 'Daily balance', desc: 'Everyday wellness support to complement your treatment programme.', benefits: ['Supports overall wellbeing', 'Recommended after Health Analysis', 'Simple daily routine'], serviceIds: ['5-elements-massage', 'meridian-flush'] },
  { slug: 'deep-rest', name: 'Deep Rest Formula', short: 'Rest & sleep', desc: 'Night-time support for calm and restful sleep.', benefits: ['Supports relaxation', 'Pairs with red light therapy', 'Evening routine'], serviceIds: ['red-light', 'herbal-bath'] },
  { slug: 'glow-collagen', name: 'Glow Collagen', short: 'Skin glow', desc: 'Beauty-from-within support to extend your facial results.', benefits: ['Supports skin hydration', 'Pairs with facials', 'Daily sachet'], serviceIds: ['nano-fibroblast', '3c-vit-glow'] },
  { slug: 'lean-and-light', name: 'Lean & Light', short: 'Body & detox', desc: 'Support for your slimming programme and a lighter-feeling body.', benefits: ['Supports digestion', 'Pairs with TCM slimming', 'Daily routine'], serviceIds: ['tcm-tummy-trim', 'indiba-slimming'] },
  { slug: 'recovery-plus', name: 'Recovery Plus', short: 'Recovery', desc: 'Post-workout and post-treatment recovery support.', benefits: ['Supports muscle recovery', 'Pairs with contrast therapy', 'For active lifestyles'], serviceIds: ['contrast', 'sports'] },
  { slug: 'womens-harmony', name: 'Women’s Harmony', short: 'Women’s health', desc: 'Gentle support for women’s balance through every stage.', benefits: ['Supports hormonal balance', 'Pairs with INDIBA® Womb Care', 'Gentle formula'], serviceIds: ['indiba-womb', 'moxibustion'] },
].map((p) => ({ ...p, price: 'Price TBC', url: `/shop/${p.slug}/` }));

/* ---------------- Story ---------------- */
export const story = {
  lede: 'From four rooms to almost a hundred — a team dedicated to improving health and wellness through technology, products, ancient healing traditions and the magic of touch.',
  statement: 'All we do is not just about making people feel good; it is also about doing their bodies and soul some good too.',
  paragraphs: research.story?.paragraphs || [],
  stats: [['1M+', 'Massages performed'], ['~100', 'Treatment rooms'], ['3', 'Orchard Road outlets'], [String(awards.length), 'Awards since 2014'], ['4 → 100', 'Rooms, and growing']],
};

export const policies = [
  { url: '/appointment-booking-cancellation-policy/', title: 'Appointment Booking & Cancellation Policy', description: 'Elements Wellness appointment booking and cancellation policy.', body: '<p>To make a booking, please call or WhatsApp your preferred location, or request an appointment online.</p><p class="placeholder-note">Full policy text is migrated from the existing page in the CMS.</p>' },
  { url: '/customer-assurance-privacy/', title: 'Customer Assurance & Privacy', description: 'How Elements Wellness protects your personal data.', body: `<p>${(research.promotions?.terms || []).length ? '' : ''}We respect your privacy. Personal information — including Health Analysis records — is stored securely in the Elements staff system and used only to provide your treatments.</p><p class="placeholder-note">Full policy text is migrated from the existing page in the CMS.</p>` },
];

/* ---------------- Finder dataset (sent to the browser) ---------------- */
export const finderData = () => ({
  concerns: concerns.map(({ id, label }) => ({ id, label })),
  categories: categories.map(({ id, label }) => ({ id, label })),
  outlets: outlets.map(({ id, name }) => ({ id, label: name })),
  services: services.filter((s) => !s.hidden).map((s) => ({ id: s.id, name: s.name, url: s.url, category: s.category, categoryLabel: s.categoryLabel, img: s.img, concerns: s.concerns, outlets: s.outlets || null, keywords: s.keywords, duration: s.duration || '' })),
});

export { byId };
