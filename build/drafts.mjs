// Treatment page drafts written by Elements (Lucy) — "Treatment Pages - Website" Drive folder, Oct 2026.
// Copy is used word for word from section B of each draft; section C ("Internal review — delete before handover") is never published.
// A treatment with a draft here gets the new treatment-page template; others keep the old site's copy.

export const drafts = {
  rejuran: {
    source: 'Needleless Rejuran® — page draft.docx (13 Oct 2026)',
    title: 'Needleless Rejuran® in Singapore | Elements Wellness',
    description: 'A 75-minute needle-free facial that infuses c-PDRN and active ingredients using electroporation for radiant, hydrated-looking skin — no needles, no downtime.',
    oldUrl: '/services/facial/needleless-rejuran-facial/',
    h1: 'Needleless Rejuran®',
    lede: 'Gives the skin a more radiant, smoother and better-hydrated look — with no needles and no downtime.',
    intro: 'Needleless Rejuran® is a non-invasive facial that uses electroporation — a technique using gentle electrical pulses — to infuse c-PDRN, salmon DNA healing ingredients deep into your skin without needles, bumps or downtime.',
    facts: { duration: '75 min', firstTrial: 'S$299', usual: 'S$598', outlets: ['ion', 'centrepoint', '313'], outletNames: 'ION Orchard · Centrepoint · 313@Somerset' },
    about: [
      { h: 'What is c-PDRN?', p: [
        'Developed in Korea, Rejuran® features c-PDRN—purified DNA fragments derived from salmon—to support the skin’s natural renewal as it is highly compatible with human DNA.',
        'As skin ages, its natural renewal slows and collagen production declines. The cell renewal cycle can lengthen from around 28 days to as many as 50. These changes can leave your complexion looking duller and less firm, making support for skin renewal increasingly important.',
      ] },
      { h: 'How electroporation delivers it', p: [
        'Electroporation uses electrical pulses to make skin cells temporarily more permeable, so active ingredients are absorbed more readily and reach deeper layers of the skin without needles.',
        'c-PDRN also has a low molecular weight, which helps it be absorbed more readily than larger molecules that tend to sit on the surface. That makes it well suited to needle-free infusion.',
      ] },
      { h: 'The Rejuran® Tone Up Booster', p: ['The booster combines c-PDRN with five other active ingredients that work together to support skin health and its natural barrier:'], list: [
        'Hyaluronic acid — holds water in the skin, supporting hydration and plumpness.',
        'Panthenol — a softening ingredient known for its moisturising and soothing properties.',
        'Vitamin C — an antioxidant that plays a part in the skin’s collagen and elastin, and helps improve the look of uneven tone.',
        'Glutathione — an antioxidant made of three amino acids, which supports a brighter-looking tone.',
        'Tranexamic acid — helps fade the look of discolouration and soften the look of post-breakout marks, while brightening the skin.',
      ] },
    ],
    benefits: [
      { h: 'Straight away', list: ['A more radiant, glowing look, which many clients notice after a single session', 'Skin that feels hydrated and looks plumper', 'No needles and no downtime'] },
      { h: 'What the ingredients contribute', list: ['Skin that looks firmer and more elastic', 'The appearance of fine lines smoothed', 'A more even-looking tone and smoother texture, including the look of enlarged pores', 'Marks left by breakouts looking softer'] },
    ],
    suits: [
      'Your skin looks dull or tired',
      'You are noticing fine lines and early signs of ageing',
      'Your skin feels less firm or elastic than it used to',
      'You have enlarged pores or uneven texture',
      'You have uneven tone, sun spots, age spots, or marks left by breakouts',
      'You would like a Rejuran®-based facial without injections',
    ],
    session: {
      steps: [
        'Professional cleansing, exfoliation and extraction',
        'Rejuran® Tone Up Booster — c-PDRN with hyaluronic acid, panthenol, vitamin C, glutathione and tranexamic acid — infused into the skin using electroporation',
        'Facial Massage',
        'Rejuran® professional mask',
      ],
      aftercare: 'No needles are used, and numbing cream is not needed',
    },
    awardsLine: 'Multi-award-winning wellness. Over 25 years of care.',
    faq: [
      { q: 'What is Rejuran®?', a: 'Rejuran® is a skin treatment developed in Korea and built around c-PDRN, a purified form of salmon DNA. It was first offered as an injection. Needleless Rejuran® delivers Rejuran® c-PDRN through a facial instead, using electroporation.' },
      { q: 'What is electroporation?', a: 'Electroporation uses electrical pulses to make skin cells temporarily more permeable. This lets the active ingredients be absorbed more deeply than they would be by applying them to the surface, and no needles are involved.' },
      { q: 'Is Needleless Rejuran® the same as injectable Rejuran®?', a: 'No. Injectable Rejuran® is a medical injection procedure. Needleless Rejuran® is a non-invasive facial that works by a different method, and it should not be expected to give the same results. It is an option for clients who prefer to avoid injections.' },
      { q: 'Is there any downtime?', a: 'No. Needleless Rejuran® is non-invasive, so there is no downtime and you can go straight back to your day.' },
      { q: 'Is the treatment painful?', a: 'Numbing cream is not needed, and clients generally find the treatment comfortable.' },
      { q: 'How soon will I see results?', a: 'Many clients notice a more radiant look after one session.' },
      { q: 'How often should I have Needleless Rejuran®?', a: 'For targeted concerns, once every two weeks for 8 weeks. For maintenance: once a month.' },
    ],
    related: {
      treatments: [{ id: 'medi-jet', text: 'A needle-free device that delivers active ingredients into the skin for visible results.' }],
      guides: [{ url: '/fine-lines-firmness/', label: 'Fine Lines & Firmness' }, { url: '/pigmentation-uneven-skin-tone/', label: 'Pigmentation & Uneven Skin Tone' }],
      boosters: [{ url: '/facial-boosters/', label: 'Facial boosters' }],
    },
  },
};
