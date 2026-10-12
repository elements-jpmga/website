// The Elements Wellness sitemap (client document "Elements_Website_Sitemap_2026", review version 12 Oct 2026).
// Single source of truth for navigation, page list, legacy redirects and the copywriting status report.
//
// For every page:
//   source — the old elements.com.sg page whose content is carried over (null = no existing page)
//   copy   — 'existing'  copy carried over from the old page (review only)
//            'adapt'     old copy exists but must be rewritten / merged / renamed for the new page
//            'new'       new page, copy to be written
//            'inventory' waiting for Elements' product inventory
//   id     — the treatment's id in build/data.mjs (prices, images, awards); new treatments get a new id

/* ---------------- Facials ---------------- */
export const facialConcerns = [
  { label: 'Fine Lines & Firmness', url: '/fine-lines-firmness/', source: '/services/facial/aging-wrinkles-sagging/', copy: 'adapt', img: 'lymphatic-sculpt.jpg' },
  { label: 'Dull & Tired-Looking Skin', url: '/dull-tired-skin/', source: '/services/facial/dull-uneven/', copy: 'adapt', img: 'aquaglow.jpg', note: 'Old page covered dull and pigmented skin together; split the pigmentation copy into its own page.' },
  { label: 'Pigmentation & Uneven Skin Tone', url: '/pigmentation-uneven-skin-tone/', source: '/skin-brightening/', copy: 'adapt', img: 'power-dose.jpg', note: 'Built from the old Skin Brightening page.' },
  { label: 'Dry & Dehydrated Skin', url: '/dry-dehydrated-skin/', source: '/services/facial/dry-dehydrated/', copy: 'existing', img: 'cat-facial.jpg' },
  { label: 'Congestion & Breakouts', url: '/congestion-breakouts/', source: '/services/facial/oily-acne-open-pores/', copy: 'adapt', img: 'facial-mask.jpg', note: 'Old page was "Oily / Acne / Open Pores"; pores now have their own page.' },
  { label: 'Sensitive & Reactive Skin', url: '/sensitive-reactive-skin/', source: '/services/facial/sensitive/', copy: 'existing', img: 'probiotic.jpg' },
  { label: 'Puffiness & Facial Definition', url: '/puffiness-facial-definition/', source: null, copy: 'new', img: 'fascia-face.jpg' },
  { label: 'Uneven Texture & Pores', url: '/uneven-texture-pores/', source: null, copy: 'new', img: 'medi-jet.jpg' },
];

export const facialTreatments = [
  { name: 'NIR CellBright Facial', url: '/nir-cellbright-facial/', id: 'nir-cellbright', source: '/services/facial/nir-cellbright-facial/', copy: 'existing' },
  { name: '24K Pure Gold Facial', url: '/24k-pure-gold-facial/', id: '24k-gold', source: '/services/facial/24k-pure-gold-facial/', copy: 'existing' },
  { name: 'Meridian Bojin Facial', url: '/meridian-bojin-facial/', id: 'meridian-bojin-facial', source: '/services/facial/meridian-bojin-facial/', copy: 'existing' },
  { name: 'Lymphatic Sculpt Facial', url: '/lymphatic-sculpt-facial/', id: 'lymphatic-sculpt', source: '/services/facial/lymphatic-sculpt-facial/', copy: 'existing' },
  { name: 'Hanbang Fascia Facial', url: '/hanbang-fascia-facial/', id: 'hanbang-fascia', source: null, copy: 'new', img: 'fascia-face.jpg' },
  { name: 'LPG Mobilift Facial', url: '/lpg-mobilift-facial/', id: 'lpg-mobilift', source: '/services/facial/lpg-mobilift-facial/', copy: 'existing' },
  { name: 'Nano Fibroblast Facial', url: '/nano-fibroblast-facial/', id: 'nano-fibroblast', source: '/services/facial/nano-fibroblast-facial/', copy: 'existing' },
  { name: 'Dermo Peel Facial', url: '/dermo-peel-facial/', id: 'dermo-peel', source: '/services/facial/dermo-peel-facial/', copy: 'existing' },
  { name: '3C Vitamin Glow Treatment', url: '/3c-vitamin-glow-facial/', id: '3c-vit-glow', source: '/services/facial/3c-vitamin-glow-facial/', copy: 'adapt', note: 'Renamed from "3C Vitamin Glow Facial".' },
  { name: 'Aqua Glow Facial', url: '/aquaglow-facial/', id: 'aquaglow', source: '/services/facial/aquaglow/', copy: 'existing', note: 'No concern assignment in the v4 inventory — reachable from By Treatment only.' },
  { name: 'Power Dose Brightening Facial', url: '/power-dose-brightening-facial/', id: 'power-dose', source: '/services/facial/power-dose-facial/', copy: 'existing' },
  { name: 'The Probiotic Facial', url: '/probiotic-facial/', id: 'probiotic', source: '/services/facial/probiotic-facial/', copy: 'existing' },
  { name: 'HydroLux™ Cryo-Glow Facial', url: '/hydrolux-cryo-glow-facial/', id: 'hydrolux', source: '/services/facial/hydrolux-facial/', copy: 'adapt', note: 'Renamed from "HydroLux Facial" — check the cryo element is described.' },
  { name: 'Advanced IPL Facial', url: '/ipl-facial/', id: 'ipl', source: '/services/facial/ipl-facial/', copy: 'adapt', note: 'Renamed from "IPL Facial".' },
  { name: 'Wishpro Face Treatment', url: '/wishpro-facial/', id: 'wishpro', source: '/services/facial/wishpro-facial/', copy: 'adapt', note: 'Renamed from "WishPro Facial".' },
  { name: 'Needleless Rejuran®', url: '/needleless-rejuran-facial/', id: 'rejuran', source: '/services/facial/needleless-rejuran-facial/', copy: 'existing' },
  { name: 'INDIBA® Proionic Gravity Defy Facial', url: '/indiba-gravity-defy-facial/', id: 'indiba-facial', source: '/services/facial/indiba-proionic-facial/', copy: 'existing' },
  { name: 'Medi-Jet Facial', url: '/medi-jet-facial/', id: 'medi-jet', source: '/services/facial/medi-jet-facial/', copy: 'existing' },
];

