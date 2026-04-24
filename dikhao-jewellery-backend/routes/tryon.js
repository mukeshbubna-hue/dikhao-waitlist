const express = require('express');
const multer = require('multer');
const router = express.Router();
const supabase = require('../services/supabase');
const { processTryOn } = require('../services/tryOnPipeline');
const { uploadToTemp } = require('../services/supabaseStorage');
const requireAuth = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } });

// POST /api/tryon/process   multipart: { customerId, shirtFile?, trouserFile? }
router.post('/process', requireAuth, upload.fields([
  { name: 'shirtFile',   maxCount: 1 },
  { name: 'trouserFile', maxCount: 1 },
]), async (req, res) => {
  const { customerId } = req.body;
  if (!customerId) return res.status(400).json({ error: 'customerId required' });

  const shirtFile   = req.files?.shirtFile?.[0];
  const trouserFile = req.files?.trouserFile?.[0];
  if (!shirtFile && !trouserFile) {
    return res.status(400).json({ error: 'At least one cloth photo required.' });
  }

  // Plan limit check
  const { data: store } = await supabase.from('stores').select('*').eq('id', req.store.id).single();
  const { data: planRow } = await supabase.from('plan_limits').select('*').eq('plan', store.plan).single();
  if (!planRow) return res.status(500).json({ error: 'Plan not configured.' });

  // Per-customer tryon limit (lifetime sessions done for this customer this plan period)
  const { count } = await supabase
    .from('tryon_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .eq('status', 'done')
    .gte('created_at', store.plan_start_date);
  if (count >= planRow.tryons_per_customer) {
    return res.status(403).json({ error: 'TRYON_LIMIT_REACHED' });
  }

  try {
    const shirt_url   = shirtFile   ? await uploadToTemp(shirtFile.buffer,   req.store.id, shirtFile.mimetype)   : null;
    const trouser_url = trouserFile ? await uploadToTemp(trouserFile.buffer, req.store.id, trouserFile.mimetype) : null;

    const { data: session, error } = await supabase.from('tryon_sessions').insert({
      store_id: req.store.id,
      customer_id: customerId,
      shirt_url,
      trouser_url,
      status: 'pending',
    }).select('*').single();
    if (error) return res.status(500).json({ error: 'Could not create session.' });

    // Fire-and-forget pipeline; client polls /status
    processTryOn(session.id).catch(err => console.error('pipeline:', err.message));

    res.json({ sessionId: session.id });
  } catch (err) {
    console.error('tryon.process:', err.message);
    res.status(500).json({ error: 'Failed to start try-on.' });
  }
});

// GET /api/tryon/status/:id
router.get('/status/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('tryon_sessions')
    .select('status, result_url, share_token, expires_at, created_at, customer_id')
    .eq('id', req.params.id)
    .eq('store_id', req.store.id)
    .single();
  if (error || !data) return res.status(404).json({ error: 'Not found' });

  // /view/:token is served directly by the backend (fast-loading plain HTML, no SPA).
  // Build an absolute URL from the Railway public domain (or whatever's configured).
  const base = process.env.BACKEND_PUBLIC_URL
    || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : '')
    || `${req.protocol}://${req.get('host')}`;
  const shareUrl = data.share_token ? `${base}/view/${data.share_token}` : null;

  res.json({
    status:     data.status,
    resultUrl:  data.result_url,
    shareUrl,
    expiresAt:  data.expires_at,
    createdAt:  data.created_at,
    customerId: data.customer_id,
  });
});

// POST /api/tryon/:id/sent  — mark whatsapp_sent = true
router.post('/:id/sent', requireAuth, async (req, res) => {
  await supabase.from('tryon_sessions')
    .update({ whatsapp_sent: true })
    .eq('id', req.params.id)
    .eq('store_id', req.store.id);
  res.json({ success: true });
});

// GET /api/tryon/today  — today's sessions for this store
router.get('/today', requireAuth, async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from('tryon_sessions')
    .select('id, status, whatsapp_sent, created_at, customers(name, mobile), shirt_url, trouser_url')
    .eq('store_id', req.store.id)
    .gte('created_at', startOfDay.toISOString())
    .order('created_at', { ascending: false });

  res.json({ sessions: data || [] });
});

module.exports = router;
