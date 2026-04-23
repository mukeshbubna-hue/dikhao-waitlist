const axios = require('axios');

async function sendOtp(mobile, otp) {
  const message = `Your Dikhao OTP is ${otp}. Valid for 10 minutes. Do not share this with anyone.`;
  const response = await axios.post(
    'https://api.gupshup.io/sm/api/v1/msg',
    new URLSearchParams({
      channel: 'whatsapp',
      source: process.env.GUPSHUP_SOURCE_NUMBER,
      destination: `91${mobile}`,
      message: JSON.stringify({ type: 'text', text: message }),
      'src.name': 'Dikhao'
    }),
    {
      headers: {
        apikey: process.env.GUPSHUP_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  return response.data;
}

module.exports = { sendOtp };
