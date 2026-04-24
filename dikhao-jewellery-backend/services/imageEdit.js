const axios = require('axios');
const { getAccessToken } = require('./gcpAuth');

const PROJECT_ID = process.env.GCP_PROJECT_ID;
// Gemini image-editing models are not yet in asia-southeast1; default to us-central1.
const LOCATION   = process.env.GEMINI_IMAGE_LOCATION || 'us-central1';
const MODEL      = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

function endpoint() {
  return `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;
}

function extractImageBuffer(responseData) {
  const parts = responseData?.candidates?.[0]?.content?.parts || [];
  for (const p of parts) {
    const data = p.inline_data?.data || p.inlineData?.data;
    if (data) return Buffer.from(data, 'base64');
  }
  return null;
}

/**
 * Edit an image with a text prompt (Gemini 2.5 Flash Image aka "Nano Banana").
 * Returns a Buffer of the edited image, or throws.
 */
async function editImage(imageBuffer, prompt, inputMime = 'image/jpeg') {
  const token = await getAccessToken();

  const body = {
    contents: [{
      role: 'user',
      parts: [
        { text: prompt },
        { inline_data: { mime_type: inputMime, data: imageBuffer.toString('base64') } },
      ],
    }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  };

  const response = await axios.post(endpoint(), body, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: 90_000,
    maxBodyLength: 50 * 1024 * 1024,
  });

  const out = extractImageBuffer(response.data);
  if (!out) {
    const reason = response.data?.promptFeedback?.blockReason
      || response.data?.candidates?.[0]?.finishReason
      || 'no image in response';
    const parts = response.data?.candidates?.[0]?.content?.parts || [];
    const textParts = parts.filter(p => p.text).map(p => p.text.slice(0, 200)).join(' | ');
    const partKinds = parts.map(p => Object.keys(p)).flat();
    throw new Error(`GEMINI_IMAGE_EMPTY: ${reason} [parts=${JSON.stringify(partKinds)}] [text=${textParts}]`);
  }
  return out;
}

const KURTA_PROMPT =
  'Edit this bust photograph. Dress the person in a LAYERED outfit with TWO distinct garments that must both be clearly visible:\n' +
  '1. INNER LAYER: a plain white full-sleeve kurta with a simple round neckline. Visible at the centre of the chest and at the collar/neckline.\n' +
  '2. OUTER LAYER: a cream / off-white long jacket, waistcoat, or shrug worn OPEN at the front — covering the shoulders, upper arms, and sides of the body. The jacket must be a clearly different lighter cream tone than the pure white kurta so the two layers are distinguishable.\n' +
  'Both layers MUST show: the white kurta visible in the centre v-shape where the jacket opens, the cream jacket visible on the outside.\n' +
  'Background: a clean warm-cream studio backdrop.\n' +
  'STRICTLY preserve face, eyes, hair, ears, skin tone, and overall identity. Do not alter facial features in any way. Keep bust-shot framing — face, neck, and shoulders clearly visible.\n' +
  'Remove any existing jewellery on the neck, ears, forehead, or nose. No other changes.';

async function dressInKurta(imageBuffer, inputMime = 'image/jpeg') {
  return editImage(imageBuffer, KURTA_PROMPT, inputMime);
}

// Category-specific placement prompts for accessory try-on.
// Used when Vertex VTON (clothing-trained) can't place small accessories correctly.
const ACCESSORY_PROMPTS = {
  necklace:
    'The first image is a woman\'s bust photograph. The second image is a necklace — a chain-based piece worn around the neck, typically draping to the collarbone or upper chest. ' +
    'Place the necklace around her neck so it drapes naturally in a U-shape at the collarbone area, on top of her kurta/jacket clothing. ' +
    'Match the chain length, thickness and centrepiece proportions shown in the product photo. Longer chains hang lower; shorter chains sit higher. ' +
    'Do not alter her face, eyes, hair, skin tone, clothing, or background in any way. ' +
    'Output only the edited photograph.',
  choker:
    'The first image is a woman\'s bust photograph. The second image is a choker — a short, close-fitting necklace worn high on the neck. ' +
    'Place the choker snugly at the BASE OF HER NECK, sitting high — it must NOT drape down like a long necklace. ' +
    'Match the diameter and thickness shown in the product photo. ' +
    'Do not alter her face, eyes, hair, skin tone, clothing, or background in any way. ' +
    'Output only the edited photograph.',
  pendant:
    'The first image is a woman\'s bust photograph. The second image is a pendant (a small ornament on a chain, or meant to hang from a chain). ' +
    'Place a thin chain around her neck and have the pendant hang naturally at the centre of her chest, on top of her kurta/jacket clothing. ' +
    'Use the chain length and pendant size shown in the product photo — do not enlarge the pendant. ' +
    'Do not alter her face, eyes, hair, skin tone, clothing, or background in any way. ' +
    'Output only the edited photograph.',
  earrings:
    'The first image is a woman\'s bust photograph. The second image is a pair of earrings. ' +
    'Place one earring on each of her visible earlobes, naturally sized. Both ears should show an earring. ' +
    'Do not alter her face, eyes, hair, skin tone, clothing, or background in any way. ' +
    'Output only the edited photograph.',
  borla:
    'The first image is a woman\'s bust photograph. The second image is a borla/maang-tikka head ornament. ' +
    'Place the ornament on her forehead at the hair parting, with the chain or hook running up into the parting line. ' +
    'Do not alter her face, eyes, hair, skin tone, clothing, or background in any way. ' +
    'Output only the edited photograph.',
  nath:
    'The first image is a woman\'s bust photograph. The second image is a nath (nose ring). ' +
    'Place the nose ring on her left nostril naturally. If the nath has a side chain, route it toward her left ear. ' +
    'Match the diameter shown in the product photo — do not enlarge. ' +
    'Do not alter her face, eyes, hair, skin tone, clothing, or background in any way. ' +
    'Output only the edited photograph.',
};

function accessorySupported(category) {
  return !!ACCESSORY_PROMPTS[category];
}

async function tryOnAccessory(personBuffer, productBuffer, category, personMime = 'image/png', productMime = 'image/jpeg') {
  const prompt = ACCESSORY_PROMPTS[category];
  if (!prompt) throw new Error(`GEMINI_UNSUPPORTED_CATEGORY: ${category}`);

  const token = await getAccessToken();
  const body = {
    contents: [{
      role: 'user',
      parts: [
        { text: prompt },
        { inline_data: { mime_type: personMime, data: personBuffer.toString('base64') } },
        { inline_data: { mime_type: productMime, data: productBuffer.toString('base64') } },
      ],
    }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
  };

  const response = await axios.post(endpoint(), body, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    // 28s per attempt × 2 attempts = 56s max — fits inside the pipeline's
    // 60s deadline with 4s headroom for image fetch + upload + DB writes.
    timeout: 28_000,
    maxBodyLength: 50 * 1024 * 1024,
  });

  const out = extractImageBuffer(response.data);
  if (!out) {
    const reason = response.data?.promptFeedback?.blockReason
      || response.data?.candidates?.[0]?.finishReason
      || 'no image in response';
    throw new Error(`GEMINI_TRYON_EMPTY: ${reason}`);
  }
  return out;
}

// Internal retry wrapper — Gemini occasionally times out or returns empty.
// We retry Gemini (NOT a different model) because only Gemini handles jewellery correctly.
async function tryOnAccessoryWithRetry(personBuffer, productBuffer, category, personMime, productMime, maxAttempts = 2) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await tryOnAccessory(personBuffer, productBuffer, category, personMime, productMime);
    } catch (err) {
      lastErr = err;
      console.error(`[gemini ${category}] attempt ${attempt}/${maxAttempts} failed: ${err.message}`);
      if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw lastErr;
}

module.exports = { editImage, dressInKurta, tryOnAccessory, tryOnAccessoryWithRetry, accessorySupported };
