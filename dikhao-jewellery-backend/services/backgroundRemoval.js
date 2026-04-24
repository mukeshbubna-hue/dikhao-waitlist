const axios = require('axios');
const FormData = require('form-data');

const REMBG_URL = process.env.REMBG_URL || 'http://localhost:7001';

// Calls the local self-hosted rembg HTTP server.
// Returns a PNG buffer with transparent background.
async function removeBackground(imageBuffer) {
  const form = new FormData();
  form.append('file', imageBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' });

  const response = await axios.post(`${REMBG_URL}/api/remove`, form, {
    headers: form.getHeaders(),
    responseType: 'arraybuffer',
    timeout: 90_000,
  });

  return Buffer.from(response.data);
}

module.exports = { removeBackground };
