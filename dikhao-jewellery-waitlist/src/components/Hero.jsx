import { useTranslation } from 'react-i18next';
import { HERO_PRIMARY } from '../data/imagery';

export function Hero() {
  const { t } = useTranslation();
  const wordmark = t('hero.wordmark');

  return (
    <section id="top" className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 px-6 sm:px-10">
      <div className="max-w-[1280px] mx-auto grid lg:grid-cols-[1.1fr,0.9fr] gap-10 lg:gap-20 items-end">

        {/* Left: editorial text stack */}
        <div className="relative z-10">
          <p className="text-[11px] uppercase tracking-[0.25em] text-plum/70 mb-8 animate-fade-up">
            {t('hero.eyebrow')}
          </p>

          {/* Kinetic wordmark — each glyph eases in */}
          <h1
            className="font-display italic text-plum leading-[0.85] tracking-tightest mb-6
              text-[84px] sm:text-[132px] lg:text-[168px]"
            aria-label={wordmark}
          >
            {wordmark.split('').map((ch, i) => (
              <span
                key={i}
                className="inline-block animate-letter-in"
                style={{ animationDelay: `${80 + i * 55}ms` }}
              >
                {ch}
              </span>
            ))}
          </h1>

          <p
            className="font-display text-plum text-[24px] sm:text-[28px] italic leading-snug mb-8 animate-fade-up"
            style={{ animationDelay: '700ms' }}
          >
            {t('hero.tagline')}
          </p>

          <p
            className="text-ink-soft text-[15px] sm:text-[17px] leading-relaxed max-w-[520px] mb-10 animate-fade-up"
            style={{ animationDelay: '820ms' }}
          >
            {t('hero.sub')}
          </p>

          <div className="animate-fade-up" style={{ animationDelay: '940ms' }}>
            <a
              href="#waitlist"
              className="group inline-flex items-center gap-3 bg-plum text-ivory px-7 py-4 rounded-full text-[13px] uppercase tracking-[0.15em] hover:bg-plum-dim transition-colors"
            >
              {t('hero.cta')}
              <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </a>
          </div>
        </div>

        {/* Right: tall portrait image with gentle entrance + subtle rose-gold frame */}
        <div className="relative animate-fade-up" style={{ animationDelay: '400ms' }}>
          <div className="relative">
            {/* Rose-gold offset outline behind the image */}
            <div className="absolute -inset-2 border border-rose-gold/50 rounded-[2px] translate-x-3 translate-y-3" aria-hidden />
            <img
              src={HERO_PRIMARY}
              alt="A bride in traditional Indian jewellery"
              className="relative w-full aspect-[4/5] object-cover rounded-[2px] shadow-[0_40px_80px_-30px_rgba(61,15,26,0.25)]"
              loading="eager"
              fetchpriority="high"
              decoding="async"
            />
          </div>

          {/* Caption / pull-quote */}
          <div className="absolute -bottom-6 -left-6 sm:-left-10 bg-ivory px-5 py-3 max-w-[240px] border-l-2 border-rose-gold">
            <p className="font-display italic text-plum text-sm leading-snug">"She'll pick seven. She'll try two."</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft mt-1">The problem we solve</p>
          </div>
        </div>
      </div>
    </section>
  );
}
