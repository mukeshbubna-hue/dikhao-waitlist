import { useEffect, useRef, useState } from 'react';

export function OtpInput({ onChange, onComplete, autoFocus = true }) {
  const [digits, setDigits] = useState(['','','','','','']);
  const refs = useRef([]);

  useEffect(() => { if (autoFocus) refs.current[0]?.focus(); }, [autoFocus]);

  useEffect(() => {
    onChange?.(digits.join(''));
    if (digits.every(d => d)) onComplete?.(digits.join(''));
  }, [digits]); // eslint-disable-line

  const handleChange = (i, v) => {
    if (!/^\d*$/.test(v)) return;
    const next = [...digits];
    next[i] = v.slice(-1);
    setDigits(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (p.length === 6) {
      setDigits(p.split(''));
      refs.current[5]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => refs.current[i] = el}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          className={`w-11 h-13 py-3 text-center text-xl font-bold text-white rounded-lg border-2 bg-white/10 outline-none transition-all
            ${d ? 'border-white/50' : 'border-white/20 focus:border-brand-gold'}`}
        />
      ))}
    </div>
  );
}
