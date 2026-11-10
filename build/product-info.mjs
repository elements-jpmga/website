// Product information taken from the manufacturers' own websites (researched 9 Nov 2026) — nothing written by us.
// Anubis Barcelona: anubis-cosmetics.com (Spanish pages carry the actives, directions and INCI tabs) and anubismed.com.
// V10 Plus: v10plus.com (the brand's own store; lists Elements ION and Centrepoint as stockists). Amino Serum is not on that
// store — its ingredient list comes from the brand's official Finnish importer (v10plus.fi) and matches other printed lists.
// Fields are left out where the manufacturer publishes nothing (e.g. no directions or full INCI for the four Anubismed items).
//   desc     — what it is / does, in the manufacturer's words (translated where the source is Spanish)
//   target   — the concern it is for (manufacturer's "Target")      skin — the manufacturer's "Suited for" / skin type
//   actives  — key ingredients as the manufacturer lists them        use — directions, manufacturer's wording
//   inci     — full ingredient list as published (array, or { label: array } for multi-part products)
//   source   — the official page(s) used

const V10_USE = 'Apply day and night. Dispense one small pump of each serum onto your palm (one small pump of each if you are using several serums, or one big pump if you only use one). Apply over your face.';
const V10_SOURCE = (h) => `https://v10plus.com/products/${h}`;

