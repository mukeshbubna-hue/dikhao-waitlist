const supabase = require('./supabase');
const { runVirtualTryOn } = require('./vertexTryOn');
const { fetchImage, uploadToResults } = require('./supabaseStorage');
const { removeBackground } = require('./backgroundRemoval');
const { tryOnAccessoryWithRetry, accessorySupported } = require('./imageEdit');
const { addBrand } = require('./imageBrand');

const EXPIRY_DAYS = 5;
// Hard ceiling on total try-on duration. If we can't finish in 60s, fail
// explicitly rather than keep the user staring at a spinner for minutes.
const PIPELINE_DEADLINE_MS = Number(process.env.TRYON_DEADLINE_MS || 60_000);

async function withRetry(fn, maxAttempts = 3, delayMs = 2000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const retryable = err.response?.status === 429
        || err.response?.status === 503
        || err.code === 'ECONNRESET';
      if (!retryable || attempt === maxAttempts) throw err;
      await new Promise(r => setTimeout(r, delayMs * attempt));
    }
  }
}

async function updateSession(sessionId, patch) {
  await supabase
    .from('jwl_tryon_sessions')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', sessionId);
}

function describeAxiosError(prefix, err) {
  const status = err.response?.status;
  const statusText = err.response?.statusText;
  let bodyText = '';
  const d = err.response?.data;
  if (d) {
    if (Buffer.isBuffer(d))          bodyText = d.toString('utf8').slice(0, 500);
    else if (typeof d === 'string')  bodyText = d.slice(0, 500);
    else                             bodyText = JSON.stringify(d).slice(0, 500);
  }
  return `${prefix}: HTTP ${status} ${statusText || ''} — ${bodyText || err.message}`;
}

async function processJewelleryTryOn(sessionId) {
  const tag = `[jwl-tryon ${sessionId}]`;
  const t0 = Date.now();
  const deadline = t0 + PIPELINE_DEADLINE_MS;
  const step = (label) => console.log(`${tag} ${label.padEnd(28)} +${Date.now() - t0}ms`);
  const checkDeadline = (where) => {
    if (Date.now() > deadline) {
      const over = Date.now() - deadline;
      throw new Error(`PIPELINE_DEADLINE_EXCEEDED at ${where} (+${over}ms over ${PIPELINE_DEADLINE_MS}ms)`);
    }
  };

  step('start');

  const { data: session, error } = await supabase
    .from('jwl_tryon_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error || !session) throw new Error('SESSION_NOT_FOUND');
  step('session fetched');

  const [customerRes, productRes] = await Promise.all([
    supabase.from('customers').select('photo_url, photo_clean_url').eq('id', session.customer_id).single(),
    supabase.from('jwl_products').select('photo_url, category').eq('id', session.product_id).single(),
  ]);

  // Prefer the pre-cleaned photo cached at registration time.
  const personUrl = customerRes.data?.photo_clean_url || customerRes.data?.photo_url;
  const productUrl = productRes.data?.photo_url;
  const category   = productRes.data?.category;
  const personPreCleaned = !!customerRes.data?.photo_clean_url;

  if (!personUrl)  throw new Error('CUSTOMER_PHOTO_MISSING');
  if (!productUrl) throw new Error('PRODUCT_PHOTO_MISSING');
  step(`related fetched (person pre-cleaned: ${personPreCleaned}, category: ${category})`);
  console.log(`${tag}   person:  ${personUrl}`);
  console.log(`${tag}   product: ${productUrl}`);

  await updateSession(sessionId, { status: 'processing' });
  step('status=processing');

  try {
    checkDeadline('before image fetch');
    const [personImageRaw, productImageBuffer] = await Promise.all([
      fetchImage(personUrl),
      fetchImage(productUrl),
    ]);
    step(`images fetched (person=${personImageRaw.length}B, product=${productImageBuffer.length}B)`);
    checkDeadline('after image fetch');

    // Clean customer background only if not pre-cleaned at registration.
    let personImageBuffer = personImageRaw;
    if (!personPreCleaned) {
      try {
        const cleanStart = Date.now();
        personImageBuffer = await removeBackground(personImageRaw);
        console.log(`${tag} rembg (fallback) ran in ${Date.now() - cleanStart}ms (${personImageBuffer.length}B)`);
        step('person bg cleaned (fallback)');
      } catch (rembgErr) {
        console.error(`${tag} rembg fallback failed:`, rembgErr.message);
      }
    } else {
      step('person already pre-cleaned — skipping rembg');
    }

    checkDeadline('before model call');
    // All jewellery categories use Gemini with category-specific prompts.
    // Retries are capped so overall pipeline stays under the 60s deadline.
    let resultBuffer;
    if (accessorySupported(category)) {
      const gStart = Date.now();
      resultBuffer = await tryOnAccessoryWithRetry(
        personImageBuffer, productImageBuffer, category, 'image/png', 'image/jpeg'
      );
      console.log(`${tag} gemini (${category}) completed in ${Date.now() - gStart}ms (result ${resultBuffer.length}B)`);
      step(`gemini ${category} done`);
      checkDeadline('after model call');
    } else {
      // Unknown category (should never happen — all 6 categories are in ACCESSORY_PROMPTS).
      console.warn(`${tag} unknown category "${category}" — falling through to vertex`);
      const vStart = Date.now();
      resultBuffer = await withRetry(() => runVirtualTryOn(personImageBuffer, productImageBuffer));
      console.log(`${tag} vertex (unknown ${category}) took ${Date.now() - vStart}ms (result ${resultBuffer.length}B)`);
      step('vertex default done');
    }

    // Composite Dikhao brand mark in the top-right corner
    const brandStart = Date.now();
    const brandedBuffer = await addBrand(resultBuffer);
    console.log(`${tag} brand composite took ${Date.now() - brandStart}ms`);

    const resultUrl = await uploadToResults(brandedBuffer, sessionId);
    step('result uploaded');

    const expiresAt = new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await updateSession(sessionId, {
      result_url: resultUrl,
      status: 'done',
      expires_at: expiresAt,
    });
    step('DONE');
  } catch (err) {
    const detail = describeAxiosError('VERTEX_JEWELLERY', err);
    console.error(`${tag} FAILED after ${Date.now() - t0}ms: ${detail}`);

    const isPhotoError =
      detail.includes('VERTEX_NO_OUTPUT') ||
      detail.includes('INVALID_IMAGE') ||
      detail.includes('INVALID_ARGUMENT') ||
      detail.includes('blocked because');

    await updateSession(sessionId, { status: isPhotoError ? 'photo_error' : 'failed' });
    throw err;
  }
}

module.exports = { processJewelleryTryOn };