// Shared pages: one page listing several add-on options (no individual pages for these items)
export const facialShared = [
  { label: 'Eye Treatments', url: '/eye-treatments/', source: '/services/facial/eye-area-treatment/', copy: 'adapt', img: 'fascia-face.jpg', group: 'focused',
    note: 'Intro and three item descriptions come from the old Eye Area page + Eye Bojin page; Bright Eye and Medi-Jet Eye are new. Old INDIBA® Eye Rejuvenation is not in the new list.',
    items: ['Bright Eye Treatment', 'Bojin Eye Treatment', '24K Pure Gold Eye Treatment', 'Hydrating Collagen Eye Treatment', 'Medi-Jet Eye Treatment'] },
  { label: 'Neck Treatments', url: '/neck-treatments/', source: null, copy: 'new', img: 'gold-facial.jpg', group: 'focused',
    items: ['24K Pure Gold Neck Treatment', 'Hydrating Collagen Neck Treatment', 'NIR CellBright Neck Tightening'] },
  { label: 'Boosters', title: 'Facial Boosters', url: '/facial-boosters/', source: '/services/facial/omega-light-therapy/', copy: 'adapt', img: 'nir.jpg', group: 'boosters',
    note: 'Only Omega Light Therapy has existing copy (old Omega Light page).',
    items: ['Medi-Jet Lip Treatment', 'Enzymatic Peel', 'Omega Light Therapy', 'NIR CellBright Firming'] },
];

/* ---------------- Massage & Recovery ---------------- */
export const massageConcerns = [
  { label: 'Neck, Shoulder & Back Tension', url: '/neck-shoulder-back-tension/', source: null, copy: 'new', img: 'fascia-back.jpg' },
  { label: 'Water Retention & Circulation', url: '/water-retention-circulation/', source: null, copy: 'new', img: 'post-massage.jpg' },
  { label: 'Stress, Fatigue & Poor Sleep', url: '/stress-fatigue-poor-sleep/', source: null, copy: 'new', img: 'candle-bed.jpg' },
  { label: 'Tech Neck & Headaches', url: '/tech-neck-headaches/', source: null, copy: 'new', img: 'main-massage.jpg' },
  { label: 'Post-Workout Soreness & Recovery', url: '/post-workout-recovery/', source: null, copy: 'new', img: 'contrast-therapy.jpg' },
  { label: 'Stiffness & Limited Mobility', url: '/stiffness-limited-mobility/', source: '/services/massage/muscle-joints-massage/', copy: 'adapt', img: 'stretch-2.jpg', note: 'Can draw on the old Muscle & Joint Vitality Massage page.' },
  { label: 'Body Contouring', url: '/body-contouring/', source: '/services/slimming/', copy: 'adapt', img: 'cat-slimming.jpg', note: 'Old Slimming landing page had very little copy.' },
];

