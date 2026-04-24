import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function PhotoError() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto text-center">
      <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-status-red/15 border border-status-red/30 flex items-center justify-center text-3xl">📷</div>

      <h1 className="font-heading font-bold text-white text-xl mb-2">{t('photoError.title')}</h1>
      <p className="text-white/50 text-sm mb-6 leading-relaxed">{t('photoError.sub')}</p>

      <div className="text-left bg-white/[0.04] border border-white/10 rounded-xl p-4 mb-6 space-y-2 text-sm">
        <p className="text-white/80">✓ Full body visible — head to feet</p>
        <p className="text-white/40 text-xs">सिर से पैर तक पूरा दिखे</p>
        <p className="text-white/80">✓ Even lighting, no harsh shadows</p>
        <p className="text-white/40 text-xs">एक जैसी रोशनी — shadow नहीं</p>
        <p className="text-white/80">✓ Hold phone steady</p>
        <p className="text-white/40 text-xs">फ़ोन स्थिर रखें</p>
      </div>

      <button
        onClick={() => navigate('/dashboard/customer/new')}
        className="w-full py-3 rounded-xl bg-brand-gold text-brand-navy font-bold text-sm hover:bg-yellow-400"
      >
        {t('photoError.cta')} · फ़ोटो दोबारा लें
      </button>
    </div>
  );
}
