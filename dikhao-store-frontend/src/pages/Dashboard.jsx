import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlanCard } from '../components/PlanCard';
import { StatusLegend } from '../components/StatusLegend';
import { checkPlan } from '../api/plan';
import { todaysList } from '../api/tryon';

function daysBetween(endDate) {
  const diff = new Date(endDate) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function statusDot(status, sent) {
  if (status === 'done' && sent)  return { color: '#25D366', label: 'Sent · भेजा' };
  if (status === 'done')           return { color: '#25D366', label: 'Sent · भेजा' };
  if (status === 'failed' || status === 'photo_error') return { color: '#E24B4A', label: 'Retake · फिर करें' };
  return { color: '#E8A838', label: 'Processing · बन रहा' };
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { store } = useOutletContext();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [today, setToday] = useState([]);

  const openSession = (s) => {
    if (s.status === 'done') {
      navigate(`/dashboard/tryon/${s.id}/result`);
    } else if (s.status === 'processing' || s.status === 'pending') {
      navigate(`/dashboard/tryon/${s.id}`);
    } else {
      // failed | photo_error → back to Step 1 with mobile prefilled so the saved photo auto-loads
      navigate('/dashboard/customer/new', {
        state: { prefillMobile: s.customers?.mobile },
      });
    }
  };

  useEffect(() => {
    checkPlan().then(r => setPlan(r.data)).catch(() => {});
    todaysList().then(r => setToday(r.data.sessions || [])).catch(() => {});
  }, []);

  const customersLimit = plan?.customersRemaining != null
    ? plan.customersRemaining + (store?.customers_used || 0)
    : 0;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <header className="mb-6">
        <p className="text-white/50 text-xs">{store?.store_name}</p>
        <h1 className="font-heading font-bold text-white text-2xl">Namaste, {store?.owner_name?.split(' ')[0]} 👋</h1>
      </header>

      <PlanCard
        plan={store?.plan || 'trial'}
        customersUsed={store?.customers_used || 0}
        customersLimit={customersLimit}
        daysLeft={daysBetween(store?.plan_end_date)}
      />

      {/* Two CTA cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <Link to="/dashboard/customer/new" className="rounded-2xl p-5 border-[1.5px] border-brand-gold bg-brand-gold/[0.06] hover:bg-brand-gold/[0.1] transition-colors">
          <div className="w-10 h-10 rounded-xl bg-brand-gold/20 flex items-center justify-center mb-3">
            <span className="text-xl">➕</span>
          </div>
          <p className="text-white font-semibold text-sm">{t('dashboard.newCustomerCta')}</p>
          <p className="text-white/50 text-xs">नया ग्राहक</p>
        </Link>
        <Link to="/dashboard/customers" className="rounded-2xl p-5 border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
            <span className="text-xl opacity-60">👥</span>
          </div>
          <p className="text-white font-semibold text-sm">{t('dashboard.existingCustomerCta')}</p>
          <p className="text-white/50 text-xs">पुराना ग्राहक</p>
        </Link>
      </div>

      {/* Today's list */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold text-sm">{t('dashboard.todaySection')} · आज के try-ons</h2>
          <StatusLegend />
        </div>

        {today.length === 0 ? (
          <div className="text-white/40 text-sm text-center py-10 border border-dashed border-white/10 rounded-xl">
            {t('dashboard.empty')}
          </div>
        ) : (
          <div className="space-y-2">
            {today.map(s => {
              const dot = statusDot(s.status, s.whatsapp_sent);
              const cloth = s.shirt_url && s.trouser_url ? 'Shirt + Trouser' : s.shirt_url ? 'Shirt' : 'Trouser';
              const initials = (s.customers?.name || '?').split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
              const isFailed = s.status === 'failed' || s.status === 'photo_error';
              return (
                <button
                  key={s.id}
                  onClick={() => openSession(s)}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-brand-purple/30 text-white font-bold text-xs flex items-center justify-center">{initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm truncate">{s.customers?.name}</div>
                    <div className="text-white/40 text-xs">{cloth} · +91 {s.customers?.mobile}</div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: dot.color }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dot.color }} />
                      {dot.label}
                    </div>
                    {isFailed && <span className="text-white/40 text-[10px]">Tap to retake →</span>}
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
