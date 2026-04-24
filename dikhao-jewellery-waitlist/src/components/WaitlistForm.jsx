import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { STATES_CITIES } from '../data/states_cities';
import { submitWaitlist } from '../api/waitlist';
import { getWaitlistStats } from '../api/stats';

const SOCIAL_PROOF_THRESHOLD = 10;

export function WaitlistForm() {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    store_name: '', owner_name: '', mobile: '', state: '', city: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getWaitlistStats().then(setStats).catch(() => {});
  }, []);

  const statsLine = !stats ? null
    : stats.total >= SOCIAL_PROOF_THRESHOLD
      ? t('stats.live', {
          count: stats.total,
          cities: stats.cities,
          citiesWord: stats.cities === 1 ? 'city' : 'cities',
        })
      : t('stats.scarcity');

  const cities = form.state ? STATES_CITIES[form.state] || [] : [];

  const set = (k) => (e) => {
    const v = e.target.value;
    setForm(f => (k === 'state' ? { ...f, state: v, city: '' } : { ...f, [k]: v }));
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.store_name || !form.owner_name || !form.mobile || !form.state || !form.city) {
      setError(t('form.errorAllFields'));
      return;
    }
    if (!/^\d{10}$/.test(form.mobile)) {
      setError(t('form.errorMobile'));
      return;
    }
    setLoading(true);
    try {
      await submitWaitlist(form);
      window.datafast?.("signup");
      setDone(true);
    } catch (err) {
      setError(err.message || t('form.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <section id="waitlist" className="py-24 sm:py-36 px-6 sm:px-10 bg-ivory">
        <div className="max-w-[640px] mx-auto text-center">
          <div className="mx-auto w-14 h-14 rounded-full border border-rose-gold/70 flex items-center justify-center mb-8">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 10.5l3.5 3.5L15 6.5" stroke="#3D0F1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="font-display text-plum text-[40px] sm:text-[56px] leading-[1.05] tracking-tight mb-5">
            {t('form.successTitle')}
          </h2>
          <p className="text-ink-soft text-[17px] leading-relaxed max-w-[480px] mx-auto">
            {t('form.successSub')}
          </p>
        </div>
      </section>
    );
  }

  // 16px font on inputs prevents iOS Safari's auto-zoom when the field gains focus.
  const inputCls = "w-full px-4 py-4 rounded-none text-[16px] font-body bg-white border border-plum/15 focus:border-plum focus:outline-none transition-colors";
  const labelCls = "block text-[11px] uppercase tracking-[0.2em] text-plum/70 mb-2";

  return (
    <section id="waitlist" className="py-24 sm:py-36 px-6 sm:px-10 bg-ivory">
      <div className="max-w-[1280px] mx-auto grid lg:grid-cols-[0.85fr,1.15fr] gap-12 lg:gap-24">

        <div className="reveal">
          <p className="text-[11px] uppercase tracking-[0.25em] text-plum/70 mb-4">
            {t('form.eyebrow')}
          </p>
          <h2 className="font-display text-plum text-[40px] sm:text-[56px] leading-[1.02] tracking-tight mb-6">
            {t('form.title')}
          </h2>
          <p className="text-ink-soft text-[16px] leading-relaxed max-w-[480px]">
            {t('form.sub')}
          </p>
          {statsLine && (
            <p className="text-[11px] uppercase tracking-[0.2em] text-rose-gold-dim mt-6 border-l border-rose-gold/40 pl-3">
              {statsLine}
            </p>
          )}
        </div>

        <form onSubmit={submit} className="reveal reveal-delay-2 space-y-6">
          <div>
            <label className={labelCls}>{t('form.storeName')}</label>
            <input className={inputCls} value={form.store_name} onChange={set('store_name')} placeholder="e.g. Sharma Jewellers" required />
          </div>

          <div>
            <label className={labelCls}>{t('form.ownerName')}</label>
            <input className={inputCls} value={form.owner_name} onChange={set('owner_name')} placeholder="Your name" required />
          </div>

          <div>
            <label className={labelCls}>{t('form.mobile')}</label>
            <div className="flex">
              <span className="px-4 py-4 bg-pearl text-ink-soft text-[16px] border border-plum/15 border-r-0">+91</span>
              <input
                className={inputCls}
                type="tel" inputMode="numeric" maxLength={10}
                value={form.mobile} onChange={set('mobile')}
                placeholder="10-digit number" required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t('form.state')}</label>
              <select
                className={`${inputCls} appearance-none pr-10`}
                value={form.state}
                onChange={set('state')}
                required
                style={{ backgroundImage: 'linear-gradient(45deg, transparent 50%, #3D0F1A 50%), linear-gradient(135deg, #3D0F1A 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) center, calc(100% - 15px) center', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
              >
                <option value="">{t('form.selectState')}</option>
                {Object.keys(STATES_CITIES).sort().map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('form.city')}</label>
              <select
                className={`${inputCls} appearance-none pr-10`}
                value={form.city}
                onChange={set('city')}
                required
                disabled={!form.state}
                style={{ backgroundImage: 'linear-gradient(45deg, transparent 50%, #3D0F1A 50%), linear-gradient(135deg, #3D0F1A 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) center, calc(100% - 15px) center', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
              >
                <option value="">{t('form.selectCity')}</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {error && <p className="text-[13px] text-red-800 font-body">{error}</p>}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-plum text-ivory px-8 py-4 rounded-full text-[13px] uppercase tracking-[0.15em] hover:bg-plum-dim transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? t('form.submitting') : t('form.cta')}
              {!loading && <span className="inline-block transition-transform group-hover:translate-x-1">→</span>}
            </button>
            <p className="text-[12px] text-ink-soft mt-4 max-w-[380px] leading-relaxed">
              {t('form.privacy')}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
