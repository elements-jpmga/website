// Products sold on elements.com.sg — the single source of truth for names, sizes and prices (SGD).
// The website build (build/products.mjs) imports this file, and the checkout prices every order from it,
// so a browser can never set its own price. Names, sizes and prices as supplied by Elements (Lucy, 8 Nov 2026):
// the Anubis pricelist image and "all items listed here are 30ml, S$128" for V10. Supplements (brand ELEMENTS) come later.
const A = (sku, name, size, price, img, sub = '') => ({ sku, brand: 'anubis', name, sub, size, price, img: [].concat(img).map((f) => `/assets/img/products/anubis/${f}`) });
const V = (sku, name, img) => ({ sku, brand: 'v10', name, sub: '', size: '30ml', price: 128, img: [`/assets/img/products/v10/${img}.jpg`] });

export const CATEGORIES = [
  { id: 'skincare', label: 'Skincare', url: '/products/skincare/', brands: [
    { id: 'anubis', name: 'Anubis Barcelona' },
    { id: 'v10', name: 'V10 Plus' },
  ] },
  { id: 'supplements', label: 'Supplements', url: '/products/supplements/', brands: [
    { id: 'elements', name: 'ELEMENTS' },
  ] },
];

export const PRODUCTS = [
  A('AN-7DAYS', '7 Days Shock Treatment', '7 x 1.5ml', 99, ['7-days-shock-treatment-box.png', '7-days-shock-treatment-ampoules.png'], 'Anti-Aging & Lifting'),
  A('AN-HA-SERUM', 'HA+ Hyaluronico Serum', '30ml', 143, 'ha-hyaluronic-serum.png'),
  A('AN-HA-CREAM', 'HA+ Hyaluronico Cream', '50ml', 158, 'ha-hyaluronic-cream.jpg'),
  A('AN-HA-EYE', 'HA+ Hyaluronico Eye Contour', '15ml', 128, 'ha-hyaluronic-eye-contour.jpg'),
  A('AN-BAKUCHIOL', 'Bakuchiol TRX 3.0', '30ml', 218, 'bakuchiol-trx.png'),
  A('AN-TONER', 'Thermal Toner', '250ml', 85, 'thermal-toner.png'),
  A('AN-MOUSSE', 'POLIVITAMINIC Cleansing Mousse', '200ml', 118, 'polivitaminic-cleansing-mousse.jpg'),
  A('AN-SPF50', 'SPF50+ Anti Aging Sun Emulsion', '50ml', 118, 'spf50-sun-emulsion.jpg'),
  V('V10-AMINO', 'Amino Serum', 'amino-serum'),
  V('V10-PLACENTA', 'Placenta Serum', 'placenta-serum'),
  V('V10-LICORICE', 'Licorice Serum', 'licorice-serum'),
  V('V10-VITA', 'Vitamin A Serum', 'vitamin-a-serum'),
  V('V10-BIOCELL', 'Biocell Serum', 'biocell-serum'),
  V('V10-COLLAGEN', 'Collagen Serum', 'collagen-serum'),
  V('V10-VITC', 'Vitamin C Serum', 'vitamin-c-serum'),
  V('V10-CERAMIDE', 'Ceramide Serum', 'ceramide-serum'),
  V('V10-HA', 'Hyaluronic Acid Serum', 'hyaluronic-acid-serum'),
];

// Footnote printed on the Anubis pricelist
export const NOTE = 'Exclusively available at Elements Wellness ION, Centrepoint, and 313@somerset outlets only.';

// Where an order can be collected (the three outlets, as on the website)
export const OUTLETS = [
  { id: 'ion', name: 'ION Orchard', address: '2 Orchard Turn, #B1-30, ION Orchard, Singapore 238801', phone: '6738 3788' },
  { id: 'centrepoint', name: 'The Centrepoint', address: '176 Orchard Road, #02-28, The Centrepoint, Singapore 238843', phone: '6737 8488' },
  { id: '313', name: '313@somerset', address: '313 Orchard Road, #B2-50/51, 313@somerset, Singapore 238895', phone: '6636 8878' },
];

export const bySku = (sku) => PRODUCTS.find((p) => p.sku === sku) || null;
export const brandName = (id) => CATEGORIES.flatMap((c) => c.brands).find((b) => b.id === id)?.name || '';
