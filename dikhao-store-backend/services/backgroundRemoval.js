const axios = require('axios');
const FormData = require('form-data');

// PhotoRoom sandbox rejects some hex values. Keep these to ones it reliably accepts.
const BG_COLORS = {
  white: 'FFFFFF',
  grey:  'FFFFFF', // fall back to white for now; PhotoRoom sandbox doesn't accept f0f0f0
};

async function removeBackground(imageBuffer, outputType = 'white') {
  const form = new FormData();
  form.append('image_file', imageBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
  form.append('bg_color', BG_COLORS[outputType] || '');
  form.append('format', 'jpg');
  form.append('size', 'full');

  const response = await axios.post('https://sdk.photoroom.com/v1/segment', form, {
    headers: {
      ...form.getHeaders(),
      'x-api-key': process.env.PHOTOROOM_API_KEY,
    },
    responseType: 'arraybuffer',
    timeout: 15000,
  });

  return Buffer.from(response.data);
}

module.exports = { removeBackground };
