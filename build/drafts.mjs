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
      numbered: true,
      steps: [
        'Professional cleansing, exfoliation and extraction',
        'Rejuran® Tone Up Booster — c-PDRN with hyaluronic acid, panthenol, vitamin C, glutathione and tranexamic acid — infused into the skin using electroporation',
        'Facial Massage',
        'Rejuran® professional mask',
        'Aftercare',
      ],
      note: 'No needles are used, and numbing cream is not needed',
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

  '3c-vit-glow': {
    source: '3C Vitamin Glow Treatment — page draft.docx (13 Oct 2026)',
    heroImg: '/assets/img/aquaglow.jpg', // old page photo is stock with a Western model (brand guide: casting, stock look) — needs a 3C photo from Elements
    title: '3C Vitamin Glow Treatment in Singapore | Elements Wellness',
    description: 'A 75-minute facial with three freshly activated forms of Vitamin C, gentle AHA exfoliation and an oxygenating mask to brighten dull, uneven-looking skin.',
    oldUrl: '/services/facial/3c-vitamin-glow-facial/',
    h1: '3C Vitamin Glow Treatment',
    lede: 'Nourishes and brightens the complexion and evens skin tone, for fresher, more radiant skin.',
    intro: 'The 3C Vitamin Glow Treatment is a 75-minute facial built around Vitamin C — an antioxidant that plays a part in the skin’s own collagen production and brightens its look. Vitamin C breaks down quickly once it meets air, so this facial combines three advanced forms and activates them fresh at your session. Gentle AHA exfoliation and an oxygenating bubbling mask complete the treatment.',
    facts: { duration: '75 min', firstTrial: 'S$219', usual: 'S$438', outlets: ['ion', 'centrepoint', '313'], outletNames: 'ION Orchard · Centrepoint · 313@Somerset' },
    about: [
      { h: 'Why Vitamin C — and why fresh', p: [
        'Vitamin C does three things for your skin: it acts as an antioxidant, supports collagen, and brightens. The difficulty is that it is unstable and oxidises fast, so much of its potency can be lost before it reaches your skin.',
        'This facial deals with that in two ways. It combines three advanced forms of Vitamin C, and each mono-dose is activated right before it is used, so your skin receives Vitamin C at its freshest.',
      ] },
      { h: 'Three forms of Vitamin C', p: [], list: [
        'AA2 (Ascorbic Acid 2-Glucoside) — a brightening form with sustained release, which supports a lasting glow.',
        'SAP (Sodium Ascorbyl Phosphate) — supports the skin’s collagen and helps soften the look of fine lines, leaving skin smoother.',
        'EAA (Ethyl Ascorbic Acid) — a stable, deep-penetrating form that helps protect skin from pollution and helps fade the look of dark spots.',
      ] },
      { h: 'Gentle exfoliation with Pronalen AHA 50', p: [
        'Exfoliation comes first, and it does two jobs. Pronalen AHA 50 is a blend of alpha hydroxy acids (AHAs) from passion fruit, lemon, grape and pineapple. It gently loosens the “glue” that holds dead skin cells together, so dull, dry and rough skin lifts away and smoother, brighter skin shows underneath.',
        'Clearing that top layer also helps the freshly activated Vitamin C reach deeper and work more effectively.',
      ] },
      { h: 'Skin-loving ingredients', p: ['Alongside the Vitamin C, the facial uses a natural antimicrobial peptide that helps balance the skin’s pH and support its barrier, a deeply moisturising and conditioning ingredient that leaves skin soft and supple, and soothing ingredients such as Coolact that cool and calm the skin.'] },
      { h: 'The oxygenating bubbling mask', p: ['The treatment finishes with an oxygenating bubbling mask. It foams up as it meets oxygen, creating a light, fluffy texture, and is enhanced with active ingredients to refresh the skin and support the results of the facial.'] },
    ],
    benefits: [
      { h: 'Straight away', list: ['An immediate glow, with skin that looks fresher and more radiant', 'Smoother-looking texture', 'Skin that feels soft, supple and hydrated'] },
      { h: 'What the ingredients contribute', list: ['A brighter, more even-looking complexion', 'The appearance of fine lines softened', 'Dark spots and uneven tone looking less noticeable', 'Antioxidant support against everyday environmental stress such as pollution'] },
    ],
    suits: [
      'Your skin looks dull or tired and has lost its glow',
      'Your skin tone looks uneven, or you have mild pigmentation or dark spots',
      'Your skin looks sun-damaged',
      'You have oily or acne-prone skin and no active breakouts',
      'You are noticing early signs of ageing and want brighter, fresher-looking skin',
    ],
    session: {
      numbered: true,
      steps: ['Deep cleansing', 'Gentle exfoliation with Pronalen AHA 50 to lift away dead skin cells', 'Booster application: three advanced forms of Vitamin C, freshly activated', 'Massage', 'Oxygenating bubbling mask', 'Hydration with a booster', 'Aftercare with Vitamin C Radiance Cream'],
      note: 'You may feel mild tingling during the treatment, which is normal.',
    },
    awardsLine: 'Multi-award-winning wellness. Over 25 years of care.',
    faq: [
      { q: 'What makes the 3C Vitamin Glow Treatment different?', a: 'It uses freshly activated, mono-dose Vitamin C, so the Vitamin C is opened and activated at your session rather than sitting in a bottle. It also combines three forms of Vitamin C (AA2, SAP and EAA) that each play a different role, then adds gentle AHA exfoliation and an oxygenating mask.' },
      { q: 'What does “freshly activated” mean?', a: 'Vitamin C oxidises quickly, which weakens it. A mono-dose is a single-use portion, and it is activated just before it goes on your skin, so you receive it at full potency.' },
      { q: 'What is Pronalen AHA 50?', a: 'Pronalen AHA 50 is a blend of alpha hydroxy acids (AHAs) from passion fruit, lemon, grape and pineapple. It loosens the bonds between dead skin cells so they lift away, which leaves smoother, brighter skin. Most clients find it comfortable.' },
      { q: 'Will my skin feel irritated afterwards?', a: 'Most clients feel comfortable afterwards. You may feel mild tingling during the treatment, which is normal, and the facial includes soothing ingredients such as Coolact to keep the experience comfortable.' },
      { q: 'How soon will I see results?', a: 'Many clients notice an immediate glow and smoother-looking skin after one session.' },
      { q: 'How often should I have the 3C Vitamin Glow Treatment?', a: 'For maintenance: once a month.' },
      { q: 'Can I combine it with other treatments?', a: 'Yes. The 3C Vitamin Glow Treatment can be paired with other treatments to address specific concerns. Ask your therapist to help you plan what suits your skin.' },
      { q: 'Is there any downtime?', a: 'There is no downtime. You can return to your day straight after your session.' },
      { q: 'How do I look after my skin between visits?', a: 'A consistent routine helps your skin keep its glow: a serum, a moisturiser, daily sunscreen and gentle exfoliation. Your session ends with Vitamin C Radiance Cream, and your therapist can recommend products for your skin type.' },
    ],
    related: {
      treatments: [
        { id: 'power-dose', text: 'An infusion of brightening and hydrating actives for radiant-looking skin.' },
        { id: 'probiotic', text: 'Pre- and probiotics to support the skin’s barrier and help calm reactive-looking skin.' },
      ],
      guides: [{ url: '/dull-tired-skin/', label: 'Dull & Tired-Looking Skin' }, { url: '/pigmentation-uneven-skin-tone/', label: 'Pigmentation & Uneven Skin Tone' }],
      boosters: [{ url: '/facial-boosters/', label: 'Facial boosters' }],
    },
  },

  'meridian-bojin-facial': {
    source: 'Meridian Bojin Facial — page draft.docx (13 Oct 2026)',
    title: 'Meridian Bojin Facial in Singapore | Elements Wellness',
    description: 'Meridian Bojin Facial in Singapore: a 90-minute facial using buffalo horn tool to massage long the face’s meridian points to release tension, ease puffiness and lift the look of the face.',
    oldUrl: '/services/facial/meridian-bojin-facial/',
    h1: 'Meridian Bojin Facial',
    lede: 'Works along the meridian points of the face with a buffalo horn Bojin tool to release tension, ease puffiness and leave your skin looking lifted and radiant.',
    intro: 'Meridian Bojin Facial is a facial at Elements Wellness in Singapore, where your therapist uses a handcrafted buffalo horn tool and Red Ginseng to apply focused pressure along facial meridian points, following principles from Traditional Chinese Medicine. It releases facial tension, supports circulation and sculpts your contours, giving an instant face lift.',
    facts: { duration: '90 min', firstTrial: 'S$194', usual: 'S$388', outlets: ['ion', 'centrepoint', '313'], outletNames: 'ION Orchard · Centrepoint · 313@Somerset' },
    about: [
      { h: 'Working along the face’s meridians', p: [
        'In TCM, meridians are channels that carry Qi — the body’s vital energy — and the points on your face are connected to your organs through them. Your therapist works along these points with a buffalo horn tool, and areas that feel tender or uncomfortable receive more attention to energise the channels.',
        'In TCM, a well-balanced flow of energy rejuvenates cells and slows the ageing process, improving the complexion.',
      ] },
      { h: 'The Bojin technique', p: [
        'Bojin massage uses specially handcrafted buffalo horns to give an instant face lift. The gua sha-inspired tool applies acupressure along the meridian lines to relieve facial tension, improve blood flow and sculpt your contours, and the pressure on these points helps soften the appearance of fine lines.',
        'The facial also includes a lymphatic massage of the face and shoulders, which aids relaxation and supports lymph flow.',
      ] },
      { h: 'Balancing Yin and Yang', p: ['TCM describes the body’s balance through Yin and Yang, two complementary forces. Working to regulate them helps moisten facial tissues and relieve tension.'] },
      { h: 'Red ginseng alongside the technique', p: ['Premium red ginseng — used for energy balancing and for the look of the skin. It helps reduce the appearance of wrinkles and fine lines, supports a firmer look, brightens skin tone and helps protect the skin from free radicals (unstable molecules from sources such as pollution and sunlight that can stress skin cells) and environmental damage.'] },
    ],
    benefits: [
      { h: 'Straight away', list: ['An instant face lift, with more defined contours', 'Visibly less puffiness', 'Facial tension released', 'Skin that looks more radiant, and less dull and tired'] },
      { h: 'Ongoing benefits', list: ['Support for skin elasticity, so the face looks firmer', 'Better blood flow and circulation across the face', 'The appearance of fine lines softened', 'A sense of relaxation and balance'] },
    ],
    suits: [
      'Your face looks puffy because of water retention',
      'Your skin has lost some elasticity, or you notice mild sagging and less facial definition',
      'You want to contour and define your face with a natural-looking lift and glow',
      'Your skin looks dull, tired or uneven',
      'Your face holds tension that a regular facial doesn’t reach',
    ],
    session: {
      numbered: true,
      steps: ['Professional cleansing, exfoliation and extraction', 'Bojin meridian massage with a handcrafted buffalo horn tool and premium red ginseng cream, applying pressure along the facial meridian points and giving extra attention to areas that feel tender', 'Lymphatic massage of the face and shoulders', 'Customised mask', 'Aftercare'],
    },
    awardsLine: 'Multi-award-winning wellness. Over 25 years of care.',
    faq: [
      { q: 'What is a Bojin tool?', a: 'A Bojin tool is a handcrafted buffalo horn tool used in a gua sha-style massage. Your therapist uses it with pressure along the meridian points of your face to release tension and sculpt your contours.' },
      { q: 'What are meridians?', a: 'In Traditional Chinese Medicine, meridians are channels through which Qi, the body’s vital energy, is understood to flow. The points on your face connect to your organs through these channels, which is why the facial works on specific points rather than the whole face at once.' },
      { q: 'What will I notice after the facial?', a: 'You may notice your face looks lifted and fresher straight away, with less puffiness and a more radiant tone. Many clients also feel the tension in their face ease.' },
      { q: 'How often should I have the Meridian Bojin Facial?', a: 'For maintenance: once a month.' },
      { q: 'What does red ginseng do in this facial?', a: 'Premium red ginseng is used for energy balancing and for the look of your skin. It helps reduce the appearance of wrinkles and fine lines, supports a firmer look, brightens skin tone and helps protect the skin from free radicals and environmental damage.' },
    ],
    related: {
      treatments: [
        { id: 'lymphatic-sculpt', text: 'Manual drainage with supporting ingredients to ease puffiness and define your contours.' },
        { id: 'hanbang-fascia', text: 'Korean Hanbang extracts combined with fascia therapy for the face.' },
      ],
      guides: [{ url: '/puffiness-facial-definition/', label: 'Puffiness & Facial Definition' }],
      boosters: [{ url: '/facial-boosters/', label: 'Facial boosters' }],
    },
  },

  'nir-cellbright': {
    source: 'NIR CellBright Facial — Treatment Page Draft.docx (12 Oct 2026)',
    title: 'NIR CellBright Facial: Brighter Skin | Elements Wellness',
    description: 'Near-infrared warmth and Cryo-Infusion cooling for brighter skin and a firmer, more lifted look. 75 minutes, no needles, no downtime.',
    oldUrl: '/services/facial/nir-cellbright-facial/',
    h1: 'NIR CellBright Facial',
    lede: 'Near-infrared warmth and Cryo-Infusion cooling to brighten skin and support a firmer, more lifted look',
    intro: 'The NIR CellBright Facial uses near-infrared light to warm the deeper layers of your skin, where collagen is made, then follows with Cryo-Infusion cooling to refresh the skin and hold in hydration. Skin can look brighter and feel tighter straight away, and the benefits keep building over the following weeks. There are no needles and no downtime.',
    facts: { duration: '75 minutes', firstTrial: 'S$194', usual: 'S$388', outlets: ['ion', 'centrepoint', '313'], outletNames: 'ION Orchard · Centrepoint · 313@Somerset' },
    about: [
      { h: 'Near-infrared warmth: working below the surface', p: [
        'Most facials work on the surface. Near-infrared light, delivered with Alma™ technology, passes through the surface to warm the dermis, the deeper layer of skin where collagen is made, to between about 39°C and 42°C. It feels like a comfortable warmth, and the handpiece keeps moving across the skin so the heat builds evenly.',
        'As the tissue warms, two things happen. The collagen fibres already there contract, which can give skin a tighter, more lifted look straight away. The warmth also stimulates your skin’s collagen-making cells, called fibroblasts, and boosts circulation, supporting your skin’s own collagen renewal over the weeks that follow. Circulation is also what gives the complexion its brighter, lit-from-within look.',
        'Gentle warmth may also help relax the superficial fascia, the thin connective layer under the skin, and the tension held in the jaw. Both can contribute to a heavier-looking lower face.',
      ] },
      { h: 'Cryo-Infusion cooling: the contrast that resets the skin', p: ['Warmth is followed by cold. Cooling helps reduce visible puffiness, leaves skin feeling tighter and refreshed, helps refine the look of pores and holds in hydration for a dewy finish.'] },
      { h: 'Why the two work together', p: ['Warmth activates the deeper collagen response, and cold calms and sets the result at the surface. Together they give a visible lift and glow now, while supporting firmer, more defined-looking skin over time.'] },
    ],
    benefits: [
      { h: 'Straight after your session', list: ['Skin looks brighter, with a lit-from-within glow', 'A tighter, lifted look through the cheeks and jawline', 'Less visible puffiness and a fresher, more hydrated finish', 'Pores look more refined'] },
      { h: 'Over the following weeks', list: ['Skin feels and looks firmer as collagen renewal continues', 'A more defined jawline', 'Skin that looks smoother and more luminous, and may show softer-looking fine lines'] },
      { h: 'Over time', p: ['The benefits build the more consistently you return, with no needles and no downtime in between.'] },
    ],
    suits: [
      'A jawline that looks softer or "heavier" than it used to, or cheeks that have lost some lift',
      'Skin that looks dull or tired, with little natural radiance, or uneven in tone',
      'Early loss of firmness and fine lines you would like to soften without needles',
      'Enlarged-looking pores, or skin that has lost some texture or looks thinner',
      'Tension held in the jaw that seems to drag the lower face down',
      'Skin that looks puffy as well as tired',
      'Wanting glow and lift without invasive treatment',
    ],
    session: {
      numbered: true,
      steps: [
        'Deep cleansing: clears away buildup so skin is fresh and ready for treatment.',
        'Expert extraction: clears congestion for smoother, cleaner-looking pores.',
        'Targeted NIR application: near-infrared warmth is worked across the face, a comfortable, relaxing heat much like a hot stone massage or warm sunlight.',
        'Cryo-Infusion: rapid cooling refines the look of pores, reduces puffiness and holds in hydration.',
        'Customised mask: chosen for your skin’s needs, to replenish, calm or brighten.',
        'Finishing layers: protective layers that keep hydration in and leave skin comfortable and luminous.',
      ],
    },
    awardsLine: 'Multi-award-winning wellness. Over 25 years of care.',
    faq: [
      { q: 'How is this different from a regular facial?', a: 'A regular facial works mainly on cleansing, hydration and the condition of the skin’s surface. The NIR CellBright Facial goes deeper: near-infrared light warms the layer beneath the surface where collagen is made, then cooling refreshes the skin and reduces puffiness. The result is brighter, firmer-looking skin, with benefits that keep building over time.' },
      { q: 'What is collagen, and why does warming the skin matter?', a: 'Collagen is the protein that gives skin its structure and firmness, and it is made by cells called fibroblasts in the dermis. As production slows, skin can lose firmness and the jawline and cheeks can look softer. Warmth prompts the collagen already there to tighten and stimulates fibroblasts to make more. New collagen takes time to mature, which is why firming builds gradually over the weeks after your session rather than all at once.' },
      { q: 'What is Cryo-Infusion?', a: 'Cryo-Infusion is the cooling step that follows the near-infrared warmth. The skin is cooled rapidly, which narrows the blood vessels near the surface, a deliberate contrast with the warmth before it that supports healthy circulation through the skin. The cooling helps de-puff the skin and leaves it feeling tighter and refreshed.' },
      { q: 'What does it feel like?', a: 'A comfortable, relaxing warmth, similar to a hot stone massage or warm sunlight on the skin. The Cryo-Infusion then brings a cooling contrast.' },
      { q: 'Is there any downtime?', a: 'No. There are no needles and no downtime, so you can apply makeup and carry on with your day straight after your facial.' },
      { q: 'How often should I have it?', a: 'For maintenance: once a month. The benefits build the more consistently you return.' },
      { q: 'Is it suitable for men?', a: 'Yes. The treatment works on the same skin layers whoever is in the chair, and the concerns it addresses (a less defined jawline, larger-looking pores, tired-looking skin) are not specific to any gender.' },
    ],
    related: {
      treatments: [
        { id: 'ipl', text: 'Customisable light energy chosen for visible pigmentation, breakouts and uneven skin tone.' },
        { id: 'wishpro', text: 'A magnetic infusion using a serum capsule chosen to suit how your skin is that day.' },
      ],
      guides: [{ url: '/fine-lines-firmness/', label: 'Fine Lines & Firmness' }, { url: '/dull-tired-skin/', label: 'Dull & Tired-Looking Skin' }],
      boosters: [{ url: '/facial-boosters/', label: 'Facial Boosters' }],
    },
  },

  'deep-tissue': {
    source: 'Deep Tissue Massage — Treatment Page Draft.docx (12 Oct 2026)',
    title: 'Deep Tissue Massage for Muscle Tension | Elements Wellness',
    description: 'Firm, slow pressure worked into deeper muscle layers to ease neck, shoulder and back tension. 60 minutes at ION Orchard, Centrepoint and 313@Somerset.',
    oldUrl: '/services/massage/deep-tissue-massage/',
    h1: 'Deep Tissue Massage',
    lede: 'Slow, firm pressure that eases deep muscle tension in the neck, shoulders and back',
    intro: 'Deep tissue massage uses slow, sustained pressure to work into the deeper layers of muscle and the connective tissue around them. It is for the tension that builds over months in the neck, shoulders and back, and that a lighter massage tends to skim over. Your therapist works firmly, within a pressure you can tolerate.',
    facts: { duration: '60 minutes', firstTrial: 'S$68', webPromo: 'S$88', usual: 'S$158', outlets: ['ion', 'centrepoint', '313'], outletNames: 'ION Orchard · Centrepoint · 313@Somerset' },
    about: [
      { h: 'Why long-held tension needs deeper work', p: [
        'Tension that has built up over months rarely lets go in a single gentle pass. When muscle fibres stay contracted for long stretches (from desk work, screen time, training or stress), the fascia around them can stiffen and the layers of tissue may begin to stick together. The body often compensates by shifting the workload to neighbouring areas. That is why a tight lower back can turn into tight hips or sore shoulders.',
        'Deep tissue massage moves through the surface layers with slow, deliberate strokes to reach those deeper structures. Four techniques do most of the work:',
      ], list: [
        'Sustained pressure: firm, held pressure at the points where fibres have knotted. It gives the tissue time to soften and release rather than brace against you.',
        'Cross-fibre friction: strokes across the direction of the muscle fibres, worked into areas where tissue has become stuck, to help it move more freely.',
        'Myofascial release: slow, lengthening pressure along the fascia, the thin connective sheath around each muscle. It eases stiffness and supports easier movement.',
        'Trigger point work: concentrated pressure on tender, knotted spots in a muscle that can send discomfort to other areas or limit how freely you move.',
      ], after: ['Used together, they work on the knot itself, the tissue around it and the fascia that links it to the next area. That is why deep tissue work can reach tension that lighter massage leaves behind.'] },
    ],
    benefits: [
      { h: 'By the end of your session', list: ['Many clients feel looser, with the neck, shoulders or back less tight'] },
      { h: 'In the 24–48 hours afterwards', list: ['Movement through stiff shoulders, hips or spine can continue to ease', 'Neck and shoulder tension that often goes with tension headaches may feel lighter', 'Some mild soreness in the areas worked is a normal response to firm pressure'] },
      { h: 'Over repeated sessions', p: ['Because the work addresses the tension patterns themselves, regular sessions may help stop them building back up between visits.'] },
    ],
    suits: [
      'Neck and shoulders that feel tight after long days at a desk or on a screen',
      'A stiff, tight lower back that keeps coming back',
      'Deep knots that lighter massage has never quite shifted',
      'Muscles that feel sore and tight after hard training',
      'Stiff hips, shoulders or spine that limit how freely you move',
      'Tension that creeps from the neck up into the base of the skull',
      'Overuse tension from repeated movements in sport, work or daily habit',
    ],
    session: {
      steps: [
        'Firm, focused pressure is worked across the back, shoulders, hips and legs, where tension tends to hold deepest',
        'Strokes are slow and deliberate, beginning with lighter pressure to warm the tissue before the deeper work starts',
        'Pressure is held at knots, strokes run across the muscle fibres, and slow lengthening pressure follows the fascia',
        'You may feel discomfort as tension releases, firm and sometimes intense but within what you can tolerate',
        'Your therapist adjusts pressure as the session goes, so tell them if it is too much or not enough',
      ],
    },
    awardsLine: 'Over 25 years of care. More than a million massages. Multi-award-winning wellness.',
    faq: [
      { q: 'Will deep tissue massage hurt?', a: 'Expect firm pressure, and some discomfort where muscles are tight, most noticeable at the moment a knot releases. It should stay within what you can tolerate, and you are in control of that. Tell your therapist if the pressure is too much or not enough, and they will adjust it throughout the session.' },
      { q: 'What will I feel afterwards?', a: 'Some clients notice mild soreness in the treated areas for 24–48 hours, a normal response as the tissue adjusts after deep pressure work. Many also feel looser and move more freely within the same window. Drinking water after your session and avoiding intense exercise for the rest of the day gives the tissue time to recover.' },
      { q: 'How often should I book?', a: 'For a specific concern: 5 sessions over 3 weeks. For maintenance: once or twice a month. A course gives the tissue time to change progressively rather than returning to the same pattern between visits, and you do not need to commit to a course in advance. Your therapist can talk you through what suits you after your first session.' },
      { q: 'How is it different from a lighter, relaxation massage?', a: 'A lighter massage works mainly on the muscle nearer the surface. Deep tissue is slower and firmer, using sustained pressure to reach the deeper muscle layers and the connective tissue around them, which is where long-held tension and knots tend to sit. If you mainly want to unwind, a lighter massage may suit you better. If tension keeps returning to the same places, deep tissue works on it directly.' },
      { q: 'What is myofascial release?', a: 'Fascia is the thin sheet of connective tissue that wraps around every muscle, from individual fibres to whole muscle groups. When it stiffens, movement can feel restricted. Myofascial release is slow, sustained pressure that lengthens along the fascia, easing that stiffness so the muscle can move more freely.' },
      { q: 'What is a trigger point?', a: 'A trigger point is a small, tender knot in a muscle, often felt as a sore spot when pressed. Trigger points can send discomfort to other areas, which is why a tight spot in the shoulder can show up as tension in the neck or head. In your session, concentrated pressure is applied to these spots to help them release.' },
    ],
    related: {
      treatments: [
        { id: 'ginseng-bojin', text: 'Bojin pressure work along the body’s meridian lines to release deep-seated tension.' },
        { id: 'acuwave', text: 'Therapeutic microcurrents that support the body’s natural recovery.' },
      ],
      guides: [{ url: '/neck-shoulder-back-tension/', label: 'Neck, Shoulder & Back Tension' }, { url: '/tech-neck-headaches/', label: 'Tech Neck & Headaches' }, { url: '/post-workout-recovery/', label: 'Post-Workout Soreness & Recovery' }, { url: '/stiffness-limited-mobility/', label: 'Stiffness & Limited Mobility' }],
      boosters: [{ url: '/massage-recovery-boosters/', label: 'Massage & Recovery Boosters' }],
    },
  },

  prenatal: {
    source: 'Prenatal Massage — page draft.docx (13 Oct 2026)',
    title: 'Prenatal Massage in Singapore | Elements Wellness',
    description: 'Prenatal massage in Singapore: a gentle side-lying massage with cushion support to ease pregnancy aches, swelling and tension, and help you rest.',
    oldUrl: '/services/massage/prenatal-massage/',
    h1: 'Prenatal Massage',
    lede: 'Eases pregnancy aches, swelling and tension, and helps you rest.',
    intro: 'Prenatal Massage is a gentle massage adapted for pregnancy, and a chance to heal and restore before giving birth. Your therapist supports you on your side with pillows and cushions, and uses gentle, targeted techniques that suit the changes in your body.',
    facts: { duration: '60 min', firstTrial: 'S$98', webPromo: 'S$108', usual: 'S$228', outlets: ['ion', 'centrepoint', '313'], outletNames: 'ION Orchard · Centrepoint · 313@Somerset' },
    about: [
      { h: 'Pregnancy aches, and how massage helps', p: [
        'Pregnancy puts new strain on your back, hips, legs and neck, and it can make it hard to get comfortable or sleep well. Prenatal massage can help ease common discomforts such as back pain, hip pain, leg cramps and sciatic nerve pain by relieving tension in your muscles and joints.',
        'Pregnancy can also reduce circulation in the legs and feet, because of increased pressure on blood vessels. Massage supports blood and lymphatic circulation, which helps ease swelling (oedema).',
        'Prenatal massage can also help reduce stress hormones such as cortisol, the body’s main stress hormone, while supporting the release of feel-good hormones such as serotonin and dopamine. This can lift mood and emotional wellbeing.',
      ] },
      { h: 'Adapted for pregnancy', p: [
        'Your prenatal massage is performed by a qualified therapist. The techniques are adapted to the changes in your body — for example, you lie on your side with the support of pillows and cushions for comfort. Therapists use gentle, targeted techniques and avoid sensitive pressure points, for a relaxing and safe experience.',
        'The massage is suitable from the 18th week of pregnancy, when the body is better prepared for massage therapy, and we see clients from their 18th to 32nd weeks. We keep a clean, soothing environment for every session.',
      ] },
    ],
    benefits: [
      { h: 'Straight away', list: ['Tension eased in your back, hips, legs and neck', 'Legs and feet that feel lighter as swelling eases', 'A calmer, more relaxed state of mind', 'Head, neck and shoulders feeling looser, with tension headaches eased'] },
      { h: 'Ongoing benefits', list: ['Easier rest — relaxation and eased tension can help you sleep better and for longer', 'Support for mood and emotional wellbeing through lower stress', 'A nurturing, relaxing experience for you and your baby'] },
    ],
    suits: [
      'Your lower back, hips or neck ache as your bump grows',
      'Your legs and feet feel swollen or heavy',
      'You get leg cramps or sciatic nerve pain',
      'You find it hard to rest or sleep comfortably',
      'You carry tension in your head, neck and shoulders, or get tension headaches',
      'You feel stressed or anxious and want to feel calmer',
    ],
    session: {
      steps: ['You lie on your side, supported by pillows and cushions', 'Your therapist uses gentle, targeted techniques that avoid sensitive pressure points', 'Techniques for the head, neck and shoulders, and for tension in your muscles and joints'],
    },
    awardsLine: 'Over 25 years of care. More than a million massages. Multi-award-winning wellness.',
    awardNote: 'Best Prenatal Massage — Beauty Insider Readers’ Choice Award (2025).',
    faq: [
      { q: 'What is prenatal massage?', a: 'Prenatal massage, also called pre-partum massage, is a massage adapted for pregnancy. Your therapist adjusts the position and the techniques to suit your changing body, so you can rest and ease common aches in comfort.' },
      { q: 'Is prenatal massage safe?', a: 'Our therapists are qualified in prenatal care and use gentle, targeted techniques that avoid sensitive pressure points, which makes the session relaxing and safe within the weeks we treat, from the 18th to the 32nd week of pregnancy. Every pregnancy is different, so if you have any pregnancy-related conditions it is sensible to check with your healthcare provider first.' },
      { q: 'When can I have a prenatal massage?', a: 'We see pregnant clients from their 18th to 32nd weeks. The massage is suitable from the 18th week, when the body is better prepared for massage therapy.' },
      { q: 'Will it help with swelling?', a: 'Pregnancy can reduce circulation in the legs and feet because of increased pressure on blood vessels. Prenatal massage supports blood and lymphatic circulation, which helps ease swelling (oedema).' },
      { q: 'Can it help me sleep better?', a: 'Many mums-to-be find it hard to sleep because of discomfort, hormonal changes and anxiety. Prenatal massage promotes relaxation and eases tension, which can help you rest better and for longer.' },
      { q: 'Should I have a prenatal massage?', a: 'If you are experiencing discomfort or stress during pregnancy, a prenatal massage may offer relief and relaxation. Whether it is right for you depends on your health, any pregnancy-related conditions and how comfortable you feel with massage, so it helps to have your healthcare provider’s agreement first.' },
    ],
    related: {
      title: 'Related treatments',
      treatments: [{ id: 'postnatal', text: 'A restorative massage to support your recovery after birth.' }],
      guides: [],
      boosters: [],
    },
  },
};
