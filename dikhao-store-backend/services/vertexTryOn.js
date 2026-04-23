const axios = require('axios');
const { getAccessToken } = require('./gcpAuth');
const { uploadToGCS, deleteFromGCS } = require('./gcpStorage');

const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION   = process.env.GCP_LOCATION || 'asia-south1';
const MODEL      = 'virtual-try-on-001';

function endpoint() {
  return `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:predict`;
}

async function runVirtualTryOn(personImageBuffer, garmentImageBuffer) {
  const [personGcsUri, garmentGcsUri] = await Promise.all([
    uploadToGCS(personImageBuffer),
    uploadToGCS(garmentImageBuffer),
  ]);

  const token = await getAccessToken();

  const requestBody = {
    instances: [{
      personImage:   { image: { gcsUri: personGcsUri } },
      productImages: [{ image: { gcsUri: garmentGcsUri } }],
    }],
    parameters: {
      sampleCount:       1,
      addWatermark:      false,
      personGeneration:  'dont_allow',
      safetySetting:     'block_some',
      outputOptions:     { mimeType: 'image/jpeg', compressionQuality: 90 },
    },
  };

  let response;
  try {
    response = await axios.post(endpoint(), requestBody, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });
  } finally {
    await Promise.all([
      deleteFromGCS(personGcsUri),
      deleteFromGCS(garmentGcsUri),
    ]);
  }

  const predictions = response.data.predictions;
  if (!predictions || predictions.length === 0) throw new Error('VERTEX_NO_OUTPUT');

  const base64Image = predictions[0].bytesBase64Encoded;
  return Buffer.from(base64Image, 'base64');
}

module.exports = { runVirtualTryOn };
