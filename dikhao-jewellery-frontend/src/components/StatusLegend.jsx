import { useTranslation } from 'react-i18next';

export function StatusLegend() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 text-[10px] text-white/50">
      <span className="flex items-center gap-1"><Dot color="#25D366" /> {t('dashboard.statusSent')} · भेजा</span>
      <span className="flex items-center gap-1"><Dot color="#E8A838" /> {t('dashboard.statusProcessing')} · बन रहा</span>
      <span className="flex items-center gap-1"><Dot color="#E24B4A" /> {t('dashboard.statusFailed')} · फिर करें</span>
    </div>
  );
}

function Dot({ color }) {
  return <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />;
}
