const axios = require('axios');
const { getAccessToken } = require('./gcpAuth');

const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION   = process.env.GCP_LOCATION || 'asia-southeast1';
const MODEL      = 'virtual-try-on-001';

// Lower baseSteps = faster generation, small quality trade-off.
// 32 = reference default (slow). 20 = good balance for jewellery. 16 = fast.
// Override via env if the demo needs a different point on the quality curve.
const BASE_STEPS = Number(process.env.VERTEX_BASE_STEPS || 20);

// JPEG output is 5–10× smaller than PNG and uploads back to Supabase much faster.
// PNG preserves lossless colors but costs a lot of wire time for jewellery renders.
const OUTPUT_MIME = process.env.VERTEX_OUTPUT_MIME || 'image/jpeg';

function endpoint() {
  return `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:predict`;
}

async function runVirtualTryOn(personImageBuffer, productImageBuffer) {
  const token = await getAccessToken();

  const requestBody = {
    instances: [{
      personImage:   { image: { bytesBase64Encoded: personImageBuffer.toString('base64') } },
      productImages: [{ image: { bytesBase64Encoded: productImageBuffer.toString('base64') } }],
    }],
    parameters: {
      sampleCount:       1,
      baseSteps:         BASE_STEPS,
      addWatermark:      false,
      personGeneration:  'allow_adult',
      safetySetting:     'block_some',
      outputOptions:     { mimeType: OUTPUT_MIME, compressionQuality: 85 },
    },
  };

  const response = await axios.post(endpoint(), requestBody, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: 120000,
    maxBodyLength: 50 * 1024 * 1024,
  });

  const predictions = response.data.predictions;
  if (!predictions || predictions.length === 0) throw new Error('VERTEX_NO_OUTPUT');

  const base64Image = predictions[0].bytesBase64Encoded;
  if (!base64Image) throw new Error('VERTEX_NO_OUTPUT');
  return Buffer.from(base64Image, 'base64');
}

module.exports = { runVirtualTryOn };
