import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sendOtp } from '../api/waitlist';
import { STATES_CITIES } from '../data/states_cities';

export default function WaitlistForm({ onOtpSent }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    store_name: '', owner_name: '', mobile: '', state: '', city: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const cities = form.state ? STATES_CITIES[form.state] || [] : [];

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (field === 'state') setForm(f => ({ ...f, state: e.target.value, city: '' }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await sendOtp(form);
      onOtpSent(form);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/40 outline-none focus:border-brand-gold/70 focus:bg-white/15 transition-all";
  const labelClass = "block text-white/60 text-xs font-medium mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className={labelClass}>{t('form.storeName')}</label>
        <input
          type="text"
          value={form.store_name}
          onChange={set('store_name')}
          placeholder="e.g. Sharma Cloth House"
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className={labelClass}>{t('form.ownerName')}</label>
        <input
          type="text"
          value={form.owner_name}
          onChange={set('owner_name')}
          placeholder="Your name"
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className={labelClass}>{t('form.mobile')}</label>
        <div className="flex gap-2">
          <span className="bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white/60 text-sm flex-shrink-0">
            +91
          </span>
          <input
            type="tel"
            value={form.mobile}
            onChange={set('mobile')}
            placeholder="10-digit number"
            maxLength={10}
            inputMode="numeric"
            className={inputClass}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass}>{t('form.state')}</label>
          <select
            value={form.state}
            onChange={set('state')}
            className={`${inputClass} appearance-none`}
            required
          >
            <option value="" className="bg-brand-navy">{t('form.selectState')}</option>
            {Object.keys(STATES_CITIES).sort().map(s => (
              <option key={s} value={s} className="bg-brand-navy">{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>{t('form.city')}</label>
          <select
            value={form.city}
            onChange={set('city')}
            className={`${inputClass} appearance-none`}
            required
            disabled={!form.state}
          >
            <option value="" className="bg-brand-navy">—</option>
            {cities.map(c => (
              <option key={c} value={c} className="bg-brand-navy">{c}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-red-300 text-xs">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-brand-gold text-brand-navy font-bold text-sm hover:bg-yellow-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
      >
        {loading ? 'Submitting…' : t('form.sendOtp')}
      </button>

      <p className="text-white/35 text-xs text-center">{t('form.privacy')}</p>
    </form>
  );
}
