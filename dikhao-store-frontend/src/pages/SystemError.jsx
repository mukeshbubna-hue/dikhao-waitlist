import { useNavigate, useParams } from 'react-router-dom';

export default function SystemError() {
  const navigate = useNavigate();
  const { sessionId } = useParams();

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-sm text-center">
        <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-3xl">⏳</div>

        <h1 className="font-heading font-bold text-white text-xl mb-2">Try-on failed</h1>
        <p className="text-white/50 text-sm mb-2">Try-on नहीं हो पाया</p>
        <p className="text-white/50 text-sm mb-6 leading-relaxed">
          Our AI service had a hiccup. Your photos look fine — this wasn't a photo problem.<br/>
          Try again in a few seconds.
        </p>

        <div className="space-y-2">
          <button
            onClick={() => navigate(`/dashboard/tryon/${sessionId}`, { replace: true })}
            className="w-full py-3 rounded-xl bg-brand-gold text-brand-navy font-bold text-sm hover:bg-yellow-400"
          >
            Retry · दोबारा कोशिश करें
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-2 rounded-xl border border-white/15 text-white/70 text-xs hover:bg-white/5"
          >
            Back to dashboard · डैशबोर्ड पर वापस
          </button>
        </div>

        <p className="mt-6 text-white/30 text-[11px]">Session: {sessionId?.slice(0, 8)}</p>
      </div>
    </div>
  );
}
