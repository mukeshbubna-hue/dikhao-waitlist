import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

// Direct Supabase client for the PUBLIC view page. No auth — data comes from
// a SECURITY DEFINER RPC so RLS stays on for everything else.
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function Countdown({ expiresAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return <>Link has expired · लिंक expire हो गया</>;
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  return <>Link expires in {d} day{d === 1 ? '' : 's'}, {h}h</>;
}

export default function ShortlistView() {
  const { id } = useParams();
  const [state, setState] = useState({ kind: 'loading' });

  useEffect(() => {
    supabase.rpc('get_shortlist_view', { p_shortlist_id: id })
      .then(({ data, error }) => {
        if (error) return setState({ kind: 'error', error: error.message });
        if (data?.not_found) return setState({ kind: 'not_found' });
        if (data?.expired)   return setState({ kind: 'expired', storeName: data.store_name });
        setState({ kind: 'ok', data });
      })
      .catch(err => setState({ kind: 'error', error: err.message }));
  }, [id]);

  if (state.kind === 'loading') {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <p className="text-plum/60 font-body">Loading…</p>
      </div>
    );
  }

  if (state.kind === 'not_found' || state.kind === 'error') {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center px-6">
        <div className="max-w-[420px] text-center">
          <h1 className="font-display text-plum text-[30px] leading-tight mb-2">
            This link isn't right
          </h1>
          <p className="text-plum/70 text-sm font-body">
            The shortlist link appears invalid. Ask the shop to send a fresh link.
          </p>
        </div>
      </div>
    );
  }

  if (state.kind === 'expired') {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center px-6">
        <div className="max-w-[420px] text-center">
          <h1 className="font-display text-plum text-[30px] leading-tight mb-2">
            This link has expired
          </h1>
          <p className="text-plum/60 text-sm font-body">
            यह link expire हो गया
          </p>
          <p className="text-plum/70 text-sm font-body mt-4 leading-relaxed">
            Shortlists stay live for 5 days, then are removed automatically.<br/>
            5 दिन बाद लिंक हटा दिए जाते हैं।
          </p>
          {state.storeName && (
            <p className="text-plum text-sm font-body mt-6">
              Please visit <b>{state.storeName}</b> to browse again.
            </p>
          )}
        </div>
      </div>
    );
  }

  const { customer_name, store_name, expires_at, items } = state.data;
  const piecesLabel = items.length === 1 ? 'piece' : 'pieces';

  return (
    <div className="min-h-screen bg-ivory">
      <div className="max-w-[720px] mx-auto px-5 sm:px-8 py-10 pb-16">
        <header className="text-center border-b border-plum/10 pb-6 mb-6">
          <p className="text-[10px] uppercase tracking-[0.25em] text-plum/60 font-body">
            {store_name}
          </p>
          <h1 className="font-display text-plum text-[32px] sm:text-[40px] leading-tight mt-1 tracking-tight">
            {customer_name}'s selections
          </h1>
          <p className="text-plum/70 text-sm font-body mt-2">
            {items.length} {piecesLabel} · shortlisted with family in mind
          </p>
        </header>

        {items.length === 0 ? (
          <p className="text-center text-plum/60 font-body">This shortlist is empty.</p>
        ) : (
          <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map(it => (
              <div key={it.id} className="bg-warm-white border border-plum/10 aspect-[3/4] overflow-hidden">
                <img src={it.tryon_image_url} alt="" className="w-full h-full object-cover block" loading="lazy" />
              </div>
            ))}
          </section>
        )}

        <div className="bg-warm-white border border-rose-gold/40 p-3 text-center text-xs text-plum/70 font-body mt-6">
          <Countdown expiresAt={expires_at} />
        </div>

        <p className="text-center text-plum/50 text-xs font-body mt-6 leading-relaxed">
          Prices are shown in-store · दुकान पर पूछें<br/>
          To buy or ask about any piece, return to <b className="text-plum">{store_name}</b>
        </p>

        <p className="text-center text-[10px] uppercase tracking-[0.25em] text-plum/40 mt-10 font-body">
          Made with Dikhao
        </p>
      </div>
    </div>
  );
}
