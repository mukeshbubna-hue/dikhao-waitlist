import { useTranslation } from 'react-i18next';
import WaitlistForm from './WaitlistForm';
import OtpVerify from './OtpVerify';
import SuccessScreen from './SuccessScreen';

export default function HeroSection({ step, mobile, onOtpSent, onVerified, onBack, onTakeSurvey }) {
  const { t } = useTranslation();

  return (
    <section className="bg-brand-navy min-h-[calc(100vh-56px)] flex items-center">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-brand-purple/20 border border-brand-purple/40 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-brand-gold rounded-full animate-pulse" />
              <span className="text-white/80 text-xs font-medium">{t('hero.badge')}</span>
            </div>

            <h1 className="font-heading font-bold text-white text-3xl sm:text-4xl lg:text-5xl leading-tight mb-5">
              {(() => {
                const full = t('hero.title');
                const accent = t('hero.titleAccent');
                const idx = full.indexOf(accent);
                if (idx === -1) return full;
                return (
                  <>
                    {full.slice(0, idx)}
                    <span className="text-brand-gold">{accent}</span>
                  </>
                );
              })()}
            </h1>

            <p className="text-white/60 text-base leading-relaxed mb-8 max-w-md">
              {t('hero.sub')}
            </p>

            <ul className="space-y-3">
              {['hero.trust1','hero.trust2','hero.trust3'].map(key => (
                <li key={key} className="flex items-center gap-3 text-white/70 text-sm">
                  <span className="w-5 h-5 rounded-full bg-brand-purple/30 border border-brand-purple/50 flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5 4-4" stroke="#6C3CE1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: form card */}
          <div className="lg:max-w-sm lg:ml-auto w-full">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
              {step === 'form' && (
                <>
                  <p className="font-heading font-bold text-white text-lg mb-1">{t('form.title')}</p>
                  <p className="text-white/50 text-xs mb-5 leading-relaxed">{t('form.sub')}</p>
                  <WaitlistForm onOtpSent={onOtpSent} />
                </>
              )}
              {step === 'otp' && (
                <OtpVerify mobile={mobile} onSuccess={onVerified} onBack={onBack} />
              )}
              {step === 'success' && (
                <SuccessScreen mobile={mobile} onTakeSurvey={onTakeSurvey} />
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
