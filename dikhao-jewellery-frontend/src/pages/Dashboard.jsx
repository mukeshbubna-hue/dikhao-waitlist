import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlanCard } from '../components/PlanCard';
import { checkPlan } from '../api/plan';
import { todaysJewelleryTryOns } from '../api/jewelleryTryon';

function daysBetween(endDate) {
  const diff = new Date(endDate) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function statusPill(status) {
  if (status === 'done')        return { color: '#25D366', label: 'Done · तैयार' };
  if (status === 'photo_error') return { color: '#E24B4A', label: 'Photo error · फ़ोटो' };
  if (status === 'failed')      return { color: '#E24B4A', label: 'Failed · विफल' };
  return { color: '#E8A838', label: 'Processing · बन रहा' };
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  return `${Math.floor(s/3600)}h ago`;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { store } = useOutletContext();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [today, setToday] = useState([]);

  useEffect(() => {
    checkPlan().then(r => setPlan(r.data)).catch(() => {});
    todaysJewelleryTryOns().then(r => setToday(r.data.sessions || [])).catch(() => {});
  }, []);

  const customersLimit = plan?.customersRemaining != null
    ? plan.customersRemaining + (store?.customers_used || 0)
    : 0;

  const openSession = (s) => {
    if (s.status === 'done') navigate(`/dashboard/jewellery-tryon/${s.id}`, { state: { customer: s.customer } });
    else if (s.status === 'photo_error') navigate('/dashboard/customer/new', { state: { prefillMobile: s.customer?.mobile } });
    else navigate(`/dashboard/jewellery-tryon/${s.id}`);
  };

  return (
    <div className="p-6 sm:p-10 max-w-[1100px] mx-auto">
      <header className="mb-8">
        <p className="text-plum/60 text-xs uppercase tracking-[0.2em] font-body">{store?.store_name}</p>
        <h1 className="font-display text-plum text-[32px] leading-tight mt-1">
          Namaste, {store?.owner_name?.split(' ')[0]} 👋
        </h1>
      </header>

      <PlanCard
        plan={store?.plan || 'trial'}
        customersUsed={store?.customers_used || 0}
        customersLimit={customersLimit}
        daysLeft={daysBetween(store?.plan_end_date)}
      />

      {/* CTA cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <Link
          to="/dashboard/customer/new"
          className="block p-6 border border-plum bg-plum text-ivory hover:bg-plum-dim transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-rose-gold/30 flex items-center justify-center mb-4">
            <span className="text-xl">➕</span>
          </div>
          <p className="font-body text-[15px]">{t('dashboard.newCustomerCta')}</p>
          <p className="text-ivory/70 text-xs mt-0.5">ग्राहक जोड़ें</p>
        </Link>
        <Link
          to="/dashboard/catalogue"
          className="block p-6 border border-plum/20 bg-warm-white hover:bg-pearl transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-rose-gold/20 flex items-center justify-center mb-4">
            <span className="text-xl">💎</span>
          </div>
          <p className="text-plum font-body text-[15px]">Manage catalogue</p>
          <p className="text-plum/60 text-xs mt-0.5">संग्रह</p>
        </Link>
      </div>

      {/* Today's try-ons */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-plum font-display text-[20px]">
            Today's try-ons · आज के try-ons
          </h2>
          <span className="text-plum/60 text-xs font-body">{today.length} {today.length === 1 ? 'session' : 'sessions'}</span>
        </div>

        {today.length === 0 ? (
          <div className="text-plum/50 text-sm text-center py-12 border border-dashed border-plum/20 bg-warm-white font-body">
            No try-ons yet today. Start one above.
          </div>
        ) : (
          <div className="space-y-2">
            {today.map(s => {
              const pill = statusPill(s.status);
              const initials = (s.customer?.name || '?').split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
              const sl = s.shortlist || {};
              return (
                <button
                  key={s.id}
                  onClick={() => openSession(s)}
                  className="w-full text-left flex items-center gap-3 p-3 bg-warm-white border border-plum/10 hover:border-plum/30 transition-colors"
                >
                  <div className="w-12 h-12 bg-ivory border border-plum/10 flex-shrink-0 overflow-hidden">
                    {s.result_url
                      ? <img src={s.result_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-rose-gold text-xs font-body">{initials}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-plum text-sm truncate font-body">{s.customer?.name || 'Customer'}</div>
                    <div className="text-plum/50 text-xs font-body">
                      {s.customer?.mobile ? `+91 ${s.customer.mobile} · ` : ''}{timeAgo(s.created_at)}
                    </div>
                    {(sl.hearted || sl.sent || sl.viewed) && (
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-body">
                        {sl.hearted && <span className="text-rose-gold-dim">♥ Hearted</span>}
                        {sl.sent    && <span className="text-status-green">📲 Sent</span>}
                        {sl.viewed  && <span className="text-plum">👁 Viewed</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-body flex-shrink-0" style={{ color: pill.color }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pill.color }} />
                    {pill.label}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
