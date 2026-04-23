import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { OtpInput } from '../components/OtpInput';
import { BilingualButton } from '../components/BilingualButton';
import { MockOtpBanner } from '../components/MockOtpBanner';
import { LanguageToggle } from '../components/LanguageToggle';
import { sendOtp, verifyOtp } from '../api/auth';
import { useAuth } from '../hooks/useAuth';

export default function Verify() {
  const { t } = useTranslation();
  const loc = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const { mobile, store_name, owner_name, dev_otp: initialOtp } = loc.state || {};
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState(initialOtp || '');

  useEffect(() => {
    if (!mobile) navigate('/signup', { replace: true });
  }, [mobile, navigate]);

  useEffect(() => {
    const id = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { setCanResend(true); clearInterval(id); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await verifyOtp(mobile, otp, { store_name, owner_name });
      login(data.token, data.store);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      const { data } = await sendOtp(mobile);
      setDevOtp(data.dev_otp || '');
      setTimer(60);
      setCanResend(false);
    } catch {
      setError('Could not resend OTP.');
    }
  };

  if (!mobile) return null;

  return (
    <div className="min-h-screen bg-brand-navy px-4 py-6">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-10">
          <button onClick={() => navigate(-1)} className="text-white/60 hover:text-white text-sm">← {t('common.back')}</button>
          <LanguageToggle />
        </div>

        <h1 className="font-heading font-bold text-white text-2xl mb-1">{t('verify.title')}</h1>
        <p className="text-white/50 text-sm mb-5">{t('verify.sub').replace('{mobile}', `+91 ${mobile}`)}</p>

        {import.meta.env.VITE_MOCK_OTP === 'true' && <MockOtpBanner otp={devOtp} />}

        <div className="mb-4">
          <OtpInput onChange={setOtp} onComplete={() => {}} />
        </div>

        {error && <p className="text-red-300 text-xs text-center mb-3">{error}</p>}

        <div className="text-center mb-4 text-xs text-white/40">
          {canResend ? (
            <button onClick={handleResend} className="text-brand-gold font-semibold">{t('verify.resend')}</button>
          ) : (
            <span>{t('verify.resendIn')} 00:{String(timer).padStart(2, '0')}</span>
          )}
        </div>

        <BilingualButton
          enKey="verify.cta"
          hiKey="verify.cta"
          onClick={handleVerify}
          disabled={otp.length !== 6 || loading}
          loadingText={loading ? 'Verifying…' : null}
        />
      </div>
    </div>
  );
}
