import { useTranslation } from 'react-i18next';
import { STEP_IMAGES } from '../data/imagery';

export function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    { n: '01', labelKey: 'step1.label', titleKey: 'step1.title', descKey: 'step1.desc', img: STEP_IMAGES.step1, flip: false },
    { n: '02', labelKey: 'step2.label', titleKey: 'step2.title', descKey: 'step2.desc', img: STEP_IMAGES.step2, flip: true  },
    { n: '03', labelKey: 'step3.label', titleKey: 'step3.title', descKey: 'step3.desc', img: STEP_IMAGES.step3, flip: false },
  ];

  return (
    <section id="how" className="py-24 sm:py-36 px-6 sm:px-10">
      <div className="max-w-[1280px] mx-auto">

        {/* Section header */}
        <div className="max-w-[720px] mb-20 sm:mb-28">
          <p className="text-[11px] uppercase tracking-[0.25em] text-plum/70 mb-4 reveal">
            {t('section2.eyebrow')}
          </p>
          <h2 className="font-display text-plum text-[40px] sm:text-[64px] leading-[1.02] tracking-tight reveal reveal-delay-1">
            {t('section2.title')}
          </h2>
        </div>

        {/* Alternating step rows */}
        <div className="space-y-24 sm:space-y-40">
          {steps.map((s, idx) => (
            <article
              key={s.n}
              className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center"
            >
              {/* Image — with a large italic serif number overlaid at corner */}
              <div
                className={`relative reveal ${s.flip ? 'lg:order-2' : 'lg:order-1'}`}
                style={{ transitionDelay: `${idx * 60}ms` }}
              >
                <div
                  className={`absolute -inset-2 border border-rose-gold/40 pointer-events-none
                    ${s.flip ? '-translate-x-3 translate-y-3' : 'translate-x-3 translate-y-3'}`}
                  aria-hidden
                />
                <img
                  src={s.img}
                  alt={t(s.titleKey)}
                  className="relative w-full aspect-[4/5] object-cover"
                  loading="lazy"
                />
                <span
                  className={`absolute font-display italic text-rose-gold leading-none select-none
                    text-[88px] sm:text-[120px] lg:text-[140px]
                    ${s.flip ? '-right-3 sm:-right-6 -top-8 sm:-top-12' : '-left-3 sm:-left-6 -top-8 sm:-top-12'}`}
                  aria-hidden
                >
                  {s.n}
                </span>
              </div>

              {/* Text block */}
              <div
                className={`max-w-[520px] reveal ${s.flip ? 'lg:order-1 lg:pr-8' : 'lg:order-2 lg:pl-8'}`}
                style={{ transitionDelay: `${idx * 60 + 120}ms` }}
              >
                <p className="text-[11px] uppercase tracking-[0.25em] text-plum/60 mb-5">
                  {t(s.labelKey)}
                </p>
                <h3 className="font-display text-plum text-[30px] sm:text-[40px] leading-[1.08] mb-5">
                  {t(s.titleKey)}
                </h3>
                <p className="text-ink-soft text-[16px] sm:text-[17px] leading-relaxed">
                  {t(s.descKey)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
