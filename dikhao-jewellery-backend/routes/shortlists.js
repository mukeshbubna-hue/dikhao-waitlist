const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const requireAuth = require('../middleware/auth');

const SHORTLIST_CAP = 7;

// Find the active shortlist for a customer (not-yet-expired),
// or create a new one if none exists.
async function findOrCreateActive(customerId, storeId, customerMobile) {
  const { data: existing } = await supabase
    .from('jwl_shortlists')
    .select('id')
    .eq('customer_id', customerId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from('jwl_shortlists')
    .insert({
      shop_id: storeId,
      customer_id: customerId,
      customer_mobile: customerMobile,
    })
    .select('id')
    .single();

  if (error) throw new Error('Could not create shortlist: ' + error.message);
  return created.id;
}

// POST /api/shortlists/add-item
// body: { customerId, productId, tryOnImageUrl }
router.post('/add-item', requireAuth, async (req, res) => {
  const { customerId, productId, tryOnImageUrl } = req.body;
  console.log(`[shortlists.add-item] store=${req.store.id} customer=${customerId} product=${productId}`);
  if (!customerId || !productId || !tryOnImageUrl) {
    console.warn(`[shortlists.add-item] missing fields: customerId=${!!customerId} productId=${!!productId} tryOnImageUrl=${!!tryOnImageUrl}`);
    return res.status(400).json({ error: 'customerId, productId, tryOnImageUrl required' });
  }

  // Load customer to get mobile + verify it belongs to this store
  const { data: customer } = await supabase
    .from('customers')
    .select('id, mobile')
    .eq('id', customerId)
    .eq('store_id', req.store.id)
    .single();
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  try {
    const shortlistId = await findOrCreateActive(customerId, req.store.id, customer.mobile);

    // Check cap and duplicate
    const { data: items } = await supabase
      .from('jwl_shortlist_items')
      .select('product_id')
      .eq('shortlist_id', shortlistId);

    const count = items?.length || 0;
    const alreadyAdded = items?.some(i => i.product_id === productId);

    // If she hearts the same product again (e.g. after a re-try that produced a better image),
    // update the stored tryon_image_url to the latest one. Avoids the "old bad image stuck in
    // shortlist" problem.
    if (alreadyAdded) {
      await supabase
        .from('jwl_shortlist_items')
        .update({ tryon_image_url: tryOnImageUrl })
        .eq('shortlist_id', shortlistId)
        .eq('product_id', productId);
      console.log(`[shortlists.add-item] ✓ updated existing item url for shortlist=${shortlistId} product=${productId}`);
      return res.json({ shortlistId, itemsCount: count, added: false, updated: true });
    }
    if (count >= SHORTLIST_CAP) {
      return res.status(409).json({
        error: 'Shortlist is full (max 7)',
        shortlistId,
        itemsCount: count,
        maxed: true,
      });
    }

    const { error: insertErr } = await supabase
      .from('jwl_shortlist_items')
      .insert({ shortlist_id: shortlistId, product_id: productId, tryon_image_url: tryOnImageUrl });
    if (insertErr) {
      console.error(`[shortlists.add-item] insert failed: ${insertErr.message}`);
      return res.status(500).json({ error: insertErr.message });
    }

    console.log(`[shortlists.add-item] ✓ shortlist=${shortlistId} count=${count + 1}`);
    return res.json({ shortlistId, itemsCount: count + 1, added: true });
  } catch (err) {
    console.error('[shortlists.add-item] error:', err.message);
    return res.status(500).json({ error: 'Could not add to shortlist' });
  }
});

// POST /api/shortlists/remove-item
// body: { customerId, productId }
router.post('/remove-item', requireAuth, async (req, res) => {
  const { customerId, productId } = req.body;
  if (!customerId || !productId) return res.status(400).json({ error: 'customerId, productId required' });

  const { data: customer } = await supabase
    .from('customers').select('id').eq('id', customerId).eq('store_id', req.store.id).single();
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  // Find active shortlist
  const { data: shortlist } = await supabase
    .from('jwl_shortlists')
    .select('id')
    .eq('customer_id', customerId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!shortlist) return res.json({ itemsCount: 0, removed: false });

  await supabase
    .from('jwl_shortlist_items')
    .delete()
    .eq('shortlist_id', shortlist.id)
    .eq('product_id', productId);

  const { count } = await supabase
    .from('jwl_shortlist_items')
    .select('*', { count: 'exact', head: true })
    .eq('shortlist_id', shortlist.id);

  return res.json({ shortlistId: shortlist.id, itemsCount: count || 0, removed: true });
});

// GET /api/shortlists/active?customerId=X
router.get('/active', requireAuth, async (req, res) => {
  const { customerId } = req.query;
  if (!customerId) return res.status(400).json({ error: 'customerId required' });

  const { data: shortlist } = await supabase
    .from('jwl_shortlists')
    .select('id, created_at, expires_at')
    .eq('customer_id', customerId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!shortlist) return res.json({ shortlist: null, items: [] });

  const { data: items } = await supabase
    .from('jwl_shortlist_items')
    .select('id, product_id, tryon_image_url, added_at')
    .eq('shortlist_id', shortlist.id)
    .order('added_at', { ascending: true });

  return res.json({ shortlist, items: items || [] });
});

// POST /api/shortlists/:id/mark-sent  → records that WhatsApp send was initiated
router.post('/:id/mark-sent', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('jwl_shortlists')
    .update({ sent_at: new Date().toISOString() })
    .eq('id', id)
    .eq('shop_id', req.store.id)
    .select('id, sent_at')
    .single();
  if (error || !data) return res.status(404).json({ error: 'Shortlist not found' });
  console.log(`[shortlists.mark-sent] ✓ ${id}`);
  return res.json({ sent_at: data.sent_at });
});

// POST /api/shortlists/:id/whatsapp
// Builds a wa.me URL for the salesperson's phone to open (kept for server-side use).
router.post('/:id/whatsapp', requireAuth, async (req, res) => {
  const { id } = req.params;

  const { data: shortlist } = await supabase
    .from('jwl_shortlists')
    .select('id, customer_id, customer_mobile, shop_id')
    .eq('id', id)
    .eq('shop_id', req.store.id)
    .single();

  if (!shortlist) return res.status(404).json({ error: 'Shortlist not found' });

  const { data: customer } = await supabase
    .from('customers').select('name').eq('id', shortlist.customer_id).single();

  const { data: store } = await supabase
    .from('stores').select('store_name').eq('id', req.store.id).single();

  // View pages are served by the Vercel frontend (permanent URL, CDN cached)
  // not the ngrok backend (which blocks external visitors with ERR_NGROK_3004).
  const viewBase = process.env.PUBLIC_VIEW_BASE
    || process.env.PUBLIC_BACKEND_URL
    || `${req.protocol}://${req.get('host')}`;
  const viewUrl = `${viewBase}/view/shortlist/${shortlist.id}`;

  const storeName = store?.store_name || 'our store';
  const customerName = customer?.name || 'you';
  const message = `Hi ${customerName}! Here are your selections from ${storeName}.

View, share with family, and come by when ready:
${viewUrl}

Link valid for 5 days.

Powered by Dikhao ✨`;

  // Strip non-digits; prefix 91 if not already international
  let phone = (shortlist.customer_mobile || '').replace(/\D/g, '');
  if (phone.length === 10) phone = '91' + phone;

  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return res.json({ waUrl, viewUrl, customerMobile: shortlist.customer_mobile });
});

module.exports = router;
