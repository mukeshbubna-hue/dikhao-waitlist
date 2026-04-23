import { useTranslation } from 'react-i18next';

export function LanguageToggle({ className = '' }) {
  const { i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';
  const toggle = () => {
    const next = isHindi ? 'en' : 'hi';
    i18n.changeLanguage(next);
    localStorage.setItem('dikhao_lang', next);
  };
  return (
    <button
      onClick={toggle}
      className={`text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all ${className}`}
    >
      {isHindi ? 'EN' : 'हिंदी'}
    </button>
  );
}
