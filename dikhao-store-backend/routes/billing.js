const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const router = express.Router();
const supabase = require('../services/supabase');
const requireAuth = require('../middleware/auth');

let _razorpay = null;
function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    const err = new Error('BILLING_NOT_CONFIGURED');
    err.status = 503;
    throw err;
  }
  if (!_razorpay) {
    _razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpay;
}

// POST /api/billing/create-order  { plan }
router.post('/create-order', requireAuth, async (req, res) => {
  const { plan } = req.body;
  const { data: planRow } = await supabase.from('plan_limits').select('*').eq('plan', plan).single();
  if (!planRow || !planRow.price_inr) return res.status(400).json({ error: 'Invalid plan.' });

  try {
    const order = await getRazorpay().orders.create({
      amount: planRow.price_inr * 100,
      currency: 'INR',
      receipt: `dikhao_${req.store.id}_${Date.now()}`,
    });

    await supabase.from('payments').insert({
      store_id: req.store.id,
      razorpay_order_id: order.id,
      plan,
      amount_inr: planRow.price_inr,
      status: 'created',
    });

    res.json({ order, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('create-order:', err.message);
    res.status(500).json({ error: 'Could not create order.' });
  }
});

// POST /api/billing/verify-payment  { orderId, paymentId, signature }
router.post('/verify-payment', requireAuth, async (req, res) => {
  const { orderId, paymentId, signature } = req.body;

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (expected !== signature) {
    await supabase.from('payments').update({ status: 'failed' }).eq('razorpay_order_id', orderId);
    return res.status(400).json({ error: 'Invalid signature.' });
  }

  const { data: payment } = await supabase.from('payments').select('*').eq('razorpay_order_id', orderId).single();
  if (!payment) return res.status(404).json({ error: 'Order not found.' });

  await supabase.from('payments').update({
    razorpay_payment_id: paymentId,
    status: 'paid',
  }).eq('razorpay_order_id', orderId);

  const newEnd = new Date();
  newEnd.setDate(newEnd.getDate() + 30);
  await supabase.from('stores').update({
    plan: payment.plan,
    plan_start_date: new Date().toISOString().slice(0, 10),
    plan_end_date: newEnd.toISOString().slice(0, 10),
    customers_used: 0,
  }).eq('id', req.store.id);

  res.json({ success: true });
});

// POST /api/billing/webhook  — Razorpay server webhook
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.body)
    .digest('hex');
  if (expected !== signature) return res.status(400).send('Invalid signature');
  // TODO: handle event types — payment.captured, payment.failed, etc.
  res.json({ received: true });
});

// GET /api/billing/history
router.get('/history', requireAuth, async (req, res) => {
  const { data } = await supabase
    .from('payments')
    .select('*')
    .eq('store_id', req.store.id)
    .order('created_at', { ascending: false });
  res.json({ payments: data || [] });
});

module.exports = router;
