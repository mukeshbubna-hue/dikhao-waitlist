import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listCustomers } from '../api/customers';

function daysAgo(ts) {
  const days = Math.floor((Date.now() - new Date(ts).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [filter, setFilter]       = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    listCustomers()
      .then(r => setCustomers(r.data.customers || []))
      .catch(err => setError(err.response?.data?.error || 'Could not load customers.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(c => {
    if (!filter) return true;
    const q = filter.toLowerCase().trim();
    return (c.name?.toLowerCase().includes(q)) || (c.mobile || '').includes(q);
  });

  const startForCustomer = (c) => {
    // Send the store keeper back through the onboarding flow with this mobile prefilled.
    navigate('/dashboard/customer/new', { state: { prefillMobile: c.mobile } });
  };

  return (
    <div className="p-6 sm:p-10 max-w-[1000px] mx-auto">
      <header className="mb-6">
        <p className="text-plum/60 text-xs uppercase tracking-[0.2em] font-body">Customers</p>
        <h1 className="font-display text-plum text-[32px] leading-tight mt-1">Everyone you've helped</h1>
      </header>

      <input
        type="text"
        placeholder="Search by name or mobile…"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        className="w-full bg-warm-white border border-plum/20 px-4 py-3 text-plum text-sm placeholder-plum/30 outline-none focus:border-plum font-body mb-6"
      />

      {error && <p className="text-red-800 text-sm font-body mb-4">{error}</p>}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-warm-white border border-plum/10 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-plum/50 text-sm text-center py-16 border border-dashed border-plum/20 bg-warm-white font-body">
          {customers.length === 0
            ? 'No customers yet. Onboard your first one.'
            : 'No match. Try a different name or number.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => {
            const photoUrl = c.photo_clean_url || c.photo_url;
            const initials = (c.name || '?').split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
            return (
              <button
                key={c.id}
                onClick={() => startForCustomer(c)}
                className="w-full text-left flex items-center gap-4 p-3 bg-warm-white border border-plum/10 hover:border-plum/40 transition-colors"
              >
                <div className="w-14 h-14 bg-ivory border border-plum/10 flex-shrink-0 overflow-hidden">
                  {photoUrl
                    ? <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-rose-gold-dim text-sm font-body">{initials}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-plum text-[15px] font-body truncate">{c.name}</div>
                  <div className="text-plum/60 text-xs font-body">+91 {c.mobile}</div>
                </div>
                <div className="text-right">
                  <div className="text-plum/50 text-xs font-body">First visit</div>
                  <div className="text-plum text-sm font-body">{daysAgo(c.created_at)}</div>
                </div>
                <span className="text-plum/40 text-xl ml-2">→</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
