const supabase = require('./supabase');
const axios = require('axios');

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOtp(mobile) {
  const otp = generateOtp();
  const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await supabase.from('store_otps').upsert({ mobile, otp, otp_expires_at });

  if (process.env.MOCK_OTP === 'false') {
    await sendViaGupshup(mobile, otp);
    return { sent: true };
  }
  return { sent: true, dev_otp: otp };
}

async function verifyOtp(mobile, otp) {
  const { data } = await supabase
    .from('store_otps')
    .select('otp, otp_expires_at')
    .eq('mobile', mobile)
    .single();

  if (!data) return { ok: false, reason: 'not_found' };
  if (new Date() > new Date(data.otp_expires_at)) return { ok: false, reason: 'expired' };
  if (data.otp !== otp) return { ok: false, reason: 'wrong' };

  await supabase.from('store_otps').delete().eq('mobile', mobile);
  return { ok: true };
}

async function sendViaGupshup(mobile, otp) {
  await axios.post('https://api.gupshup.io/sm/api/v1/msg',
    new URLSearchParams({
      channel: 'whatsapp',
      source: process.env.GUPSHUP_SOURCE_NUMBER,
      destination: `91${mobile}`,
      message: JSON.stringify({ type: 'text', text: `Your Dikhao OTP is ${otp}. Valid for 10 minutes.` }),
      'src.name': 'Dikhao'
    }),
    { headers: { apikey: process.env.GUPSHUP_API_KEY } }
  );
}

module.exports = { sendOtp, verifyOtp };