export const massageTreatments = [
  { name: 'Medi-Stretch® Therapy', url: '/medi-stretch-therapy/', id: 'medi-stretch', source: '/medi-stretch/', copy: 'existing' },
  { name: 'Fascia Release Therapy', url: '/fascia-release-therapy/', id: 'fascia', source: '/services/massage/fascia-release-therapy/', copy: 'existing' },
  { name: 'DEEPBA® RF Recovery', url: '/deepba-rf-recovery/', id: 'deepba-recovery', source: null, copy: 'new', img: 'indiba.jpg' },
  { name: 'INDIBA® Pro-Recovery', url: '/indiba-pro-recovery/', id: 'indiba-recovery', source: '/indiba-recovery/', copy: 'existing' },
  { name: 'TCM Slimming Therapy', url: '/tcm-slimming-therapy/', id: 'tcm-slimming', source: '/tcm-slimming-therapy/', copy: 'existing' },
  { name: 'DEEPBA® RF Slim & Tone', url: '/deepba-rf-slim-and-tone/', id: 'deepba-slim', source: null, copy: 'new', img: 'cat-slimming.jpg' },
  { name: 'INDIBA® Proionic Slimming', url: '/indiba-proionic-slimming/', id: 'indiba-slimming', source: '/indiba-slimming/', copy: 'adapt', note: 'Renamed from "INDIBA® Slimming".' },
  { name: 'TCM Meridian Bust Care', url: '/tcm-meridian-bust-care/', id: 'tcm-bust', source: null, copy: 'new', img: 'herbal-compress.jpg', womens: true },
  { name: 'MLD Bust Therapy', url: '/mld-bust-therapy/', id: 'mld-bust', source: null, copy: 'new', img: 'post-massage.jpg', womens: true },
  { name: 'INDIBA® Womb Care', url: '/indiba-womb-care/', id: 'indiba-womb', source: '/indiba-womb-care/', copy: 'existing', womens: true },
  { name: 'Swedish Massage', url: '/swedish-massage/', id: 'swedish', source: '/services/massage/swedish-massage/', copy: 'existing' },
  { name: 'Deep Tissue Massage', url: '/deep-tissue-massage/', id: 'deep-tissue', source: '/services/massage/deep-tissue-massage/', copy: 'existing' },
  { name: 'Sports Massage', url: '/sports-massage/', id: 'sports', source: '/services/massage/sports-massage/', copy: 'existing' },
  { name: 'Tuina Massage', url: '/tuina-massage/', id: 'tuina', source: '/services/massage/tuina-massage/', copy: 'existing' },
  { name: 'Prenatal Massage', url: '/prenatal-massage/', id: 'prenatal', source: '/services/massage/prenatal-massage/', copy: 'existing', womens: true },
  { name: 'Postnatal Massage', url: '/postnatal-massage/', id: 'postnatal', source: '/services/massage/postnatal-massage/', copy: 'existing', womens: true, note: 'Old "Postnatal Body Care" page redirects here; merge any useful copy.' },
  { name: 'Lymphatic Drainage Massage', url: '/lymphatic-drainage-massage/', id: 'lymphatic', source: '/services/massage/lymphatic-drainage-massage/', copy: 'existing' },
  { name: '5 Elements Massage', url: '/5-elements-massage/', id: '5-elements-massage', source: '/services/massage/the-5-elements-massage/', copy: 'existing' },
  { name: 'Myofascial Head / Neck Therapy', url: '/myofascial-head-neck-therapy/', id: 'myofascial-head-neck', source: null, copy: 'new', img: 'main-massage.jpg' },
  { name: 'Meridian Flush Therapy', url: '/meridian-flush-therapy/', id: 'meridian-flush', source: '/meridian-flush-therapy/', copy: 'existing' },
  { name: 'Ginseng Bojin Meridian Therapy', url: '/ginseng-bojin-meridian-therapy/', id: 'ginseng-bojin', source: '/services/massage/ginseng-bojin-meridian-massage/', copy: 'adapt', note: 'Renamed from "Ginseng Bojin Meridian Massage".' },
  { name: 'TCM Qi Meridian Therapy', url: '/tcm-qi-meridian-therapy/', id: 'tcm-qi', source: null, copy: 'new', img: 'herbal-flatlay.jpg' },
  { name: 'Acu-Wave Relief Therapy', url: '/acu-wave-relief-therapy/', id: 'acuwave', source: '/acuwave-relief-therapy/', copy: 'existing' },
  { name: 'Catabolic Tummy Therapy', url: '/catabolic-tummy-therapy/', id: 'catabolic-tummy', source: null, copy: 'new', img: 'post-massage.jpg', note: 'Confirm whether this replaces the old "TCM Tummy Trim" (which currently redirects to Body Contouring).' },
  { name: 'Meridian Moxibustion Therapy', url: '/meridian-moxibustion-therapy/', id: 'moxibustion', source: '/moxibustion/', copy: 'existing' },
  { name: 'Red Light Therapy', url: '/red-light-therapy/', id: 'red-light', source: '/services/wellness/red-light-therapy/', copy: 'existing' },
];

