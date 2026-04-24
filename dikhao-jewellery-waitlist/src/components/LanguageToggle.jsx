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
      className={`text-[11px] uppercase tracking-[0.2em] text-ink-soft hover:text-plum transition-colors ${className}`}
    >
      {isHindi ? 'English' : 'हिंदी'}
    </button>
  );
}
