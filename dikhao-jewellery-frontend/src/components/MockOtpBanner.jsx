export function MockOtpBanner({ otp }) {
  if (import.meta.env.VITE_MOCK_OTP !== 'true') return null;
  return (
    <div className="bg-amber-500/15 border border-amber-400/40 rounded-lg p-3 mb-4">
      <p className="text-amber-200 text-xs font-semibold mb-0.5">Demo mode — WhatsApp not connected</p>
      <p className="text-amber-100/80 text-xs">
        Your OTP is: <span className="font-mono font-bold text-white">{otp || '••••••'}</span>
      </p>
    </div>
  );
}