// Women’s Wellness menu group, in the order given in the sitemap
export const womensWellness = ['prenatal', 'postnatal', 'tcm-bust', 'mld-bust', 'indiba-womb'];

export const massageBoosters = { label: 'Boosters', title: 'Massage & Recovery Boosters', url: '/massage-recovery-boosters/', source: '/services/massage/massage-enhancements/', copy: 'adapt', img: 'herbal-flatlay.jpg',
  note: 'Descriptions exist on the old Massage Enhancements page; added minutes, prices and suitable treatments must be supplied. Antedote Aromatherapy is not in the new list.',
  items: ['Infra Ray Moxibustion / Muscle Blade', 'Volcanic Mud Mask', 'Guasha / Bojin', 'Cupping'] };

/* ---------------- Spa Experiences ---------------- */
export const spaPages = [
  { name: 'Koyamaki Onsen Ritual', url: '/koyamaki-onsen-ritual/', id: 'onsen', source: '/spa-ritual/onsen-spa/', copy: 'adapt', ritual: true, outlet: 'centrepoint',
    options: [['Koyamaki Onsen (bath only)', '40 min', 'Solo $98 · Couple $148'], ['Solo Koyamaki Onsen Spa Ritual', '115 min', 'Weekdays $165 · Weekends $185'], ['Couple Koyamaki Onsen Spa Ritual', '115 min', 'Weekdays $288 · Weekends $323']],
    buy: [['Buy Solo Ritual', '/product/solo-koyamaki-onsen-spa-ritual-115-min/'], ['Buy Couple Ritual', '/product/couple-koyamaki-onsen-spa-ritual-115-min/']],
    note: 'Restructure into bath-only, individual ritual and couple ritual sections with inclusions.' },
  { name: 'Chill & Heal Ritual', url: '/chill-and-heal-ritual/', id: 'contrast', source: '/services/wellness/ice-bath-therapy/', copy: 'adapt', ritual: true, outlet: '313',
    options: [['Chill & Heal Therapy (contrast only)', '45 min', 'Solo $98 · Couple $148'], ['Solo Chill & Heal Ritual', '105 min', 'Weekdays $158 · Weekends $168'], ['Couple Chill & Heal Ritual', '105 min', 'Weekdays $298 · Weekends $318']],
    note: 'Old page was "Ice Bath Therapy"; restructure into bath-only, individual and couple sections.' },
  { name: 'TCM Herbal Harmony Ritual', url: '/tcm-herbal-harmony-ritual/', id: 'herbal-bath', source: '/services/wellness/herbal-bath-therapy/', copy: 'adapt', ritual: true, outlet: '313',
    options: [['TCM Herbal Bath (bath only)', '45 min', 'Price to confirm'], ['Solo TCM Herbal Harmony Ritual', '—', 'Price to confirm'], ['Couple TCM Herbal Harmony Ritual', '—', 'Price to confirm']],
    note: 'Old page was "TCM Herbal Bath Therapy"; restructure into bath-only, individual and couple sections. Ritual prices needed.' },
  { name: 'Couples Massage', url: '/couple-massage/', id: 'couple-massage', source: '/services/massage/couple-massage/', copy: 'adapt',
    note: 'Discovery page: side-by-side massage, then direct visitors to the couple rituals.' },
];

/* ---------------- Other main pages ---------------- */
export const landing = {
  facials: { label: 'Facials', url: '/facials/', source: '/services/facial/', copy: 'adapt', img: 'facial-mask.jpg', note: 'New overview built around By Concern / Focused Care / By Treatment.' },
  massage: { label: 'Massage & Recovery', url: '/massage-and-recovery/', source: '/services/massage/', copy: 'adapt', img: 'massage-banner.jpg', note: 'Overview should help visitors compare options and choose a starting point.' },
  spa: { label: 'Spa Experiences', url: '/spa-experiences/', source: '/spa-ritual/', copy: 'new', img: 'couple-onsen-2.jpg', note: 'Old Spa Ritual page had no body copy.' },
};

