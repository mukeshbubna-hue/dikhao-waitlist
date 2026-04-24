// Editorial Indian bridal + jewellery photography from Unsplash.
// All IDs verified to exist. Sizes kept tight for fast 4G load.

const unsplash = (id, { w = 900, h = 1125, q = 72 } = {}) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=${q}&fm=webp`;

// ── Hero (above the fold, preloaded) — full Indian bridal look ────────────
export const HERO_PRIMARY = unsplash('photo-1740431377901-c2f28d50c759', { w: 1000, h: 1250, q: 78 });

// ── Section 1 ("she'll pick seven, try two") — hands + bangles close-up ──
export const SECTION1_IMAGE = unsplash('photo-1613665667184-81bb9b8605e2', { w: 900, h: 1125 });

// ── How it works — narrative triptych: same woman without → necklace → wearing it
// Step 3 is an actual Vertex VTON generation (our own pipeline demonstrating itself)
export const STEP_IMAGES = {
  step1: '/how-it-works/step1.jpg', // bust shot, no necklace
  step2: '/how-it-works/step2.jpg', // the necklace product
  step3: '/how-it-works/step3.jpg', // same woman wearing the necklace (VTON output)
};

// ── Showcase grid — 6 categories ──────────────────────────────────────────
export const CATEGORY_IMAGES = {
  necklace: unsplash('photo-1677084214263-13a2ef96a54c', { w: 600, h: 750 }),
  earrings: unsplash('photo-1630019852942-f89202989a59', { w: 600, h: 750 }),
  choker:   unsplash('photo-1652375152241-d3e62ab52b57', { w: 600, h: 750 }),
  pendant:  unsplash('photo-1611085583191-a3b181a88401', { w: 600, h: 750 }),
  borla:    unsplash('photo-1733937108021-d5db469f2216', { w: 600, h: 750 }),
  nath:     unsplash('photo-1740431377901-c2f28d50c759', { w: 600, h: 750 }),
};
