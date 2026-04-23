const axios = require('axios');
const { getAccessToken } = require('./gcpAuth');

const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION   = process.env.GCP_LOCATION || 'asia-southeast1';
const MODEL      = 'virtual-try-on-001';

function endpoint() {
  return `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:predict`;
}

async function runVirtualTryOn(personImageBuffer, garmentImageBuffer) {
  const token = await getAccessToken();

  const requestBody = {
    instances: [{
      personImage:   { image: { bytesBase64Encoded: personImageBuffer.toString('base64') } },
      productImages: [{ image: { bytesBase64Encoded: garmentImageBuffer.toString('base64') } }],
    }],
    parameters: {
      sampleCount:       1,
      addWatermark:      false,
      personGeneration:  'allow_adult',
      safetySetting:     'block_some',
      outputOptions:     { mimeType: 'image/jpeg', compressionQuality: 90 },
    },
  };

  const response = await axios.post(endpoint(), requestBody, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: 60000,
    maxBodyLength: 50 * 1024 * 1024,
  });

  const predictions = response.data.predictions;
  if (!predictions || predictions.length === 0) throw new Error('VERTEX_NO_OUTPUT');

  const base64Image = predictions[0].bytesBase64Encoded;
  if (!base64Image) throw new Error('VERTEX_NO_OUTPUT');
  return Buffer.from(base64Image, 'base64');
}

module.exports = { runVirtualTryOn };
