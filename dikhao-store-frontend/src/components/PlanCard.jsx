import { useTranslation } from 'react-i18next';

export function PlanCard({ plan, customersUsed, customersLimit, daysLeft }) {
  const { t } = useTranslation();
  const pct = customersLimit > 0 ? Math.min(100, (customersUsed / customersLimit) * 100) : 0;
  const isPro = plan === 'pro';

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-purple" />
          <span className="text-white/60 text-xs">{t('dashboard.planBadge')}</span>
          <span className="text-white font-heading font-bold uppercase text-sm">{plan}</span>
        </div>
        {!isPro && <a href="/dashboard/plan" className="text-brand-gold text-xs font-semibold">{t('dashboard.upgrade')}</a>}
      </div>

      <div className="flex justify-between text-xs text-white/60 mb-1.5">
        <span>{customersUsed} / {customersLimit} {t('dashboard.customersUsed')}</span>
        <span>{daysLeft} {t('dashboard.daysLeft')}</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-brand-purple" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
