import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-plum text-ivory">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-10 py-14">
        <div className="grid sm:grid-cols-[1.2fr,1fr,1fr] gap-10 sm:gap-16">
          <div>
            <p className="font-display italic text-ivory text-[32px] leading-none mb-3">Dikhao</p>
            <p className="text-ivory/60 text-[14px] leading-relaxed max-w-[320px]">
              {t('footer.blurb')}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-rose-gold mb-4">Contact</p>
            <a href={`mailto:${t('footer.contact')}`} className="text-ivory/80 hover:text-ivory text-[14px]">
              {t('footer.contact')}
            </a>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-rose-gold mb-4">For stores</p>
            <a href="#waitlist" className="text-ivory/80 hover:text-ivory text-[14px] block">
              Pilot access
            </a>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-ivory/10 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ivory/50">
            {t('footer.rights')} © {year}
          </p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-ivory/50 devanagari">
            दिखाओ
          </p>
        </div>
      </div>
    </footer>
  );
}
