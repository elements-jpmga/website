// Products — two categories, sorted by brand. The catalogue itself (names, sizes, prices, skus) lives in the staff server
// (restore/src/shop/catalog.mjs) so the website and the checkout always price from the same list.
import { CATEGORIES, PRODUCTS, NOTE, OUTLETS } from '../restore/src/shop/catalog.mjs';

export const money = (n) => 'S$' + Number(n).toLocaleString('en-SG', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
export const productCategories = CATEGORIES.map((c) => ({ ...c, brands: c.brands.map((b) => ({ ...b, items: PRODUCTS.filter((p) => p.brand === b.id).map((p) => ({ ...p, brandName: b.name, priceLabel: money(p.price) })) })) }));
export const productsNote = NOTE;
export const shopOutlets = OUTLETS;
