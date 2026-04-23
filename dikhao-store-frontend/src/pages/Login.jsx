import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BilingualLabel } from '../components/BilingualLabel';
import { BilingualButton } from '../components/BilingualButton';
import { LanguageToggle } from '../components/LanguageToggle';
import { sendOtp } from '../api/auth';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(mobile)) {
      setError('Enter a valid 10-digit mobile. · 10 अंकों का सही नंबर डालें');
      return;
    }
    setLoading(true);
    try {
      const { data } = await sendOtp(mobile);
      navigate('/verify', { state: { mobile, dev_otp: data.dev_otp } });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/30 outline-none focus:border-brand-gold/70";

  return (
    <div className="min-h-screen bg-brand-navy px-4 py-6">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-10">
          <span className="font-heading font-bold text-white text-xl">Dikhao</span>
          <LanguageToggle />
        </div>

        <h1 className="font-heading font-bold text-white text-2xl mb-6">{t('login.title')}</h1>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <BilingualLabel enKey="login.mobile" hiKey="login.mobile" />
            <div className="flex gap-2">
              <span className="bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white/60 text-sm">+91</span>
              <input className={inputCls} type="tel" inputMode="numeric" maxLength={10} value={mobile} onChange={e => { setMobile(e.target.value); setError(''); }} placeholder="10-digit number" required />
            </div>
          </div>

          {error && <p className="text-red-300 text-xs">{error}</p>}

          <BilingualButton enKey="login.cta" hiKey="login.cta" type="submit" disabled={loading} loadingText={loading ? 'Sending…' : null} />
        </form>

        <p className="text-center text-white/50 text-xs mt-6">
          {t('login.noAccount')} <Link to="/signup" className="text-brand-gold font-semibold">{t('login.signup')}</Link>
        </p>
      </div>
    </div>
  );
}
