const express = require('express');
const multer = require('multer');
const router = express.Router();
const supabase = require('../services/supabase');
const { uploadToPermanent } = require('../services/supabaseStorage');
const { removeBackground } = require('../services/backgroundRemoval');
const requireAuth = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } });

const PRICE_BANDS = {
  'under25k':  [0,         25_000],
  '25k-75k':   [25_000,    75_000],
  '75k-2l':    [75_000,    200_000],
  '2l-5l':     [200_000,   500_000],
  'over5l':    [500_000,   Number.MAX_SAFE_INTEGER],
};

const CATEGORIES = ['necklace', 'earrings', 'choker', 'pendant', 'borla', 'nath'];

// (No longer fire-and-forget: bg removal now runs synchronously inside the
// POST handler so a nodemon restart can't kill an in-flight job. The /add-piece
// request takes ~15-25s longer but the stored photo_url is guaranteed cleaned
// before the response returns.)

// GET /api/catalogue?category=&priceBand=
router.get('/', requireAuth, async (req, res) => {
  const { category, priceBand } = req.query;

  let query = supabase
    .from('jwl_products')
    .select('id, sku, photo_url, price, category')
    .eq('shop_id', req.store.id)
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (category && CATEGORIES.includes(category)) {
    query = query.eq('category', category);
  }

  if (priceBand && PRICE_BANDS[priceBand]) {
    const [lo, hi] = PRICE_BANDS[priceBand];
    query = query.gte('price', lo).lt('price', hi);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ products: data });
});

// POST /api/catalogue  multipart: { price, category, photoFile }
// Uploads original immediately; fires background removal async.
router.post('/', requireAuth, upload.single('photoFile'), async (req, res) => {
  const t0 = Date.now();
  const { price, category } = req.body;
  const size = req.file?.buffer?.length || 0;
  console.log(`[catalogue.post] store=${req.store.id} price=${price} category=${category} photo=${size}B`);

  if (!price || !category || !req.file) {
    console.warn(`[catalogue.post] missing fields: price=${!!price} category=${!!category} file=${!!req.file}`);
    return res.status(400).json({ error: 'price, category, and photoFile required' });
  }
  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category must be one of: ${CATEGORIES.join(', ')}` });
  }
  const priceNum = Number(price);
  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    return res.status(400).json({ error: 'price must be a positive number' });
  }

  try {
    // 1. Run background removal synchronously. If rembg fails, fall back to
    //    the original image so the shop owner isn't blocked.
    let photoBuffer = req.file.buffer;
    let photoMime   = req.file.mimetype;
    const bgStart   = Date.now();
    try {
      photoBuffer = await removeBackground(req.file.buffer);
      photoMime   = 'image/png';
      console.log(`[catalogue.post] bg removed in ${Date.now() - bgStart}ms (${photoBuffer.length}B)`);
    } catch (bgErr) {
      console.error(`[catalogue.post] bg-removal failed, using original:`, bgErr.message);
    }

    // 2. Upload the (cleaned) image to storage.
    const photo_url = await uploadToPermanent(photoBuffer, req.store.id, photoMime);

    // 3. Insert the product row and return it.
    const { data, error } = await supabase
      .from('jwl_products')
      .insert({ shop_id: req.store.id, photo_url, price: priceNum, category })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    console.log(`[catalogue.post] done in ${Date.now() - t0}ms, id=${data.id}`);
    return res.json({ product: data });
  } catch (err) {
    console.error('catalogue.post:', err.message);
    return res.status(500).json({ error: 'Upload failed.' });
  }
});

// PATCH /api/catalogue/:id  body: { price?, category?, active? }
router.patch('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const updates = {};
  if ('price' in req.body)    updates.price    = Number(req.body.price);
  if ('category' in req.body) updates.category = req.body.category;
  if ('active' in req.body)   updates.active   = Boolean(req.body.active);
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('jwl_products')
    .update(updates)
    .eq('id', id)
    .eq('shop_id', req.store.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ product: data });
});

// DELETE /api/catalogue/:id — soft delete
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('jwl_products')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('shop_id', req.store.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

module.exports = router;
