import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { getJewelleryTryOn } from '../api/jewelleryTryon';
import { addToShortlist, getActiveShortlist, markShortlistSent, buildWhatsAppUrl } from '../api/shortlists';

const API_BASE = import.meta.env.VITE_API_URL;

const POLL_MS = 2500;
const EXPECTED_SEC = 30;

function mmss(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function JewelleryTryOn() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { store } = useOutletContext();
  const customer = state?.customer;

  const [status, setStatus]     = useState('queued');
  const [resultUrl, setResult]  = useState(null);
  const [productId, setProductId] = useState(null);
  const [startedAt, setStarted] = useState(Date.now());
  const [now, setNow]           = useState(Date.now());
  const [error, setError]       = useState('');

  const [hearted, setHearted]   = useState(false);
  const [heartError, setHeartError] = useState('');
  const [heartSaving, setHeartSaving] = useState(false);

  const [shortlistId, setShortlistId]       = useState(null);
  const [shortlistCount, setShortlistCount] = useState(0);

  // Load current shortlist state so the Send button shows if she has previous hearts
  useEffect(() => {
    if (!customer?.id) return;
    getActiveShortlist(customer.id).then(res => {
      setShortlistId(res.data.shortlist?.id || null);
      setShortlistCount(res.data.items?.length || 0);
    }).catch(() => {});
  }, [customer?.id]);

  const waUrl = useMemo(
    () => buildWhatsAppUrl({ shortlistId, customer, store, apiBase: API_BASE }),
    [shortlistId, customer, store]
  );

  const onSendClick = () => {
    if (shortlistId) {
      markShortlistSent(shortlistId).catch(() => {});
      window.datafast?.("whatsapp_send");
    }
  };

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let stopped = false;
    let timer;

    async function tick() {
      if (stopped) return;
      try {
        const { data } = await getJewelleryTryOn(sessionId);
        if (data.createdAt) setStarted(new Date(data.createdAt).getTime());
        setStatus(data.status);
        if (data.productId) setProductId(data.productId);
        if (data.status === 'done' && data.resultUrl) {
          setResult(data.resultUrl);
          setProductId(data.productId || null);
          window.datafast?.("tryon_completed");
          return;
        }
        if (data.status === 'failed' || data.status === 'photo_error') {
          setError(data.status === 'photo_error'
            ? 'Could not read the customer photo clearly. Take a fresh bust shot and try again.'
            : 'Something went wrong with the try-on. Please try another piece.');
          window.datafast?.(data.status === 'photo_error' ? "tryon_photo_error" : "tryon_failed");
          return;
        }
      } catch {
        // Keep polling through transient errors
      }
      timer = setTimeout(tick, POLL_MS);
    }
    tick();
    return () => { stopped = true; if (timer) clearTimeout(timer); };
  }, [sessionId]);

  const elapsed = Math.floor((now - startedAt) / 1000);
  const pct = Math.min(95, Math.round((elapsed / EXPECTED_SEC) * 100));
  const takingLonger = elapsed > 90 && status !== 'done';

  const backToCatalogue = () => {
    if (!customer) return navigate('/dashboard');
    navigate('/dashboard/customer/new/catalogue', { state: { customer } });
  };

  const onHeart = async () => {
    console.log('[heart] tap', { hearted, heartSaving, productId, resultUrl, customerId: customer?.id });
    if (hearted || heartSaving) return;
    if (!customer?.id) { setHeartError('Missing customer context — go back and reopen.'); return; }
    if (!productId)   { setHeartError('Missing product reference — try reloading the try-on.'); return; }
    if (!resultUrl)   { setHeartError('Result image not ready yet — wait for render.'); return; }
    setHeartSaving(true);
    setHeartError('');
    try {
      const { data } = await addToShortlist({
        customerId: customer.id,
        productId,
        tryOnImageUrl: resultUrl,
      });
      console.log('[heart] ok', data);
      if (data.maxed) {
        setHeartError('Shortlist is full (max 7). Remove one before adding.');
      } else {
        setHearted(true);
        if (data.shortlistId) setShortlistId(data.shortlistId);
        if (data.itemsCount != null) setShortlistCount(data.itemsCount);
        window.datafast?.("shortlist_add");
      }
    } catch (err) {
      console.error('[heart] failed', err?.response?.status, err?.response?.data, err?.message);
      if (err.response?.data?.maxed) {
        setHeartError('Shortlist is full (max 7). Remove one before adding.');
      } else {
        setHeartError(err.response?.data?.error || err.message || 'Could not save.');
      }
    } finally {
      setHeartSaving(false);
    }
  };

  // === Done state ===
  if (resultUrl) {
    return (
      <div className="min-h-screen bg-ivory">
        <header className="px-6 sm:px-10 py-5 border-b border-plum/10 bg-warm-white">
          <p className="text-[10px] uppercase tracking-[0.25em] text-plum/70 font-body">Try-on ready</p>
          <p className="font-display text-plum text-[20px] mt-0.5">{customer?.name}</p>
        </header>

        <div className="max-w-[720px] mx-auto px-6 sm:px-10 py-8">
          <div className="bg-warm-white border border-plum/10 p-3 mb-6">
            <img src={resultUrl} alt="try-on" className="w-full h-auto object-contain" />
          </div>

          {/* Heart + actions */}
          <div className="space-y-3 mb-6">
            <button
              onClick={onHeart}
              disabled={hearted || heartSaving}
              className={`w-full py-4 text-[13px] uppercase tracking-[0.15em] transition-colors border ${
                hearted
                  ? 'bg-rose-gold/20 text-plum border-rose-gold cursor-default'
                  : heartSaving
                    ? 'bg-plum/5 text-plum/50 border-plum/20 cursor-wait'
                    : 'bg-ivory text-plum border-plum hover:bg-plum hover:text-ivory'
              }`}
            >
              {hearted ? '✓ Added to your list · शॉर्टलिस्ट में है' :
               heartSaving ? 'Saving…' :
               '♡ Add to your list · शॉर्टलिस्ट करें'}
            </button>

            {heartError && <p className="text-red-800 text-[13px] font-body">{heartError}</p>}

            {hearted && waUrl ? (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onSendClick}
                className="block w-full py-3.5 bg-status-green text-white text-[12px] uppercase tracking-[0.15em] hover:opacity-90 transition-opacity text-center"
              >
                📲 Send {shortlistCount} {shortlistCount === 1 ? 'piece' : 'pieces'} on WhatsApp →
              </a>
            ) : (
              <p className="text-plum/50 text-[12px] text-center font-body py-2">
                Tap <span className="text-plum font-medium">"Add to your list"</span> above before sending
              </p>
            )}

            <button
              onClick={backToCatalogue}
              className="w-full py-3.5 bg-plum text-ivory text-[12px] uppercase tracking-[0.15em] hover:bg-plum-dim transition-colors"
            >
              ← Try another piece · दूसरा देखें
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === Error state ===
  if (error) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="text-4xl mb-4">⚠</div>
          <h1 className="font-display text-plum text-[26px] mb-3">Couldn't finish</h1>
          <p className="text-plum/70 text-sm mb-6 font-body">{error}</p>
          <button
            onClick={backToCatalogue}
            className="px-8 py-3 bg-plum text-ivory text-[12px] uppercase tracking-[0.15em] hover:bg-plum-dim transition-colors"
          >
            Back to catalogue
          </button>
        </div>
      </div>
    );
  }

  // === Processing state ===
  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <div className="font-display text-plum text-[56px] tabular-nums tracking-tight leading-none">
            {mmss(elapsed)}
          </div>
          <p className="text-plum/50 text-[10px] uppercase tracking-[0.25em] mt-2 font-body">
            Creating her look · तस्वीर बन रही है
          </p>
        </div>

        <div className="h-1.5 bg-plum/10 overflow-hidden mb-3">
          <div
            className="h-full bg-rose-gold transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-plum/50 text-xs mb-8 font-body">
          Usually done in about {EXPECTED_SEC} seconds · लगभग {EXPECTED_SEC} सेकंड
        </p>

        {takingLonger && (
          <div className="mt-6 bg-warm-white border border-plum/10 p-4 text-xs text-plum/70 font-body">
            Taking a bit longer than usual — hang on.
            <div className="text-plum/50 mt-0.5">थोड़ा वक्त लग रहा है। रुकें।</div>
          </div>
        )}
      </div>
    </div>
  );
}
