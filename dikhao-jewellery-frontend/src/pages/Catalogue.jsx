import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { listProducts } from '../api/catalogue';
import { startJewelleryTryOn } from '../api/jewelleryTryon';
import { getCustomer } from '../api/customers';
import { getActiveShortlist, markShortlistSent, buildWhatsAppUrl } from '../api/shortlists';

const CATEGORIES = [
  { id: null,       label: 'All' },
  { id: 'necklace', label: 'Necklace' },
  { id: 'earrings', label: 'Earrings' },
  { id: 'choker',   label: 'Choker' },
  { id: 'pendant',  label: 'Pendant' },
  { id: 'borla',    label: 'Borla' },
  { id: 'nath',     label: 'Nath' },
];

// Customer never sees exact prices or ranges — only occasion labels.
// The salesperson explains the budget bands verbally when asked.
const BANDS = [
  { id: null,        label: 'All',           hi: 'सभी' },
  { id: 'under25k',  label: 'Everyday',      hi: 'रोज़' },
  { id: '25k-75k',   label: 'Festive',       hi: 'उत्सव' },
  { id: '75k-2l',    label: 'Heavy festive', hi: 'भारी' },
  { id: '2l-5l',     label: 'Bridal',        hi: 'दुल्हन' },
  { id: 'over5l',    label: 'Heirloom',      hi: 'पुश्तैनी' },
];

const API_BASE = import.meta.env.VITE_API_URL;

