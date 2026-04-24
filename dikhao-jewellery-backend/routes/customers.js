const express = require('express');
const multer = require('multer');
const router = express.Router();
const supabase = require('../services/supabase');
const { uploadToPermanent } = require('../services/supabaseStorage');
const { removeBackground } = require('../services/backgroundRemoval');
const { dressInKurta } = require('../services/imageEdit');
const requireAuth = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } });

// Fire-and-forget: dress the customer in a plain white kurta and clean the background.
// Primary path: Gemini 2.5 Flash Image (one call dresses + cleans + removes existing jewellery).
// Fallback: rembg (bg removal only, original clothing retained) if Gemini is unavailable or blocked.
async function processCustomerBgCleanAsync(customerId, buffer, storeId, inputMime = 'image/jpeg') {
  const t0 = Date.now();
  let finalBuffer = null;
  let finalMime   = 'image/png';
  let pathLabel   = '';

  // 1. Try Gemini image edit (dress in kurta + clean bg)
  try {
    finalBuffer = await dressInKurta(buffer, inputMime);
    finalMime = 'image/png';
    pathLabel = 'gemini-kurta';
  } catch (geminiErr) {
    console.error(`[customer-bg ${customerId}] gemini failed (${geminiErr.message}) — falling back to rembg`);
  }

  // 2. Fallback to rembg if Gemini failed
  if (!finalBuffer) {
    try {
      finalBuffer = await removeBackground(buffer);
      pathLabel = 'rembg-fallback';
    } catch (rembgErr) {
      console.error(`[customer-bg ${customerId}] rembg also failed:`, rembgErr.message);
      return;
    }
  }

  try {
    const cleanUrl = await uploadToPermanent(finalBuffer, storeId, finalMime);
    await supabase.from('customers')
      .update({ photo_clean_url: cleanUrl })
      .eq('id', customerId);
    console.log(`[customer-bg ${customerId}] done via ${pathLabel} in ${Date.now() - t0}ms`);
  } catch (uploadErr) {
    console.error(`[customer-bg ${customerId}] upload failed:`, uploadErr.message);
  }
}

// POST /api/customers  multipart: { name, mobile, photoFile? }
router.post('/', requireAuth, upload.single('photoFile'), async (req, res) => {
  const t0 = Date.now();
  const { name, mobile } = req.body;
  const size = req.file?.buffer?.length || 0;
  console.log(`[customers.post] name=${name} mobile=${mobile} photo=${size}B`);
  if (!name || !mobile) return res.status(400).json({ error: 'Name and mobile required.' });

  const { data: existing } = await supabase
    .from('customers')
    .select('*')
    .eq('store_id', req.store.id)
    .eq('mobile', mobile)
    .single();

  if (!existing && !req.file) {
    return res.status(400).json({ error: 'Customer photo required for new customers.' });
  }

  try {
    let photo_url = existing?.photo_url;
    const payload = { store_id: req.store.id, name, mobile };

    if (req.file) {
      // New photo uploaded — replace stored photo, clear clean URL (will be regenerated).
      photo_url = await uploadToPermanent(req.file.buffer, req.store.id, req.file.mimetype);
      payload.photo_url = photo_url;
      payload.photo_clean_url = null;
    } else if (photo_url) {
      payload.photo_url = photo_url;
    }

    const { data, error } = await supabase
      .from('customers')
      .upsert(payload, { onConflict: 'store_id,mobile' })
      .select('*')
      .single();

    if (error) return res.status(500).json({ error: 'Could not save customer.' });

    // Increment store.customers_used only for NEW customers (not returning).
    // `existing` was queried at the top of the handler BEFORE the upsert.
    if (!existing) {
      try {
        const { data: storeRow } = await supabase
          .from('stores').select('customers_used').eq('id', req.store.id).single();
        const next = (storeRow?.customers_used || 0) + 1;
        await supabase.from('stores').update({ customers_used: next }).eq('id', req.store.id);
      } catch (err) {
        console.error(`[customers.post] counter increment failed:`, err.message);
      }
    }

    console.log(`[customers.post] done in ${Date.now() - t0}ms, id=${data.id}, newCustomer=${!existing}`);
    res.json({ customer: data });

    // Async: dress in kurta + clean the bg so future try-ons use a standardised photo.
    if (req.file) {
      processCustomerBgCleanAsync(data.id, req.file.buffer, req.store.id, req.file.mimetype);
    }
  } catch (err) {
    console.error('customers.post:', err.message);
    res.status(500).json({ error: 'Upload failed.' });
  }
});

// GET /api/customers → list all customers for this store
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, mobile, photo_url, photo_clean_url, created_at')
    .eq('store_id', req.store.id)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ customers: data || [] });
});

// GET /api/customers/search?mobile=XXXXXXXXXX
router.get('/search', requireAuth, async (req, res) => {
  const { mobile } = req.query;
  if (!mobile) return res.status(400).json({ error: 'mobile required' });
  const { data } = await supabase
    .from('customers')
    .select('*')
    .eq('store_id', req.store.id)
    .eq('mobile', mobile)
    .single();
  res.json({ customer: data || null });
});

// GET /api/customers/:id
router.get('/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', req.params.id)
    .eq('store_id', req.store.id)
    .single();
  if (error || !data) return res.status(404).json({ error: 'Not found' });
  res.json({ customer: data });
});

module.exports = router;
