import { useTranslation } from 'react-i18next';

// Renders "हिंदी · English" per brand rules
export function BilingualButton({ enKey, hiKey, onClick, type = 'button', disabled, className = '', loadingText = null }) {
  const { i18n } = useTranslation();
  const en = i18n.getResource('en', 'translation', enKey);
  const hi = i18n.getResource('hi', 'translation', hiKey || enKey);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 rounded-xl font-bold text-sm transition-all
        ${disabled
          ? 'bg-white/10 text-white/30 cursor-not-allowed border border-white/10'
          : 'bg-brand-gold text-brand-navy hover:bg-yellow-400 cursor-pointer'} ${className}`}
    >
      {loadingText || `${hi} · ${en}`}
    </button>
  );
}
