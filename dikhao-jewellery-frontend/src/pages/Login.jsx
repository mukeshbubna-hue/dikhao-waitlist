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

  const inputCls = "w-full bg-warm-white border border-plum/20 px-3 py-2.5 text-plum text-sm placeholder-plum/30 outline-none focus:border-plum focus:bg-ivory transition-colors font-body";

  return (
    <div className="min-h-screen bg-ivory px-4 py-6">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-10">
          <span className="font-display text-plum text-[22px] tracking-tight">Dikhao</span>
          <LanguageToggle />
        </div>

        <h1 className="font-display text-plum text-[30px] leading-tight mb-6">{t('login.title')}</h1>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <BilingualLabel enKey="login.mobile" hiKey="login.mobile" />
            <div className="flex gap-2">
              <span className="bg-warm-white border border-plum/20 px-3 py-2.5 text-plum/60 text-sm font-body">+91</span>
              <input className={inputCls} type="tel" inputMode="numeric" maxLength={10} value={mobile} onChange={e => { setMobile(e.target.value); setError(''); }} placeholder="10-digit number" required />
            </div>
          </div>

          {error && <p className="text-red-800 text-xs font-body">{error}</p>}

          <BilingualButton enKey="login.cta" hiKey="login.cta" type="submit" disabled={loading} loadingText={loading ? 'Sending…' : null} />
        </form>

        <p className="text-center text-plum/60 text-xs mt-6 font-body">
          {t('login.noAccount')} <Link to="/signup" className="text-plum font-medium underline">{t('login.signup')}</Link>
        </p>
      </div>
    </div>
  );
}
