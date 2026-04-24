import { useTranslation } from 'react-i18next';

export function BilingualButton({ enKey, hiKey, onClick, type = 'button', disabled, className = '', loadingText = null }) {
  const { i18n } = useTranslation();
  const en = i18n.getResource('en', 'translation', enKey);
  const hi = i18n.getResource('hi', 'translation', hiKey || enKey);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 font-body text-sm transition-colors ${
        disabled
          ? 'bg-plum/5 text-plum/30 border border-plum/10 cursor-not-allowed'
          : 'bg-plum text-ivory hover:bg-plum-dim cursor-pointer'
      } ${className}`}
    >
      {loadingText || `${hi} · ${en}`}
    </button>
  );
}
