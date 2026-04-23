import { useTranslation } from 'react-i18next';

export function BilingualLabel({ enKey, hiKey }) {
  const { i18n } = useTranslation();
  const en = i18n.getResource('en', 'translation', enKey);
  const hi = i18n.getResource('hi', 'translation', hiKey || enKey);
  return (
    <label className="block mb-1.5">
      <span className="block text-white/80 text-[11px] font-semibold uppercase tracking-wider">{en}</span>
      <span className="block text-white/50 text-xs mt-0.5">{hi}</span>
    </label>
  );
}
