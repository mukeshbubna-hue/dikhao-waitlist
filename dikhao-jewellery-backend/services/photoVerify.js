const axios = require('axios');
const { getAccessToken } = require('./gcpAuth');

const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION   = process.env.GEMINI_IMAGE_LOCATION || 'us-central1';
// Text-output Gemini (cheaper than the image-editing variant)
const MODEL      = process.env.GEMINI_VERIFY_MODEL || 'gemini-2.5-flash';

function endpoint() {
  return `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;
}

const PROMPT = `Classify this image. Output JSON only.

Schema: {"is_human": boolean, "reason": "ten words or fewer"}

is_human=true ONLY if ALL true:
- a real human person is the main subject
- a face is visible
- includes face, neck and shoulders (bust-shot)

is_human=false for: objects, animals, cartoons, landscapes, product-only
photos, or shots that crop out the face/shoulders.

Reason must be under ten words.`;

async function verifyIsPerson(imageBuffer, mime = 'image/jpeg') {
  const token = await getAccessToken();
  const body = {
    contents: [{
      role: 'user',
      parts: [
        { text: PROMPT },
        { inline_data: { mime_type: mime, data: imageBuffer.toString('base64') } },
      ],
    }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          is_human: { type: 'boolean' },
          reason:   { type: 'string' },
        },
        required: ['is_human', 'reason'],
      },
      temperature: 0.1,
      maxOutputTokens: 256,
    },
  };

  const response = await axios.post(endpoint(), body, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    timeout: 30_000,
  });

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Primary parse. Gemini usually returns clean JSON when responseSchema is set.
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Fallback: extract the first {...} block (if the model wrapped it in prose).
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`GEMINI_NO_JSON: ${text.slice(0, 100)}`);
    parsed = JSON.parse(match[0]);
  }
  return {
    isHuman: !!parsed.is_human,
    reason:  String(parsed.reason || '').slice(0, 200),
  };
}

module.exports = { verifyIsPerson };
