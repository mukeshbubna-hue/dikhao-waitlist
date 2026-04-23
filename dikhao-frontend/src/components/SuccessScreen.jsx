import { useTranslation } from 'react-i18next';

export default function SuccessScreen({ mobile }) {
  const { t } = useTranslation();

  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 bg-green-500/20 border border-green-400/30 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="16" fill="#22c55e" fillOpacity="0.2"/>
          <path d="M10 16.5l4.5 4.5 7.5-8" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <h2 className="font-heading font-bold text-white text-xl mb-2">{t('success.title')}</h2>
      <p className="text-white/60 text-sm leading-relaxed mb-5">
        {t('success.sub').replace('{mobile}', `+91 ${mobile}`)}
      </p>

      <div className="inline-flex items-center gap-2 bg-brand-gold/15 border border-brand-gold/30 rounded-full px-4 py-2">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1l1.5 3.5L12 5l-2.5 2.5.5 3.5L7 9.5 4 11l.5-3.5L2 5l3.5-.5L7 1z" fill="#E8A838"/>
        </svg>
        <span className="text-brand-gold text-xs font-semibold">{t('success.pill')}</span>
      </div>
    </div>
  );
}
