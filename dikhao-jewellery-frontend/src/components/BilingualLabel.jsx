import { useTranslation } from 'react-i18next';

export function BilingualLabel({ enKey, hiKey }) {
  const { i18n } = useTranslation();
  const en = i18n.getResource('en', 'translation', enKey);
  const hi = i18n.getResource('hi', 'translation', hiKey || enKey);
  return (
    <label className="block mb-1.5">
      <span className="block text-plum text-[11px] uppercase tracking-[0.2em] font-body">{en}</span>
      <span className="block text-plum/50 text-xs mt-0.5 font-body">{hi}</span>
    </label>
  );
}
