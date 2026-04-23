import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BilingualLabel } from '../components/BilingualLabel';
import { BilingualButton } from '../components/BilingualButton';
import { LanguageToggle } from '../components/LanguageToggle';
import { sendOtp } from '../api/auth';

export default function Signup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ store_name: '', owner_name: '', mobile: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(form.mobile)) {
      setError('Enter a valid 10-digit mobile. · 10 अंकों का सही नंबर डालें');
      return;
    }
    if (!form.store_name || !form.owner_name) {
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

  const inputCls = "w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/30 outline-none focus:border-brand-gold/70 focus:bg-white/15 transition-all";

  return (
    <div className="min-h-screen bg-brand-navy px-4 py-6">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-10">
          <span className="font-heading font-bold text-white text-xl">Dikhao</span>
          <LanguageToggle />
        </div>

        <h1 className="font-heading font-bold text-white text-2xl mb-1">{t('signup.title')}</h1>
        <p className="text-white/50 text-sm mb-6">{t('signup.sub')}</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <BilingualLabel enKey="signup.storeName" hiKey="signup.storeName" />
            <input className={inputCls} value={form.store_name} onChange={set('store_name')} placeholder="Sharma Cloth House" required />
          </div>
          <div>
            <BilingualLabel enKey="signup.ownerName" hiKey="signup.ownerName" />
            <input className={inputCls} value={form.owner_name} onChange={set('owner_name')} placeholder="Your name" required />
          </div>
          <div>
            <BilingualLabel enKey="signup.mobile" hiKey="signup.mobile" />
            <div className="flex gap-2">
              <span className="bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white/60 text-sm">+91</span>
              <input
                className={inputCls}
                type="tel" inputMode="numeric" maxLength={10}
                value={form.mobile} onChange={set('mobile')}
                placeholder="10-digit number" required
              />
            </div>
          </div>

          {error && <p className="text-red-300 text-xs">{error}</p>}

          <BilingualButton
            type="submit"
            enKey="signup.cta"
            hiKey="signup.cta"
            disabled={loading}
            loadingText={loading ? 'Sending…' : null}
          />
        </form>

        <p className="text-center text-white/50 text-xs mt-6">
          {t('signup.haveAccount')} <Link to="/login" className="text-brand-gold font-semibold">{t('signup.login')}</Link>
        </p>
      </div>
    </div>
  );
}
