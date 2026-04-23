import { useTranslation } from 'react-i18next';

const steps = [
  { key: 'step1', icon: '📸', num: '01' },
  { key: 'step2', icon: '👕', num: '02' },
  { key: 'step3', icon: '✨', num: '03' },
];

export default function HowItWorks() {
  const { t } = useTranslation();

  return (
    <section id="how-it-works" className="bg-brand-bg py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-brand-purple text-sm font-semibold uppercase tracking-wider mb-2">
            {t('how.eyebrow')}
          </p>
          <h2 className="font-heading font-bold text-brand-navy text-3xl sm:text-4xl mb-3">
            {t('how.title')}
          </h2>
          <p className="text-brand-navy/60 text-base max-w-md mx-auto">
            {t('how.sub')}
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-8">
          {steps.map(({ key, icon, num }) => (
            <div key={key} className="relative">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-navy/5 h-full">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl">{icon}</span>
                  <span className="text-brand-purple/25 font-heading font-bold text-4xl leading-none">{num}</span>
                </div>
                <h3 className="font-heading font-semibold text-brand-navy text-lg mb-2">
                  {t(`how.${key}.title`)}
                </h3>
                <p className="text-brand-navy/60 text-sm leading-relaxed">
                  {t(`how.${key}.desc`)}
                </p>
              </div>

              {num !== '03' && (
                <div className="hidden sm:block absolute top-1/2 -right-4 w-8 text-center text-brand-purple/30 text-xl">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
