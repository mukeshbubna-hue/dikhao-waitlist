import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const steps = [
  { key: 'step1', icon: '📸', num: '01' },
  { key: 'step2', icon: '👕', num: '02' },
  { key: 'step3', icon: '✨', num: '03' },
];

export default function HowItWorks() {
  const { t } = useTranslation();
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = 0.3;
  }, []);

  return (
    <section id="how-it-works" className="bg-brand-bg py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
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

        {/* Two-column: steps left, video right */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Steps */}
          <div className="space-y-6 order-2 lg:order-1">
            {steps.map(({ key, icon, num }, idx) => (
              <div key={key} className="flex gap-5 items-start">
                {/* Number + connector */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-11 h-11 rounded-xl bg-white border border-brand-navy/10 shadow-sm flex items-center justify-center text-xl">
                    {icon}
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="w-px h-8 bg-brand-navy/10 mt-2" />
                  )}
                </div>

                {/* Text */}
                <div className="pt-1.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-brand-purple/40 font-heading font-bold text-xs tracking-widest">{num}</span>
                    <h3 className="font-heading font-semibold text-brand-navy text-base">
                      {t(`how.${key}.title`)}
                    </h3>
                  </div>
                  <p className="text-brand-navy/55 text-sm leading-relaxed">
                    {t(`how.${key}.desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Video */}
          <div className="order-1 lg:order-2">
            <div className="relative w-full">
              {/* Glow behind */}
              <div className="absolute inset-0 bg-brand-purple/15 rounded-2xl blur-2xl scale-95 translate-y-4" />

              {/* Screen-style frame */}
              <div className="relative bg-brand-navy rounded-2xl p-2 shadow-2xl">
                {/* Fake browser bar */}
                <div className="flex items-center gap-1.5 px-3 py-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                </div>
                <div className="bg-black rounded-xl overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    src="/design.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-full px-4 py-2 shadow-lg border border-brand-navy/8 flex items-center gap-2 whitespace-nowrap">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-brand-navy text-xs font-semibold">20 seconds · on WhatsApp</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
