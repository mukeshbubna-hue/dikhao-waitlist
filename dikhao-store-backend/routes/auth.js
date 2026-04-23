const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const { sendOtp, verifyOtp } = require('../services/otp');
const { sign } = require('../services/jwt');
const requireAuth = require('../middleware/auth');

// POST /api/auth/send-otp  { mobile, store_name?, owner_name? }
router.post('/send-otp', async (req, res) => {
  const { mobile } = req.body;
  if (!mobile || !/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ error: 'Enter a valid 10-digit mobile number.' });
  }
  try {
    const result = await sendOtp(mobile);
    return res.json(result);
  } catch (err) {
    console.error('send-otp:', err.message);
    return res.status(500).json({ error: 'Could not send OTP. Please try again.' });
  }
});

// POST /api/auth/verify-otp  { mobile, otp, store_name?, owner_name? }
router.post('/verify-otp', async (req, res) => {
  const { mobile, otp, store_name, owner_name } = req.body;
  if (!mobile || !otp) return res.status(400).json({ error: 'Mobile and OTP required.' });

  const check = await verifyOtp(mobile, otp);
  if (!check.ok) {
    const msg = check.reason === 'expired' ? 'OTP has expired.'
              : check.reason === 'wrong'   ? 'Incorrect OTP.'
              : 'OTP not found. Please request a new one.';
    return res.status(400).json({ error: msg });
  }

  // Find or create store
  let { data: store } = await supabase.from('stores').select('*').eq('mobile', mobile).single();

  if (!store) {
    if (!store_name || !owner_name) {
      return res.status(400).json({ error: 'New account — store_name and owner_name are required.' });
    }
    const insert = await supabase.from('stores').insert({
      mobile, store_name, owner_name,
    }).select('*').single();
    if (insert.error) return res.status(500).json({ error: 'Could not create account.' });
    store = insert.data;
  }

  const token = sign({ id: store.id, mobile: store.mobile });
  return res.json({ token, store });
});

// GET /api/auth/me  — returns current store (requires JWT)
router.get('/me', requireAuth, async (req, res) => {
  const { data: store } = await supabase.from('stores').select('*').eq('id', req.store.id).single();
  if (!store) return res.status(404).json({ error: 'Store not found.' });
  res.json({ store });
});

// POST /api/auth/logout  — client just clears JWT; stub kept for symmetry
router.post('/logout', (_, res) => res.json({ success: true }));

module.exports = router;
