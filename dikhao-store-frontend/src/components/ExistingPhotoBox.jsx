import { useState } from 'react';
import { PhotoUploadBox } from './PhotoUploadBox';

// Shown for a returning customer when we already have their full-length photo.
// Default state: preview existing photo with ✓ + "Update" button.
// If user taps Update, swaps to the normal PhotoUploadBox so they can retake.
export function ExistingPhotoBox({ photoUrl, label, labelHi, onValidFile }) {
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

  return (
    <div className="rounded-2xl p-4 border-2 border-status-green bg-status-green/5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-white text-sm font-semibold">{label}</p>
          <p className="text-white/50 text-xs">{labelHi}</p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-purple/30 text-brand-purple-mid">
          Saved
        </span>
      </div>

      <img src={photoUrl} alt="Existing customer photo" className="w-full h-40 object-cover rounded-lg mb-3" />

      <p className="text-status-green text-sm font-semibold mb-3">
        ✓ Using saved photo · पुरानी फ़ोटो इस्तेमाल
      </p>

      <button
        onClick={() => setUpdating(true)}
        className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
      >
        Update photo · फ़ोटो बदलें
      </button>
    </div>
  );
}
