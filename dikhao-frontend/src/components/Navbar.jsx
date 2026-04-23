import { useTranslation } from 'react-i18next';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';

  const toggleLang = () => {
    const next = isHindi ? 'en' : 'hi';
    i18n.changeLanguage(next);
    localStorage.setItem('dikhao_lang', next);
  };

  return (
    <nav className="sticky top-0 z-50 bg-brand-navy/95 backdrop-blur border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <span className="font-heading font-bold text-white text-xl tracking-tight">
          Dikhao
        </span>

        <div className="flex items-center gap-4 sm:gap-6">
          <a href="#how-it-works" className="hidden sm:block text-white/60 hover:text-white text-sm transition-colors">
            {t('nav.howItWorks')}
          </a>
          <a href="#pricing" className="hidden sm:block text-white/60 hover:text-white text-sm transition-colors">
            {t('nav.pricing')}
          </a>
          <button
            onClick={toggleLang}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all"
          >
            {isHindi ? 'EN' : 'हिंदी'}
          </button>
        </div>
      </div>
    </nav>
  );
}
