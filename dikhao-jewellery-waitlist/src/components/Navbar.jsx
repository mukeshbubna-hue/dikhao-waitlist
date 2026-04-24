import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from './LanguageToggle';

export function Navbar() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300
        ${scrolled ? 'bg-ivory/85 backdrop-blur-md border-b border-plum/5' : 'bg-transparent'}`}
    >
      <div className="max-w-[1280px] mx-auto px-6 sm:px-10 h-14 sm:h-16 flex items-center justify-between">
        <a href="#top" className="font-display italic text-plum text-[22px] sm:text-[24px] leading-none tracking-tight">
          Dikhao
        </a>

        <div className="flex items-center gap-5 sm:gap-8">
          <a href="#how" className="hidden sm:block text-[11px] uppercase tracking-[0.2em] text-ink-soft hover:text-plum transition-colors">
            {t('nav.howItWorks')}
          </a>
          <LanguageToggle />
          <a
            href="#waitlist"
            className="text-[11px] uppercase tracking-[0.2em] border border-plum/30 text-plum hover:bg-plum hover:text-ivory transition-all px-4 py-2 rounded-full"
          >
            {t('nav.waitlist')}
          </a>
        </div>
      </div>
    </nav>
  );
}