export default function Catalogue() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { store } = useOutletContext();
  const initialCustomer = state?.customer;

  const [customer, setCustomer] = useState(initialCustomer);
  const [category, setCategory] = useState(null);
  const [band, setBand]         = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [startingFor, setStartingFor] = useState(null);

  const [shortlistId, setShortlistId]       = useState(null);
  const [shortlistCount, setShortlistCount] = useState(0);

  const photoReady = !!customer?.photo_clean_url;

  useEffect(() => {
    if (!initialCustomer) navigate('/dashboard/customer/new', { replace: true });
  }, [initialCustomer, navigate]);

  // Refetch customer on mount + poll until cleaned photo exists.
  useEffect(() => {
    if (!customer?.id) return;
    let cancelled = false;

    async function fetchCustomer() {
      try {
        const { data } = await getCustomer(customer.id);
        if (!cancelled && data.customer) setCustomer(data.customer);
      } catch {}
    }

    fetchCustomer();
    if (photoReady) return () => { cancelled = true; };

    const id = setInterval(fetchCustomer, 3000);
    return () => { cancelled = true; clearInterval(id); };
  }, [customer?.id, photoReady]);

  const [shortlistError, setShortlistError] = useState('');

  // Refresh shortlist count
  const refreshShortlist = () => {
    if (!customer?.id) return;
    console.log('[catalogue] refreshShortlist for', customer.id);
    getActiveShortlist(customer.id).then(res => {
      console.log('[catalogue] shortlist response', res.data);
      setShortlistId(res.data.shortlist?.id || null);
      setShortlistCount(res.data.items?.length || 0);
      setShortlistError('');
    }).catch(err => {
      console.error('[catalogue] shortlist fetch failed', err?.response?.status, err?.message);
      setShortlistError(`Fetch failed: ${err?.response?.status || ''} ${err?.message || ''}`);
    });
  };

  useEffect(() => { refreshShortlist(); }, [customer?.id]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    listProducts({
      ...(category ? { category } : {}),
      ...(band ? { priceBand: band } : {}),
    })
      .then(res => { if (!cancelled) setProducts(res.data.products || []); })
      .catch(err => { if (!cancelled) setError(err.response?.data?.error || 'Could not load pieces.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [category, band]);

  const activeBand = useMemo(() => BANDS.find(b => b.id === band), [band]);

  // Build wa.me URL client-side so <a target=_blank> works on iOS (no async popup block).
  const waUrl = useMemo(
    () => buildWhatsAppUrl({ shortlistId, customer, store, apiBase: API_BASE }),
    [shortlistId, customer, store]
  );

  const onTryOn = async (p) => {
    if (startingFor) return;
    if (!photoReady) {
      setError('Photo is still being prepared — try again in a few seconds.');
      return;
    }
    setError('');
    setStartingFor(p.id);
    try {
      const { data } = await startJewelleryTryOn({ customerId: customer.id, productId: p.id });
      window.datafast?.("tryon_started");
      navigate(`/dashboard/jewellery-tryon/${data.sessionId}`, { state: { customer } });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not start try-on.');
      setStartingFor(null);
    }
  };

  const onSendClick = () => {
    if (!shortlistId) return;
    // Fire-and-forget: record that Send was tapped. The <a href> handles navigation.
    markShortlistSent(shortlistId).catch(() => {});
    window.datafast?.("whatsapp_send");
  };

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-ivory pb-24 sm:pb-10">

      <header className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-plum/10 bg-warm-white sticky top-0 z-10">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.25em] text-plum/70 font-body">
            {store?.store_name || 'Jewellers'}
          </p>
          <p className="font-display text-plum text-[20px] leading-tight mt-0.5 truncate">
            {customer.name}
          </p>
        </div>
        {activeBand?.id && (
          <div className="text-right pl-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-rose-gold-dim font-body">
              {activeBand.label}
            </p>
          </div>
        )}
      </header>

      <div className="px-6 sm:px-10 pt-5 space-y-3 bg-ivory">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-6 sm:-mx-10 px-6 sm:px-10">
          {BANDS.map(b => {
            const active = b.id === band;
            return (
              <button key={b.id ?? 'all-bands'} onClick={() => setBand(b.id)}
                className={`flex-shrink-0 px-4 py-2 text-[12px] uppercase tracking-[0.08em] border transition-colors ${
                  active ? 'bg-plum text-ivory border-plum' : 'bg-ivory text-plum border-plum/20 hover:border-plum/50'
                }`}>{b.label}</button>
            );
          })}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-6 sm:-mx-10 px-6 sm:px-10">
          {CATEGORIES.map(c => {
            const active = c.id === category;
            return (
              <button key={c.id ?? 'all-cats'} onClick={() => setCategory(c.id)}
                className={`flex-shrink-0 px-4 py-2 text-[12px] uppercase tracking-[0.08em] border transition-colors ${
                  active ? 'bg-rose-gold text-plum border-rose-gold' : 'bg-ivory text-plum border-plum/20 hover:border-plum/50'
                }`}>{c.label}</button>
            );
          })}
        </div>
      </div>

      {/* Status / Send card — always visible, directly above the grid */}
      <div className="px-6 sm:px-10 pt-3">
        {!photoReady ? (
          <div className="flex items-center gap-3 bg-warm-white border border-plum/10 p-4">
            <div className="w-4 h-4 border-2 border-rose-gold border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <p className="text-plum text-sm font-body">
              Preparing your photo... browse meanwhile
              <span className="block text-plum/60 text-xs">आपकी फ़ोटो तैयार हो रही है</span>
            </p>
          </div>
        ) : shortlistCount > 0 ? (
          <div className="flex items-center justify-between gap-4 bg-plum text-ivory p-4">
            <div className="min-w-0">
              <p className="font-display text-[20px] leading-tight">
                {shortlistCount} {shortlistCount === 1 ? 'piece' : 'pieces'} shortlisted
              </p>
              <p className="text-ivory/70 text-xs font-body">Tap send to share on WhatsApp</p>
            </div>
            {waUrl ? (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onSendClick}
                className="flex-shrink-0 px-5 py-3 bg-ivory text-plum text-[12px] uppercase tracking-[0.15em] hover:bg-pearl transition-colors"
              >
                Send on WhatsApp →
              </a>
            ) : (
              <span className="flex-shrink-0 px-5 py-3 bg-ivory/30 text-ivory/60 text-[12px] uppercase tracking-[0.15em]">
                Preparing link…
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-plum text-sm font-body py-2">
            <span className="text-rose-gold-dim text-lg">✨</span>
            Ready — tap <span className="font-medium">"Try on →"</span> under any piece
          </div>
        )}
      </div>

      <section className="px-6 sm:px-10 py-6">
        {error && <p className="text-red-800 text-sm font-body mb-4">{error}</p>}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-warm-white border border-plum/10 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-6">
            <div className="text-5xl mb-5 opacity-60">💎</div>
            <p className="font-display text-plum text-[28px] leading-tight mb-3">
              No pieces in this combination
            </p>
            <p className="text-plum/60 text-sm font-body mb-6 max-w-[280px]">
              {band || category
                ? 'Try a different category or price band — or clear the filters.'
                : 'This store has not added any pieces yet.'}
            </p>
            {(band || category) && (
              <button
                onClick={() => { setBand(null); setCategory(null); }}
                className="px-6 py-3 bg-plum text-ivory text-[12px] uppercase tracking-[0.15em] hover:bg-plum-dim transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map(p => (
              <div key={p.id} className="bg-warm-white border border-plum/10">
                <div className="relative aspect-square">
                  <img src={p.photo_url} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-contain p-2" />
                </div>
                <button
                  type="button"
                  onClick={() => onTryOn(p)}
                  disabled={startingFor === p.id || (!photoReady && startingFor !== p.id)}
                  className={`block w-full py-2.5 text-[11px] uppercase tracking-[0.15em] transition-colors border-t border-plum/10 ${
                    startingFor === p.id
                      ? 'bg-plum text-ivory cursor-wait'
                      : photoReady
                        ? 'bg-ivory text-plum hover:bg-plum hover:text-ivory'
                        : 'bg-ivory text-plum/40 cursor-not-allowed'
                  }`}
                >
                  {startingFor === p.id ? 'Starting…' : 'Try on →'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
