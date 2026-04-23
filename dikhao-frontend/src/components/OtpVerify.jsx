import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { verifyOtp, resendOtp } from '../api/waitlist';

export default function OtpVerify({ mobile, onSuccess, onBack }) {
  const { t } = useTranslation();
  const [digits, setDigits] = useState(['','','','','','']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { setCanResend(true); clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const otp = digits.join('');
    if (otp.length < 6) return;
    setLoading(true);
    setError('');
    try {
      await verifyOtp(mobile, otp);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Incorrect OTP. Please try again.');
      setDigits(['','','','','','']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    await resendOtp(mobile);
    setTimer(60);
    setCanResend(false);
    setDigits(['','','','','','']);
    inputRefs.current[0]?.focus();
  };

  const filled = digits.filter(Boolean).length;
  const isReady = filled === 6;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 mb-4 text-white/60 hover:text-white text-sm transition-colors">
        ← {t('otp.back')}
      </button>

      <p className="font-heading font-bold text-white text-lg mb-1">{t('otp.title')}</p>
      <p className="text-white/60 text-xs mb-4 leading-relaxed">
        {t('otp.sub').replace('{mobile}', `+91 ${mobile}`)}
      </p>

      <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-3 flex gap-2 mb-5">
        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 0.5C2.5 0.5 0.5 2.5 0.5 5c0 .8.2 1.5.5 2.2L.5 9.5l2.4-.5C3.5 9.3 4.2 9.5 5 9.5c2.5 0 4.5-2 4.5-4.5S7.5.5 5 .5z" fill="white"/>
          </svg>
        </div>
        <p className="text-white/75 text-xs leading-relaxed">{t('otp.whatsappNote')}</p>
      </div>

      <div className="flex gap-2 justify-center mb-2" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => inputRefs.current[i] = el}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            className={`w-10 h-12 text-center text-xl font-bold text-white rounded-lg border-2 bg-white/10 outline-none transition-all
              ${d ? 'border-white/50 bg-white/[0.18]' : i === filled ? 'border-brand-gold bg-brand-gold/15' : 'border-white/20'}`}
          />
        ))}
      </div>

      <p className="text-white/40 text-xs text-center mb-4">
        {isReady ? t('otp.hintFilled') : `${filled} of 6 digits entered`}
      </p>

      {error && <p className="text-red-300 text-xs text-center mb-3">{error}</p>}

      <div className="text-center text-xs text-white/40 mb-3">
        {canResend ? (
          <button onClick={handleResend} className="text-brand-gold font-semibold hover:text-yellow-300 transition-colors">
            {t('otp.resendNow')}
          </button>
        ) : (
          <span>{t('otp.resendIn')} 00:{String(timer).padStart(2,'0')}</span>
        )}
      </div>

      <button
        onClick={handleVerify}
        disabled={!isReady || loading}
        className={`w-full py-3 rounded-xl text-sm font-bold transition-all
          ${isReady && !loading
            ? 'bg-brand-gold text-brand-navy hover:bg-yellow-400 cursor-pointer'
            : 'bg-white/10 text-white/30 cursor-not-allowed border border-white/10'}`}
      >
        {loading ? 'Verifying…' : t('otp.verify')}
      </button>
    </div>
  );
}
