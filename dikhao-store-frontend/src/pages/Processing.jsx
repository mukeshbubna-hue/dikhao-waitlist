import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getStatus } from '../api/tryon';
import { usePolling } from '../hooks/usePolling';

const EXPECTED_SECONDS = 45;
const PATIENCE_SECONDS = 90;

const STEPS = [
  { key: 'upload', en: 'Photos uploaded',         hi: 'फ़ोटो अपलोड हुई' },
  { key: 'bg',     en: 'Cleaning up photos',      hi: 'फ़ोटो साफ़ हो रही है' },
  { key: 'ai',     en: 'AI generating your look', hi: 'AI तस्वीर बना रही है' },
  { key: 'ready',  en: 'Ready to send',           hi: 'भेजने के लिए तैयार' },
];

function mmss(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Processing() {
  const { t } = useTranslation();
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [startedAt, setStartedAt] = useState(Date.now());
  const [now, setNow]             = useState(Date.now());
  const [status, setStatus]       = useState('pending');
  const [pollError, setPollError] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  usePolling(async () => {
    try {
      const { data } = await getStatus(sessionId);
      setPollError(false);
      if (data.createdAt) setStartedAt(new Date(data.createdAt).getTime());
      setStatus(data.status);

      if (data.status === 'done') {
        navigate(`/dashboard/tryon/${sessionId}/result`, { replace: true });
        return { stop: true };
      }
      if (data.status === 'photo_error') {
        navigate(`/dashboard/tryon/${sessionId}/photo-error`, { replace: true });
        return { stop: true };
      }
      if (data.status === 'failed') {
        navigate(`/dashboard/tryon/${sessionId}/failed`, { replace: true });
        return { stop: true };
      }
    } catch {
      setPollError(true);
    }
  }, 2500);

  const elapsedSec = Math.floor((now - startedAt) / 1000);
  const pct = Math.min(95, Math.round((elapsedSec / EXPECTED_SECONDS) * 100));

  let currentStep;
  if (status === 'pending')  currentStep = 1;
  else if (elapsedSec < 8)   currentStep = 1;
  else if (elapsedSec < 18)  currentStep = 2;
  else                       currentStep = 3;

  const takingLonger = elapsedSec > PATIENCE_SECONDS;

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md text-center">

        <div className="mb-6">
          <div className="font-heading font-bold text-white text-6xl tabular-nums tracking-tight">
            {mmss(elapsedSec)}
          </div>
          <p className="text-white/40 text-xs mt-2 uppercase tracking-wider">Elapsed · समय</p>
        </div>

        <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-brand-gold transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-white/50 text-xs mb-8">
          Usually done in ~{EXPECTED_SECONDS} seconds · लगभग {EXPECTED_SECONDS} सेकंड में
        </p>

        <ul className="space-y-3 text-left">
          {STEPS.map((s, i) => {
            const idx = i + 1;
            const done   = idx < currentStep;
            const active = idx === currentStep;
            return (
              <li key={s.key} className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${done   ? 'bg-status-green text-white' :
                    active ? 'bg-status-amber text-brand-navy' :
                            'bg-white/10 text-white/30'}`}>
                  {done ? '✓' : idx}
                </span>
                <div className="min-w-0">
                  <div className={`text-sm ${done || active ? 'text-white' : 'text-white/40'}`}>
                    {s.en}
                    {active && <span className="inline-block w-1 h-1 bg-status-amber rounded-full ml-2 animate-pulse" />}
                  </div>
                  <div className="text-white/40 text-xs">{s.hi}</div>
                </div>
              </li>
            );
          })}
        </ul>

        {takingLonger && (
          <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white/60">
            Taking a bit longer than usual. Hang tight — we're still working on it.<br/>
            थोड़ा वक्त लग रहा है। रुकें — हम काम कर रहे हैं।
          </div>
        )}

        {pollError && (
          <p className="mt-4 text-white/40 text-xs">Reconnecting…</p>
        )}
      </div>
    </div>
  );
}
