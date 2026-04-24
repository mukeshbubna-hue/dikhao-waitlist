const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const requireAuth = require('../middleware/auth');
const { processJewelleryTryOn } = require('../services/jewelleryTryOnPipeline');

// POST /api/tryon-jewellery   body: { customerId, productId }
// Creates a session, fires the Vertex pipeline async, returns { sessionId }.
router.post('/', requireAuth, async (req, res) => {
  const { customerId, productId } = req.body;
  if (!customerId || !productId) {
    return res.status(400).json({ error: 'customerId and productId required' });
  }

  // Verify customer belongs to this store
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('id', customerId)
    .eq('store_id', req.store.id)
    .single();
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  // Verify product belongs to this store
  const { data: product } = await supabase
    .from('jwl_products')
    .select('id')
    .eq('id', productId)
    .eq('shop_id', req.store.id)
    .eq('active', true)
    .single();
  if (!product) return res.status(404).json({ error: 'Product not found' });

  // Create session
  const { data: session, error } = await supabase
    .from('jwl_tryon_sessions')
    .insert({
      shop_id: req.store.id,
      customer_id: customerId,
      product_id: productId,
      status: 'queued',
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Respond immediately; process in background
  res.json({ sessionId: session.id });

  processJewelleryTryOn(session.id).catch(err => {
    console.error(`[jwl-tryon ${session.id}] background processing error:`, err.message);
  });
});

// GET /api/tryon-jewellery/today → today's sessions (for Dashboard "today's try-ons")
router.get('/today', requireAuth, async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('jwl_tryon_sessions')
    .select('id, status, result_url, product_id, customer_id, created_at')
    .eq('shop_id', req.store.id)
    .gte('created_at', startOfDay.toISOString())
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const sessions = data || [];

  // Attach customer name + mobile. Only query customers we actually need.
  const customerIds = Array.from(new Set(sessions.map(s => s.customer_id).filter(Boolean)));
  let customersById = {};
  if (customerIds.length) {
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, mobile')
      .in('id', customerIds);
    (customers || []).forEach(c => { customersById[c.id] = c; });
  }

  // Resolve shortlist status per session. Match shortlist_items via tryon_image_url.
  const resultUrls = sessions.map(s => s.result_url).filter(Boolean);
  let shortlistStatusByUrl = {};
  if (resultUrls.length) {
    const { data: items } = await supabase
      .from('jwl_shortlist_items')
      .select('tryon_image_url, shortlist_id')
      .in('tryon_image_url', resultUrls);
    const shortlistIds = Array.from(new Set((items || []).map(i => i.shortlist_id)));
    let shortlistsById = {};
    if (shortlistIds.length) {
      const { data: lists } = await supabase
        .from('jwl_shortlists')
        .select('id, sent_at, viewed_at')
        .in('id', shortlistIds);
      (lists || []).forEach(l => { shortlistsById[l.id] = l; });
    }
    (items || []).forEach(i => {
      const l = shortlistsById[i.shortlist_id];
      shortlistStatusByUrl[i.tryon_image_url] = {
        hearted: true,
        sent:   !!l?.sent_at,
        viewed: !!l?.viewed_at,
      };
    });
  }

  return res.json({
    sessions: sessions.map(s => ({
      id: s.id,
      status: s.status,
      result_url: s.result_url,
      created_at: s.created_at,
      customer: customersById[s.customer_id] || null,
      shortlist: shortlistStatusByUrl[s.result_url] || { hearted: false, sent: false, viewed: false },
    })),
  });
});

// GET /api/tryon-jewellery/:id → { status, resultUrl, productId, createdAt }
router.get('/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('jwl_tryon_sessions')
    .select('id, status, result_url, product_id, created_at')
    .eq('id', req.params.id)
    .eq('shop_id', req.store.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Session not found' });

  return res.json({
    id: data.id,
    status: data.status,
    resultUrl: data.result_url,
    productId: data.product_id,
    createdAt: data.created_at,
  });
});

module.exports = router;
