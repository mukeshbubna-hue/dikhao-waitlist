const supabase = require('./supabase');
const { runVirtualTryOn } = require('./vertexTryOn');
const { fetchImage, uploadToResults } = require('./supabaseStorage');

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
  await supabase.from('tryon_sessions').update(patch).eq('id', sessionId);
}

function describeAxiosError(prefix, err) {
  const status = err.response?.status;
  const statusText = err.response?.statusText;
  let bodyText = '';
  const d = err.response?.data;
  if (d) {
    if (Buffer.isBuffer(d))      bodyText = d.toString('utf8').slice(0, 500);
    else if (typeof d === 'string') bodyText = d.slice(0, 500);
    else                         bodyText = JSON.stringify(d).slice(0, 500);
  }
  return `${prefix}: HTTP ${status} ${statusText || ''} — ${bodyText || err.message}`;
}

function tagError(tag, err) {
  const wrapped = new Error(describeAxiosError(tag, err));
  wrapped.tag = tag;
  wrapped.status = err.response?.status;
  wrapped.detail = wrapped.message;
  return wrapped;
}

async function processTryOn(sessionId) {
  const startedAt = Date.now();
  console.log(`[tryon ${sessionId}] start`);

  const { data: session, error } = await supabase
    .from('tryon_sessions')
    .select('*, customers(photo_url)')
    .eq('id', sessionId)
    .single();

  if (error || !session) throw new Error('SESSION_NOT_FOUND');

  await updateSession(sessionId, { status: 'processing' });

  try {
    const t1 = Date.now();
    const personImageBuffer  = await fetchImage(session.customers.photo_url);
    const shirtImageBuffer   = session.shirt_url   ? await fetchImage(session.shirt_url)   : null;
    const trouserImageBuffer = session.trouser_url ? await fetchImage(session.trouser_url) : null;
    console.log(`[tryon ${sessionId}] fetched images in ${Date.now() - t1}ms`);

    // Vertex VTON handles background/segmentation natively — no PhotoRoom preprocessing.
    // Preprocessing was degrading colors and sometimes reshaping garments.
    let currentPerson = personImageBuffer;

    if (shirtImageBuffer) {
      const t = Date.now();
      try {
        currentPerson = await withRetry(() => runVirtualTryOn(currentPerson, shirtImageBuffer));
      } catch (err) {
        throw tagError('VERTEX_SHIRT', err);
      }
      console.log(`[tryon ${sessionId}] vertex shirt in ${Date.now() - t}ms`);
    }

    if (trouserImageBuffer) {
      const t = Date.now();
      try {
        currentPerson = await withRetry(() => runVirtualTryOn(currentPerson, trouserImageBuffer));
      } catch (err) {
        throw tagError('VERTEX_TROUSER', err);
      }
      console.log(`[tryon ${sessionId}] vertex trouser in ${Date.now() - t}ms`);
    }

    const t5 = Date.now();
    const resultUrl = await uploadToResults(currentPerson, sessionId);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    console.log(`[tryon ${sessionId}] result upload in ${Date.now() - t5}ms`);
    console.log(`[tryon ${sessionId}] done in ${Date.now() - startedAt}ms`);

    await updateSession(sessionId, {
      result_url: resultUrl,
      status: 'done',
      expires_at: expiresAt,
    });

  } catch (err) {
    const tag = err.tag || 'UNKNOWN';
    const detail = err.detail || err.message;
    console.error(`[tryon ${sessionId}] FAILED (${tag}): ${detail}`);

    const isPhotoError =
      detail.includes('VERTEX_NO_OUTPUT') ||
      detail.includes('INVALID_IMAGE') ||
      detail.includes('INVALID_ARGUMENT') ||
      detail.includes('blocked because');

    await updateSession(sessionId, {
      status: isPhotoError ? 'photo_error' : 'failed',
    });
    throw err;
  }
}

module.exports = { processTryOn };
