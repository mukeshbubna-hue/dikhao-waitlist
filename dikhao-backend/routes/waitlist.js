const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const { sendOtp } = require('../services/gupshup');

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/waitlist/send-otp
router.post('/send-otp', async (req, res) => {
  const { store_name, owner_name, mobile, state, city } = req.body;

  if (!store_name || !owner_name || !mobile || !state || !city) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (!/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ error: 'Enter a valid 10-digit mobile number.' });
  }

  const { error: dbError } = await supabase
    .from('waitlist')
    .upsert(
      { store_name, owner_name, mobile, state, city, verified: true },
      { onConflict: 'mobile' }
    );

  if (dbError) {
    console.error('DB error:', dbError);
    return res.status(500).json({ error: 'Database error. Please try again.' });
  }

  return res.json({ success: true });
});

// POST /api/waitlist/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    return res.status(400).json({ error: 'Mobile and OTP are required.' });
  }

  const { data, error } = await supabase
    .from('waitlist')
    .select('otp, otp_expires_at, verified')
    .eq('mobile', mobile)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Mobile number not found. Please restart.' });
  }
  if (data.verified) {
    return res.json({ success: true, message: 'Already verified. You are on the list!' });
  }
  if (new Date() > new Date(data.otp_expires_at)) {
    return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
  }
  if (data.otp !== otp) {
    return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });
  }

  await supabase
    .from('waitlist')
    .update({ verified: true, otp: null })
    .eq('mobile', mobile);

  return res.json({ success: true, message: 'Verified! You are on the waitlist.' });
});

// POST /api/waitlist/resend-otp
router.post('/resend-otp', async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) return res.status(400).json({ error: 'Mobile required.' });

  const otp = generateOtp();
  const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await supabase
    .from('waitlist')
    .update({ otp, otp_expires_at })
    .eq('mobile', mobile);

  try {
    await sendOtp(mobile, otp);
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'Could not resend OTP.' });
  }
});

module.exports = router;
