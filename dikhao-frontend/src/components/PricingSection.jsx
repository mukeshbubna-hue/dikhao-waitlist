import { useTranslation } from 'react-i18next';

const plans = [
  {
    key: 'mini',
    price: '₹799',
    features: ['feat.customers100', 'feat.tryon1', 'feat.whatsapp'],
    highlight: false,
  },
  {
    key: 'max',
    price: '₹1,499',
    features: ['feat.customers250', 'feat.tryon2', 'feat.whatsapp'],
    highlight: true,
  },
  {
    key: 'pro',
    price: '₹2,499',
    features: ['feat.customers500', 'feat.tryon2', 'feat.whatsapp'],
    highlight: false,
  },
];

export default function PricingSection() {
  const { t } = useTranslation();

  return (
    <section id="pricing" className="bg-white py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-brand-purple text-sm font-semibold uppercase tracking-wider mb-2">
            {t('pricing.eyebrow')}
          </p>
          <h2 className="font-heading font-bold text-brand-navy text-3xl sm:text-4xl mb-3">
            {t('pricing.title')}
          </h2>
          <p className="text-brand-navy/60 text-base">
            {t('pricing.sub')}
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map(({ key, price, features, highlight }) => (
            <div
              key={key}
              className={`relative rounded-2xl p-6 border ${
                highlight
                  ? 'bg-brand-navy border-brand-purple shadow-xl shadow-brand-purple/10'
                  : 'bg-brand-bg border-brand-navy/10'
              }`}
            >
              {highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-gold text-brand-navy text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                    {t('pricing.bestValue')}
                  </span>
                </div>
              )}

              <p className={`font-heading font-semibold text-lg mb-1 ${highlight ? 'text-white' : 'text-brand-navy'}`}>
                {t(`pricing.${key}`)}
              </p>

              <div className="flex items-baseline gap-1 mb-5">
                <span className={`font-heading font-bold text-3xl ${highlight ? 'text-white' : 'text-brand-navy'}`}>
                  {price}
                </span>
                <span className={`text-sm ${highlight ? 'text-white/50' : 'text-brand-navy/50'}`}>
                  {t('pricing.perMonth')}
                </span>
              </div>

              <ul className="space-y-2.5 mb-6">
                {features.map(f => (
                  <li key={f} className={`flex items-center gap-2 text-sm ${highlight ? 'text-white/80' : 'text-brand-navy/70'}`}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                      <circle cx="7" cy="7" r="7" fill={highlight ? '#6C3CE1' : '#6C3CE1'} fillOpacity="0.15"/>
                      <path d="M4.5 7l2 2 3-3" stroke="#6C3CE1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {t(`pricing.${f}`)}
                  </li>
                ))}
              </ul>

              <a
                href="#"
                onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`block w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  highlight
                    ? 'bg-brand-gold text-brand-navy hover:bg-yellow-400'
                    : 'bg-brand-navy text-white hover:bg-brand-purple'
                }`}
              >
                Start free trial
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
