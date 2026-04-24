import { useState } from 'react';
import { PhotoUploadBox } from './PhotoUploadBox';

// Shown when phone lookup returns an existing customer.
// Renders BOTH the original photo and the cleaned version side-by-side,
// so the salesperson can confirm which one the try-on will use.
export function ExistingPhotoBox({ original, cleaned, label, labelHi, onValidFile }) {
  const [updating, setUpdating] = useState(false);

  if (updating) {
    return (
      <PhotoUploadBox
        type="person"
        label={label}
        labelHi={labelHi}
        required
        onValidFile={onValidFile}
      />
    );
  }

  const hasCleaned = !!cleaned && cleaned !== original;

  return (
    <div className="p-4 border border-status-green bg-status-green/5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-plum text-sm font-body">{label}</p>
          <p className="text-plum/50 text-xs font-body">{labelHi}</p>
        </div>
        <span className="text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 bg-rose-gold/30 text-plum font-body">
          Saved
        </span>
      </div>

      <div className={`grid ${hasCleaned ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mb-3`}>
        <div>
          <img src={original} alt="Original" className="w-full h-44 object-cover bg-warm-white border border-plum/10" />
          <p className="text-[10px] uppercase tracking-[0.15em] text-plum/60 font-body mt-1">Original · मूल</p>
        </div>
        {hasCleaned && (
          <div>
            <img src={cleaned} alt="Cleaned" className="w-full h-44 object-contain bg-warm-white border border-plum/10" />
            <p className="text-[10px] uppercase tracking-[0.15em] text-rose-gold-dim font-body mt-1">✨ Cleaned · साफ़</p>
          </div>
        )}
      </div>

      <p className="text-status-green text-sm font-body mb-3">
        ✓ {hasCleaned ? 'Using cleaned version for try-ons' : 'Using saved photo — cleaning still pending'}
      </p>

      <button
        onClick={() => setUpdating(true)}
        type="button"
        className="w-full py-2 bg-plum/5 hover:bg-plum/10 text-plum text-xs font-body transition-colors"
      >
        Take new photo · नई फ़ोटो लें
      </button>
    </div>
  );
}
