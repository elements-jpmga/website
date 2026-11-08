// Products — two categories, sorted by brand. Names, sizes and prices as supplied by Elements (Lucy, 8 Nov 2026):
// the Anubis pricelist image and "all items listed here are 30ml, S$128" for V10. Supplements (brand ELEMENTS) come later.
const A = (name, size, price, img, sub = '') => ({ name, sub, size, price, img: [].concat(img).map((f) => `/assets/img/products/anubis/${f}`) });
const V = (name, img) => ({ name, sub: '', size: '30ml', price: 'S$128', img: [`/assets/img/products/v10/${img}.jpg`] });
export const productCategories = [
  { id: 'skincare', label: 'Skincare', url: '/products/skincare/', brands: [
    { id: 'anubis', name: 'Anubis Barcelona', items: [
      A('7 Days Shock Treatment', '7 x 1.5ml', 'S$99', ['7-days-shock-treatment-box.png', '7-days-shock-treatment-ampoules.png'], 'Anti-Aging & Lifting'),
      A('HA+ Hyaluronico Serum', '30ml', 'S$143', 'ha-hyaluronic-serum.png'),
      A('HA+ Hyaluronico Cream', '50ml', 'S$158', 'ha-hyaluronic-cream.jpg'),
      A('HA+ Hyaluronico Eye Contour', '15ml', 'S$128', 'ha-hyaluronic-eye-contour.jpg'),
      A('Bakuchiol TRX 3.0', '30ml', 'S$218', 'bakuchiol-trx.png'),
      A('Thermal Toner', '250ml', 'S$85', 'thermal-toner.png'),
      A('POLIVITAMINIC Cleansing Mousse', '200ml', 'S$118', 'polivitaminic-cleansing-mousse.jpg'),
      A('SPF50+ Anti Aging Sun Emulsion', '50ml', 'S$118', 'spf50-sun-emulsion.jpg'),
    ] },
    { id: 'v10', name: 'V10 Plus', items: [
      V('Amino Serum', 'amino-serum'), V('Placenta Serum', 'placenta-serum'), V('Licorice Serum', 'licorice-serum'), V('Vitamin A Serum', 'vitamin-a-serum'), V('Biocell Serum', 'biocell-serum'),
      V('Collagen Serum', 'collagen-serum'), V('Vitamin C Serum', 'vitamin-c-serum'), V('Ceramide Serum', 'ceramide-serum'), V('Hyaluronic Acid Serum', 'hyaluronic-acid-serum'),
    ] },
  ] },
  { id: 'supplements', label: 'Supplements', url: '/products/supplements/', brands: [{ id: 'elements', name: 'ELEMENTS', items: [] }] },
];
// Footnote printed on the Anubis pricelist
export const productsNote = 'Exclusively available at Elements Wellness ION, Centrepoint, and 313@somerset outlets only.';
