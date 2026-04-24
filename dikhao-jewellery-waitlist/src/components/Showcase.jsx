import { useTranslation } from 'react-i18next';
import { CATEGORY_IMAGES } from '../data/imagery';

export function Showcase() {
  const { t } = useTranslation();

  const categories = [
    { key: 'c1', img: CATEGORY_IMAGES.necklace },
    { key: 'c2', img: CATEGORY_IMAGES.earrings },
    { key: 'c3', img: CATEGORY_IMAGES.choker },
    { key: 'c4', img: CATEGORY_IMAGES.pendant },
    { key: 'c5', img: CATEGORY_IMAGES.borla },
    { key: 'c6', img: CATEGORY_IMAGES.nath },
  ];

  return (
    <section className="py-24 sm:py-36 px-6 sm:px-10 bg-plum text-ivory">
      <div className="max-w-[1280px] mx-auto">
        <div className="max-w-[720px] mb-16">
          <p className="text-[11px] uppercase tracking-[0.25em] text-rose-gold mb-4 reveal">
            {t('showcase.eyebrow')}
          </p>
          <h2 className="font-display text-ivory text-[40px] sm:text-[64px] leading-[1.02] tracking-tight mb-6 reveal reveal-delay-1">
            {t('showcase.title')}
          </h2>
          <p className="text-ivory/60 text-[16px] leading-relaxed max-w-[560px] reveal reveal-delay-2">
            {t('showcase.sub')}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {categories.map((c, i) => (
            <figure
              key={c.key}
              className="group relative overflow-hidden reveal"
              style={{ transitionDelay: `${(i % 3) * 100}ms` }}
            >
              <div className="aspect-[4/5] bg-ivory/5 overflow-hidden">
                <img
                  src={c.img}
                  alt={t(`showcase.${c.key}`)}
                  className="w-full h-full object-cover grayscale-[15%] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              </div>
              <figcaption className="absolute inset-x-0 bottom-0 p-4 sm:p-5 bg-gradient-to-t from-plum/95 via-plum/60 to-transparent pt-14">
                <p className="font-display italic text-ivory text-[18px] sm:text-[22px] leading-tight">
                  {t(`showcase.${c.key}`)}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
