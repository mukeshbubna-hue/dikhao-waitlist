import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BilingualLabel } from '../components/BilingualLabel';
import { BilingualButton } from '../components/BilingualButton';
import { LanguageToggle } from '../components/LanguageToggle';
import { STATES_CITIES } from '../data/states_cities';
import { sendOtp } from '../api/auth';

export default function Signup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ store_name: '', owner_name: '', mobile: '', state: '', city: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cities = form.state ? (STATES_CITIES[form.state] || []) : [];

  const set = (k) => (e) => {
    const v = e.target.value;
    setForm(f => (k === 'state' ? { ...f, state: v, city: '' } : { ...f, [k]: v }));
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(form.mobile)) {
      setError('Enter a valid 10-digit mobile. · 10 अंकों का सही नंबर डालें');
      return;
    }
    if (!form.store_name || !form.owner_name || !form.state || !form.city) {
      setError('All fields required. · सभी fields ज़रूरी हैं');
      return;
    }
    setLoading(true);
    try {
      const { data } = await sendOtp(form.mobile);
      navigate('/verify', { state: { ...form, dev_otp: data.dev_otp } });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-warm-white border border-plum/20 px-3 py-2.5 text-plum text-sm placeholder-plum/30 outline-none focus:border-plum focus:bg-ivory transition-colors font-body";
  const selectCls = `${inputCls} appearance-none pr-10`;
  const selectStyle = {
    backgroundImage: 'linear-gradient(45deg, transparent 50%, #3D0F1A 50%), linear-gradient(135deg, #3D0F1A 50%, transparent 50%)',
    backgroundPosition: 'calc(100% - 16px) 50%, calc(100% - 11px) 50%',
    backgroundSize: '5px 5px, 5px 5px',
    backgroundRepeat: 'no-repeat',
  };

  return (
    <div className="min-h-screen bg-ivory px-4 py-6">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-10">
          <span className="font-display text-plum text-[22px] tracking-tight">Dikhao</span>
          <LanguageToggle />
        </div>

        <h1 className="font-display text-plum text-[30px] leading-tight mb-1">{t('signup.title')}</h1>
        <p className="text-plum/60 text-sm mb-6 font-body">{t('signup.sub')}</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <BilingualLabel enKey="signup.storeName" hiKey="signup.storeName" />
            <input className={inputCls} value={form.store_name} onChange={set('store_name')} placeholder="Sharma Jewellers" required />
          </div>

          <div>
            <BilingualLabel enKey="signup.ownerName" hiKey="signup.ownerName" />
            <input className={inputCls} value={form.owner_name} onChange={set('owner_name')} placeholder="Your name" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-plum text-[11px] uppercase tracking-[0.2em] font-body mb-1.5">State</label>
              <select className={selectCls} style={selectStyle} value={form.state} onChange={set('state')} required>
                <option value="">Select state</option>
                {Object.keys(STATES_CITIES).sort().map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-plum text-[11px] uppercase tracking-[0.2em] font-body mb-1.5">City</label>
              <select className={selectCls} style={selectStyle} value={form.city} onChange={set('city')} disabled={!form.state} required>
                <option value="">Select city</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <BilingualLabel enKey="signup.mobile" hiKey="signup.mobile" />
            <div className="flex gap-2">
              <span className="bg-warm-white border border-plum/20 px-3 py-2.5 text-plum/60 text-sm font-body">+91</span>
              <input
                className={inputCls}
                type="tel" inputMode="numeric" maxLength={10}
                value={form.mobile} onChange={set('mobile')}
                placeholder="10-digit number" required
              />
            </div>
          </div>

          {error && <p className="text-red-800 text-xs font-body">{error}</p>}

          <BilingualButton
            type="submit"
            enKey="signup.cta"
            hiKey="signup.cta"
            disabled={loading}
            loadingText={loading ? 'Sending…' : null}
          />
        </form>

        <p className="text-center text-plum/60 text-xs mt-6 font-body">
          {t('signup.haveAccount')} <Link to="/login" className="text-plum font-medium underline">{t('signup.login')}</Link>
        </p>
      </div>
    </div>
  );
}