export const products = {
  index: { label: 'Products', url: '/products/', copy: 'inventory', note: 'Catalogue structure only until Elements supplies the brand, skincare and supplement inventory.' },
  skincare: { label: 'Skincare', url: '/products/skincare/', copy: 'inventory' },
  supplements: { label: 'Supplements', url: '/products/supplements/', copy: 'inventory' },
};

export const supportPages = [
  { label: 'Home', url: '/', copy: 'adapt', note: 'Sections now follow the sitemap: treatments, Elements Restore, Products, Gift Vouchers, Why Elements, outlets, first visit, offers, awards.' },
  { label: 'Elements Restore', url: '/elements-restore/', copy: 'new', note: 'Draft written from the Elements Restore build spec and report wording — needs Elements approval. Launch planned for November.' },
  { label: 'Gift Vouchers', url: '/gift-vouchers/', source: '/gift-vouchers/', copy: 'adapt', note: 'Needs voucher options, purchase, redemption, terms and FAQs on one page; Gift Up connection later.' },
  { label: 'Promotions', url: '/promotions/', source: '/promotions/', copy: 'existing' },
  { label: 'Locations overview', url: '/locations/', copy: 'new', note: 'Built from outlet details; short intro needed.' },
  { label: '313@Somerset', url: '/locations/313-somerset/', copy: 'existing' },
  { label: 'Centrepoint', url: '/locations/centrepoint/', copy: 'existing' },
  { label: 'ION Orchard', url: '/locations/ion-orchard/', copy: 'existing' },
  { label: 'About Elements', url: '/about-elements/', source: '/our-story/', copy: 'existing' },
  { label: 'Awards & Recognition', url: '/awards/', source: '/awards/', copy: 'existing', note: 'Organised by year, awarding organisation, category and treatment.' },
  { label: 'Contact Us', url: '/contact/', source: '/contact-us/', copy: 'existing' },
  { label: 'FAQ & Spa Etiquette', url: '/faq-spa-etiquette/', source: '/faq-spa-etiquette/', copy: 'adapt', note: 'Add first-visit guidance, preparation, privacy, comfort, pricing terms and a booking-rules summary.' },
  { label: 'Booking & Cancellation Policy', url: '/appointment-booking-cancellation-policy/', source: '/appointment-booking-cancellation-policy/', copy: 'existing' },
  { label: 'Customer Assurance & Privacy', url: '/customer-assurance-privacy/', source: '/customer-assurance-privacy/', copy: 'existing' },
];

/* ---------------- Legacy URLs → new pages (301) ---------------- */
const fromSources = [...facialTreatments, ...massageTreatments, ...spaPages, ...facialConcerns, ...massageConcerns, ...facialShared, massageBoosters, ...Object.values(landing), ...supportPages]
  .filter((p) => p.source && p.source !== p.url).map((p) => [p.source, p.url]);