export const productInfo = {
  /* ---------------- Anubis Barcelona ---------------- */
  'AN-7DAYS': {
    desc: 'Intensive one-week anti-ageing and lifting treatment. Stimulates epidermal renewal, smooths wrinkles and helps repair the effects of ageing, recovering and maintaining lost elasticity, firmness and nutrition. The week is made up of four concentrates: Glyco Peeling (vial 1), then Ferulic, Botox-like and Matrikine ampoules.',
    skin: 'All skin types from age 35 or with visible signs of ageing; especially dehydrated, combination-dry, hyperpigmented and sun-aged skin.',
    actives: ['Glyco Peeling: glycolic acid 10%, pH 4.5', 'Ferulic: ferulic acid, pure vitamin C (ascorbic acid), DMAE', 'Botox-like: BoNT-L, Syn-Ake®', 'Matrikine: Matrixyl®, Trylagen®'],
    use: 'Day 1, at night, on clean skin, apply the Glyco Peeling (vial 1) to face, neck and décolleté; never apply during sun exposure. On the following days apply the vials in the morning to face, neck and décolleté and work in with the fingertips and light tapping until fully absorbed.',
    inci: {
      'Glyco Peeling': ['Aqua (Water)', 'Glycolic Acid', 'Glycerin', 'Sodium Hydroxide', 'Polysorbate 20', 'Hydroxyethylcellulose', 'Parfum (Fragrance)', 'Sodium Nitrate', 'Benzyl Alcohol', 'Hexyl Cinnamal', 'Hydrated Silica', 'Limonene', 'Benzyl Salicylate'],
      'Ferulic': ['Aqua (Water)', 'PEG-8 Caprylic/Capric Glycerides', 'Propanediol', 'Alcohol Denat.', 'Tocopheryl Acetate', 'PEG-35 Castor Oil', 'Lecithin', 'Magnesium Ascorbyl Phosphate', 'Ferulic Acid', 'Dimethylaminoethanol Tartrate', 'Glycerin', 'Parfum (Fragrance)'],
      'Botox-like': ['Aqua (Water)', 'PEG-8 Caprylic/Capric Glycerides', 'Propanediol', 'Benzyl Alcohol', 'Glycerin', 'Magnesium Ascorbyl Phosphate', 'Parfum (Fragrance)', 'Dehydroacetic Acid', 'Benzoic Acid', 'Sorbic Acid', 'Phenoxyethanol', 'Dipeptide Diaminobutyroyl Benzylamide Diacetate', 'Hexyl Cinnamal', 'Benzyl Salicylate', 'Alpha-Isomethyl Ionone', 'Citronellol', 'CI 15985', 'EDTA', 'Potassium Sorbate', 'Sodium Benzoate', 'Palmitoyl Hexapeptide-19'],
      'Matrikine': ['Aqua (Water)', 'PEG-8 Caprylic/Capric Glycerides', 'Propanediol', 'Glycerin', 'Benzyl Alcohol', 'Butylene Glycol', 'Pseudoalteromonas Ferment Extract', 'Parfum (Fragrance)', 'Dehydroacetic Acid', 'Hydrolyzed Wheat Protein', 'Benzoic Acid', 'Hydrolyzed Soy Protein', 'Sorbic Acid', 'Carbomer', 'Sodium Lactate', 'Polysorbate 20', 'Caprylyl Glycol', 'Phenoxyethanol', 'Xanthan Gum', 'Lecithin', 'Hydroxycitronellal', 'Alpha-Isomethyl Ionone', 'Tripeptide-1', 'Hexyl Cinnamal', 'Citronellol', 'CI 14720', 'Triethanolamine', 'Tripeptide-10 Citrulline', 'Palmitoyl Tripeptide-1', 'Potassium Sorbate', 'Sodium Benzoate', 'Palmitoyl Tetrapeptide-7'],
    },
    source: 'https://anubis-cosmetics.com/es/7-days-line/186-336-7-days-shock-treatment-anti-aging-lifting.html',
  },
  'AN-HA-SERUM': {
    desc: 'Intensive moisturising concentrated serum with a fluid texture and quick absorption. Formulated with hyaluronic acid molecules of different molecular weights, which increase the skin’s water reserves on the surface and in depth; improves elasticity and smoothness and reduces tightness and dryness.',
    actives: ['Hyaluronic acid', 'Vitamin E', 'Sodium PCA'],
    notes: ['Paraben-free'],
    source: 'https://anubismed.com/en/home-care/2-ha-hyaluronic-cream.html',
  },
  'AN-HA-CREAM': {
    desc: 'Moisturising cream with a soft, melting texture for skin that needs an immediate supply of hydration and comfort. Formulated with hyaluronic acid molecules of different molecular weights, increasing water reserves on the surface and in depth, helping prevent transepidermal water loss and reducing tightness and dryness.',
    skin: 'All skin types.',
    actives: ['Hyaluronic acid', 'Aloe vera', 'Vitamin E'],
    notes: ['Paraben-free', 'Mineral-oil-free', 'Contains a sun filter'],
    source: 'https://anubismed.com/es/home-care/1-ha-hyaluronic-cream.html',
  },
  'AN-HA-EYE': {
    desc: 'Concentrate with a serum texture and quick absorption that specifically treats the eye and lip contour. Formulated with hyaluronic acid molecules of different molecular weights, increasing the tissue’s water reserves and giving extra hydration that reduces the number of wrinkles in these areas. Satin finish.',
    actives: ['Hyaluronic acid', 'Aloe vera', 'Shea butter', 'Grape seed oil', 'Vitamin E', 'Argan oil'],
    notes: ['Paraben-free'],
    source: 'https://anubismed.com/en/home-care/3-ha-hyaluronic-cream.html',
  },
  'AN-BAKUCHIOL': {
    desc: 'Cream with bakuchiol and tranexamic acid. Daily facial massage combined with its toning actives helps combat wrinkles, uneven tone and skin spots: corrects hyperpigmentation, evens skin tone, prevents and reduces wrinkles and acts against photoageing.',
    skin: 'All skin types affected by pollution, lack of radiance and wrinkles.',
    actives: ['1% pure bakuchiol', '2% pure tranexamic acid', 'Matrixyl® 3000', 'Hydro-ceramides', 'Organic castor, jojoba, sunflower and olive oils'],
    source: 'https://anubismed.com/en/home-care/6-ha-hyaluronic-cream.html',
  },
  'AN-TONER': {
    desc: 'Moisturising and toning toner based on thermal water, with a moisturising, refreshing and remineralising effect. Rapidly absorbed, it provides immediate hydration without leaving any trace of product and helps prevent dryness, irritation and redness.',
    skin: 'All skin types, even the most sensitive.',
    actives: ['Thermal water', 'Betaine'],
    use: 'On clean skin, apply to face, neck and décolleté by spraying lightly or with moistened cotton pads, with gentle patting until fully absorbed.',
    inci: ['Aqua (Water)', 'Betaine', 'Glycerin', 'Polysorbate 20', 'Phenoxyethanol', 'Imidazolidinyl Urea', 'Benzoic Acid', 'Ethylhexylglycerin', 'Parfum (Fragrance)', 'Dehydroacetic Acid', 'CI 42090'],
    source: 'https://anubis-cosmetics.com/es/total-hydrating/41-117-thermal-toner.html',
  },
  'AN-MOUSSE': {
    desc: 'Silky antioxidant cleansing foam with a 2-in-1 action: removes make-up and tones. Soothing and moisturising, it balances the skin’s pH and gives immediate comfort. With vitamin C, Citrustem® and babassu oil.',
    skin: 'All skin types, even the most sensitive.',
    actives: ['Vitamin C', 'Citrustem® (orange stem cells)', 'Babassu oil'],
    use: 'Apply 1 or 2 pumps into the hand and spread over previously moistened face, neck and décolleté. Work in with a gentle massage and rinse off with water.',
    inci: ['Aqua (Water)', 'MIPA-Laureth Sulfate', 'Babassu Oil Glycereth-8 Esters', 'PEG-7 Glyceryl Cocoate', 'Sodium Chloride', 'Cocamidopropyl Betaine', 'Phenoxyethanol', 'Propylene Glycol', 'Glycerin', 'Parfum (Fragrance)', 'Limonene', 'Ethylhexylglycerin', 'Linalool', 'Sodium Benzoate', 'Citronellol', 'Citrus Aurantium Dulcis Callus Culture Extract', 'Gluconolactone', 'Xanthan Gum', 'Calcium Gluconate'],
    source: 'https://anubis-cosmetics.com/es/polivitaminic/53-142-cleansing-mousse.html',
  },
  'AN-SPF50': {
    desc: 'Ultra-light, invisible sun protection emulsion for daily use. Very high facial protection with a combination of filters against UVA, UVB, IR and HEV rays, enriched with vitamins C, E and F. Water resistant, with an invisible finish.',
    skin: 'All skin types; the invisible finish is especially suited to sensitive skin.',
    actives: ['UVA / UVB / IR / HEV filter system', 'Vitamin C', 'Vitamin E (tocopherol)', 'Vitamin F (linoleic acid)', 'Humectant agents'],
    use: 'Shake before use. Apply 30 minutes before sun exposure and reapply as often as necessary. For daily use, apply after your usual cream. Avoid contact with eyes and wounds.',
    inci: ['Aqua (Water)', 'Ethylhexyl Methoxycinnamate', 'Butylene Glycol', 'Propylene Glycol', 'Polymethyl Methacrylate', 'Butyl Methoxydibenzoylmethane', 'Ethylhexyl Salicylate', 'Octocrylene', 'Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine', 'Dimethicone', 'Silica', 'Linoleic Acid', 'Titanium Dioxide', 'BHT', 'Glycerin', 'PEG-8', 'C20-22 Alkyl Phosphate', 'Tocopherol', 'Linolenic Acid', 'Ascorbyl Palmitate', 'Ascorbic Acid', 'Citric Acid', 'Phenoxyethanol', 'C20-22 Alcohols', 'Parfum (Fragrance)', 'Tromethamine', 'Potassium Cetyl Phosphate', 'Chlorphenesin', 'Acrylates/C10-30 Alkyl Acrylate Crosspolymer', 'Carbomer', 'Disodium EDTA'],
    source: 'https://anubis-cosmetics.com/es/protective-line/266-491-copy-of-spf-50-sun-emulsion-spray.html',
  },

  /* ---------------- V10 Plus (water-based serums, made in Japan) ---------------- */
  'V10-AMINO': {
    // Not listed on v10plus.com today; ingredient list from the brand's official Finnish importer, matching other printed lists. Description withheld until Elements confirms.
    actives: ['Amino acids (glycine, alanine, proline, serine, threonine, arginine, lysine, glutamic acid)', 'Betaine', 'Soluble collagen'],
    use: V10_USE,
    inci: ['Aqua/Water', 'Butylene Glycol', 'Pentylene Glycol', 'Betaine', 'Glycerin', 'Sodium PCA', 'Phenoxyethanol', 'Carbomer', 'Potassium Hydroxide', 'Sorbitol', 'Hydroxyethylcellulose', 'Citric Acid', 'Serine', 'Sodium Citrate', 'Glycine', 'Lysolecithin', 'Glutamic Acid', 'Alanine', 'Arginine', 'Lysine', 'Threonine', 'Proline', 'Soluble Collagen'],
    source: 'https://www.v10plus.fi/tuotteet/seerumit/aminohappo-seerumi',
  },
  'V10-PLACENTA': {
    desc: 'Aids in restraining melanogenesis and activates the skin by accelerating the growth of the cells.',
    target: 'Spots, freckles and dullness.', skin: 'Dull skin.',
    actives: ['Pueraria lobata (kudzu) root extract', 'Aloe barbadensis leaf extract', 'Chlorella vulgaris extract'],
    use: V10_USE,
    inci: ['Aqua/Water', 'Butylene Glycol', 'Pentylene Glycol', 'Glycerin', 'Lysolecithin', 'Carbomer', 'Hydroxyethylcellulose', 'Potassium Hydroxide', 'Citric Acid', 'Phenoxyethanol', 'Sodium Citrate', 'Pueraria Lobata Root Extract', 'Aloe Barbadensis Leaf Extract', 'Chlorella Vulgaris Extract'],
    source: V10_SOURCE('placenta-serum'),
  },
  'V10-LICORICE': {
    desc: 'Soothes roughness, allergy and irritation caused by inflamed pimples and sunburn.',
    target: 'Inflammation, irritation, acne.', skin: 'Sensitive and acne-prone skin.',
    actives: ['Glycyrrhiza glabra (licorice) root extract'],
    use: V10_USE,
    inci: ['Aqua/Water', 'Butylene Glycol', 'Pentylene Glycol', 'Glycerin', 'Lysolecithin', 'Carbomer', 'Phenoxyethanol', 'Glycyrrhiza Glabra (Licorice) Root Extract', 'Hydroxyethylcellulose', 'Potassium Hydroxide', 'Citric Acid', 'Sodium Citrate'],
    source: V10_SOURCE('licorice-serum'),
  },
  'V10-VITA': {
    desc: 'Normalises the turnover of the skin cells and rejuvenates the skin.',
    target: 'Dark circles, roughness, dullness and dryness.', skin: 'Dull, dry, rough skin.',
    actives: ['Retinyl palmitate'],
    use: V10_USE + ' Vitamin A serum can also be applied over the eye area.',
    inci: ['Aqua/Water', 'Butylene Glycol', 'Pentylene Glycol', 'Glycerin', 'PEG-60 Hydrogenated Castor Oil', 'Lysolecithin', 'Carbomer', 'Phenoxyethanol', 'Retinyl Palmitate', 'Hydroxyethylcellulose', 'Potassium Hydroxide', 'Sodium Lactate'],
    source: V10_SOURCE('vitamin-a-serum'),
  },
  'V10-BIOCELL': {
    desc: 'For DNA and skin cell repair, anti-wrinkle, prevention of melanin production and skin firming, by stimulating the growth of collagen and fibronectin.',
    target: 'Anti-ageing, sagging skin, wrinkles.', skin: 'Ageing skin.',
    actives: ['Rosa damascena flower extract', 'Malus domestica fruit cell culture extract (apple stem cell)', 'Mel (honey) extract', 'Melia azadirachta (neem) leaf extract'],
    use: V10_USE,
    inci: ['Water', 'Butylene Glycol', 'Rosa Damascena Flower Extract', 'Sorbitol', 'Xanthan Gum', 'Carbomer', 'Malus Domestica Fruit Cell Culture Extract', 'Lecithin', 'Glycerin', 'Dipeptide Diaminobutyroyl Benzylamide Diacetate', 'MEL Extract', 'Coco-Glucoside', 'Royal Jelly', 'MEL', 'Propolis Extract', 'Sodium Hydroxide', 'Maltodextrin', 'Disodium EDTA', 'Phenoxyethanol', 'Ethylhexyl Glycerin', 'Hydrolyzed Hyaluronic Acid', 'Hydrolyzed Collagen', 'Melia Azadirachta Leaf Extract', 'Caramel', 'Uncaria Tomentosa Extract', 'Vitis Vinifera Extract', 'Pueraria Lobata Root Extract', 'Aloe Barbadensis Leaf Extract', 'Chlorella Vulgaris Extract'],
    source: V10_SOURCE('biocell-serum'),
  },
  'V10-COLLAGEN': {
    desc: 'Contains marine collagen to boost collagen production and enhance the elasticity and youthfulness of the skin.',
    target: 'Wrinkles, sagging, fine lines.', skin: 'Ageing skin.',
    actives: ['Soluble collagen', 'Hydrolyzed elastin'],
    use: V10_USE,
    inci: ['Aqua/Water', 'Butylene Glycol', 'Pentylene Glycol', 'Glycerin', 'Lysolecithin', 'Carbomer', 'Hydroxyethylcellulose', 'Potassium Hydroxide', 'Phenoxyethanol', 'Citric Acid', 'Sodium Citrate', 'Hydrolyzed Elastin', 'Soluble Collagen'],
    source: V10_SOURCE('collagen-serum'),
  },
  'V10-VITC': {
    desc: 'Helps to minimise pores, regulate sebum secretion, treat pimples and lighten brown marks caused by acne.',
    target: 'Excess oil, acne, enlarged pores.', skin: 'Oily and acne-prone skin.',
    actives: ['Magnesium ascorbyl phosphate', 'Sodium ascorbyl phosphate', 'Phellodendron amurense bark extract'],
    use: V10_USE,
    inci: ['Aqua/Water', 'Sodium Citrate', 'Butylene Glycol', 'Pentylene Glycol', 'Alcohol', 'Magnesium Ascorbyl Phosphate', 'Phenoxyethanol', 'Hydroxyethylcellulose', 'Sodium Ascorbyl Phosphate', 'Sodium PCA', 'Sodium Polyaspartate', 'Disodium EDTA', 'Citric Acid', 'Phellodendron Amurense Bark Extract'],
    source: V10_SOURCE('vitamin-c-serum'),
  },
  'V10-CERAMIDE': {
    desc: 'Fills in the damaged horny layer and reinforces the barrier function of the skin.',
    target: 'Sensitivity, irritation.', skin: 'Sensitive skin.',
    actives: ['Glycosphingolipids (ceramide)'],
    use: V10_USE,
    inci: ['Aqua/Water', 'Butylene Glycol', 'Pentylene Glycol', 'Glycerin', 'Carbomer', 'Hydroxyethylcellulose', 'Potassium Hydroxide', 'Phenoxyethanol', 'Glycosphingolipids'],
    source: V10_SOURCE('ceramide-serum'),
  },
  'V10-HA': {
    desc: 'Boosts the skin’s hydration, with a high permeability that speeds up penetration into the skin.',
    target: 'Dryness.', skin: 'Dry and ageing skin.',
    actives: ['Sodium hyaluronate'],
    use: V10_USE,
    inci: ['Aqua/Water', 'Butylene Glycol', 'Pentylene Glycol', 'Glycerin', 'Lysolecithin', 'Carbomer', 'Phenoxyethanol', 'Sodium Hyaluronate', 'Hydroxyethylcellulose', 'Potassium Hydroxide', 'Sodium Lactate'],
    source: V10_SOURCE('hyaluronic-acid-serum'),
  },
};

// Brand-level facts stated by the manufacturers (shown once per brand page section)
export const brandInfo = {
  v10: { line: 'Water-based serums, made in Japan.', notes: ['No parabens', 'No artificial fragrance', 'No artificial colourants', 'No mineral oil'], source: 'https://v10plus.com/pages/about-us' },
};
