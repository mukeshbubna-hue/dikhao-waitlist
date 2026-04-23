import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-brand-navy border-t border-white/10 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-heading font-bold text-white text-lg">Dikhao</span>
          <span className="text-white/30 text-sm">·</span>
          <span className="text-white/40 text-sm">{t('footer.tagline')}</span>
        </div>

        <div className="flex items-center gap-5 text-white/40 text-sm">
          <a href="#" className="hover:text-white/70 transition-colors">{t('footer.privacy')}</a>
          <a href="#" className="hover:text-white/70 transition-colors">{t('footer.terms')}</a>
          <a href="mailto:hello@dikhao.in" className="hover:text-white/70 transition-colors">{t('footer.contact')}</a>
        </div>
      </div>
    </footer>
  );
}
