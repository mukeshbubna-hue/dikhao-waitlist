const express = require('express');
const multer = require('multer');
const router = express.Router();
const supabase = require('../services/supabase');
const { uploadToPermanent } = require('../services/supabaseStorage');
const requireAuth = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } });

// POST /api/customers  multipart: { name, mobile, photoFile? }
// Photo is optional for returning customers — their existing photo is reused.
router.post('/', requireAuth, upload.single('photoFile'), async (req, res) => {
  const { name, mobile } = req.body;
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

    if (req.file) {
      // New photo uploaded — replace stored photo
      photo_url = await uploadToPermanent(req.file.buffer, req.store.id, req.file.mimetype);
    }

    const { data, error } = await supabase
      .from('customers')
      .upsert(
        { store_id: req.store.id, name, mobile, photo_url },
        { onConflict: 'store_id,mobile' }
      )
      .select('*')
      .single();

    if (error) return res.status(500).json({ error: 'Could not save customer.' });
    res.json({ customer: data });
  } catch (err) {
    console.error('customers.post:', err.message);
    res.status(500).json({ error: 'Upload failed.' });
  }
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