export const redirects = [
  ...fromSources,
  ['/services/', '/'],
  ['/services/wellness/', '/massage-and-recovery/'],
  ['/services/facial/men_facial/', '/facials/'],
  ['/services/facial/pearl-light-facial/', '/facials/'],
  ['/bridal-facial/', '/facials/'],
  ['/biocell-stem-cell-science-face-treatment/', '/facials/'],
  ['/skin-rejuvenation-treatment-singapore/', '/fine-lines-firmness/'],
  ['/eye-bojin-treatment/', '/eye-treatments/'],
  ['/postnatal-body-care/', '/postnatal-massage/'],
  ['/antedote-aromatherapy/', '/massage-recovery-boosters/'],
  ['/collagen-firming-body-massage/', '/body-contouring/'],
  ['/tcm-tummy-trim/', '/body-contouring/'],
  ['/3d-cavitation/', '/body-contouring/'],
  ['/3d-fat-freeze/', '/body-contouring/'],
  ['/power-moxa/', '/meridian-moxibustion-therapy/'],
  ['/meridian-flush-and-hyperwave/', '/meridian-flush-therapy/'],
  ['/health-analysis/', '/elements-restore/'],
  ['/shop/', '/products/'],
  ['/product/solo-koyamaki-onsen-spa-ritual-115-min/', '/koyamaki-onsen-ritual/'],
  ['/product/couple-koyamaki-onsen-spa-ritual-115-min/', '/koyamaki-onsen-ritual/'],
  ['/product/repeat-trial-body-massage/', '/promotions/'],
  ['/product/first-trial-weekend-tuina-massage/', '/promotions/'],
  ['/locations/the-centrepoint/', '/locations/centrepoint/'],
  // links used by old award cards
  ['/onsen/', '/koyamaki-onsen-ritual/'], ['/massage/', '/massage-and-recovery/'], ['/facial/', '/facials/'], ['/therapy/', '/massage-and-recovery/'],
  ['/ha-glutathione-power-dose-facial/', '/power-dose-brightening-facial/'], ['/ginseng-bojin-meridian/', '/ginseng-bojin-meridian-therapy/'],
  ['/services/massage/menopause-massage/', '/massage-and-recovery/'],
  // older addresses still linked from inside the old copy
  ['/tui-na-massage/', '/tuina-massage/'], ['/indiba-proionic-gravity-defy-facial/', '/indiba-gravity-defy-facial/'], ['/ipl-facial-intense-pulsed-light/', '/ipl-facial/'],
  ['/anti-aging/', '/fine-lines-firmness/'], ['/neck-shoulder-body-massage-singapore/', '/neck-shoulder-back-tension/'], ['/elements-ginseng-meridian-therapy/', '/ginseng-bojin-meridian-therapy/'],
  ['/slimming/', '/body-contouring/'], ['/koyamaki-onsen/', '/koyamaki-onsen-ritual/'], ['/jacuzzi-facility/', '/locations/centrepoint/'], ['/synergy-massage/', '/massage-and-recovery/'],
  ['/ace-face-shaper/', '/facials/'], ['/services/facial/ace-face-shaper-facial/', '/facials/'], ['/purifying-black-magnelight-facial/', '/congestion-breakouts/'],
  ['/services/facial/purifying-black-magnelight-facial/', '/congestion-breakouts/'], ['/face-meridian-restorative-treatment/', '/facials/'],
  ['/services/facial/desensitize-facial/', '/sensitive-reactive-skin/'], ['/referral/', '/referral-faq/'], ['/product/singtelsg/', '/singtelsg/'],
].filter(([a, b], i, all) => a !== b && all.findIndex(([x]) => x === a) === i);

/* ---------------- Copywriting status report ---------------- */
export const STATUS = { existing: 'Existing copy carried over — review only', adapt: 'Existing copy — rewrite / merge needed', new: 'NEW page — copy to be written', inventory: 'Waiting for product inventory' };
export function statusRows() {
  const row = (section, p, type) => ({ section, page: p.title || p.label || p.name, url: p.url, type, status: p.copy, source: p.source || '', note: p.note || '', items: (p.items || []).join('; ') });
  return [
    ...supportPages.filter((p) => p.url === '/').map((p) => row('Home', p, 'Home')),
    row('Facials', landing.facials, 'Landing page'),
    ...facialConcerns.map((p) => row('Facials', p, 'Concern page')),
    ...facialShared.map((p) => row('Facials', p, p.group === 'boosters' ? 'Shared booster page' : 'Shared focused-care page')),
    ...facialTreatments.map((p) => row('Facials', p, 'Treatment page')),
    row('Massage & Recovery', landing.massage, 'Landing page'),
    ...massageConcerns.map((p) => row('Massage & Recovery', p, 'Concern page')),
    row('Massage & Recovery', massageBoosters, 'Shared booster page'),
    ...massageTreatments.map((p) => row('Massage & Recovery', p, 'Treatment page')),
    row('Spa Experiences', landing.spa, 'Landing page'),
    ...spaPages.map((p) => row('Spa Experiences', p, p.ritual ? 'Ritual page' : 'Discovery page')),
    ...Object.values(products).map((p) => row('Products', p, 'Catalogue page')),
    { section: 'Products', page: 'Brand pages', url: '/products/brands/<brand>/', type: 'Brand page', status: 'inventory', source: '', note: 'One per carried brand — needs brand list.', items: '' },
    { section: 'Products', page: 'Individual product pages', url: '/products/<brand-product>/', type: 'Product page', status: 'inventory', source: '', note: 'Needs product list; purchase or enquiry action not yet agreed.', items: '' },
    ...supportPages.filter((p) => p.url !== '/').map((p) => row(['Elements Restore', 'Gift Vouchers', 'Promotions'].includes(p.label) ? p.label : 'Supporting & footer', p, 'Page')),
  ];
}
