import { useTranslation } from 'react-i18next';

export function PlanCard({ plan, customersUsed, customersLimit, daysLeft }) {
  const { t } = useTranslation();
  const pct = customersLimit > 0 ? Math.min(100, (customersUsed / customersLimit) * 100) : 0;
  const isPro = plan === 'pro';

  return (
    <div className="bg-warm-white border border-plum/15 p-5 mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-gold" />
          <span className="text-plum/60 text-[11px] uppercase tracking-[0.15em] font-body">
            {t('dashboard.planBadge')}
          </span>
          <span className="font-display text-plum text-[15px] uppercase tracking-tight">{plan}</span>
        </div>
        {!isPro && (
          <a href="/dashboard/plan" className="text-rose-gold-dim text-xs font-body font-medium underline">
            {t('dashboard.upgrade')}
          </a>
        )}
      </div>

      <div className="flex justify-between text-xs text-plum/70 mb-1.5 font-body">
        <span>{customersUsed} / {customersLimit} {t('dashboard.customersUsed')}</span>
        <span>{daysLeft} {t('dashboard.daysLeft')}</span>
      </div>
      <div className="h-1.5 bg-plum/10 overflow-hidden">
        <div className="h-full bg-rose-gold transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
