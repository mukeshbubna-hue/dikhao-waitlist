import { useTranslation } from 'react-i18next';
import { SECTION1_IMAGE } from '../data/imagery';

export function TheMoment() {
  const { t } = useTranslation();
  return (
    <section className="py-24 sm:py-36 px-6 sm:px-10 bg-warm-white">
      <div className="max-w-[1280px] mx-auto grid lg:grid-cols-[0.9fr,1.1fr] gap-12 lg:gap-20 items-center">
        <div className="lg:order-2 reveal">
          <div className="relative">
            <div className="absolute -inset-2 border border-plum/10 translate-x-4 -translate-y-4" aria-hidden />
            <img
              src={SECTION1_IMAGE}
              alt="Moment of decision"
              className="relative w-full aspect-[4/5] object-cover"
              loading="lazy"
            />
          </div>
        </div>

        <div className="lg:order-1">
          <p className="text-[11px] uppercase tracking-[0.25em] text-plum/70 mb-4 reveal">
            {t('section1.eyebrow')}
          </p>
          <h2 className="font-display text-plum text-[40px] sm:text-[56px] leading-[1.02] tracking-tight mb-6 reveal reveal-delay-1">
            {t('section1.title')}
          </h2>
          <p className="text-ink-soft text-[17px] leading-relaxed max-w-[520px] reveal reveal-delay-2">
            {t('section1.sub')}
          </p>
        </div>
      </div>
    </section>
  );
}
