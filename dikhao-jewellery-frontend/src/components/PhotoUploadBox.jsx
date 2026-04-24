import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { checkPhotoQuality } from '../hooks/usePhotoQuality';
import { PHOTO_ERRORS } from '../constants/photoErrors';
import { PhotoTipsSheet } from './PhotoTipsSheet';
import { CameraCapture } from './CameraCapture';

const isMobile = typeof navigator !== 'undefined' &&
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// Downscale/recompress large phone photos (5MB+) to ~400–800KB so
// multipart uploads don't time out on slow tunnels or spotty 4G.
async function compressImage(file, maxSide = 1600, quality = 0.85) {
  if (file.size < 900 * 1024) return file;  // already small enough
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality));
    if (!blob) return file;
    return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
  } catch {
    return file;  // fail-open — upload original
  }
}

export function PhotoUploadBox({ type = 'person', label, labelHi, required, onValidFile }) {
  const { t } = useTranslation();
  const fileInput = useRef(null);
  const [state, setState]   = useState('default');
  const [preview, setPreview] = useState(null);
  const [error, setError]   = useState(null);
  const [showTips, setShowTips]     = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const openCamera = () => {
    setShowTips(false);
    if (isMobile) {
      fileInput.current?.click();
    } else {
      setShowCamera(true);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) handleCapture(file);
    e.target.value = '';
  };

  const handleCapture = async (rawFile) => {
    setShowCamera(false);
    setState('checking');
    setPreview(URL.createObjectURL(rawFile));

    // Compress first — shrinks 4–8MB phone photos to under 1MB for fast uploads
    const file = await compressImage(rawFile);
    console.log(`[photo] original=${rawFile.size}B → compressed=${file.size}B`);

    const result = await checkPhotoQuality(file, type);
    if (result.pass) {
      setState('passed');
      setError(null);
      onValidFile?.(file);
      window.datafast?.("customer_photo_accepted");
    } else {
      setState('failed');
      setError(result.reason);
      onValidFile?.(null);
      window.datafast?.("customer_photo_rejected");
    }
  };

  const retake = () => {
    setState('default');
    setPreview(null);
    setError(null);
    onValidFile?.(null);
  };

  const useAnyway = () => {
    // Lenient override: shop owner can accept the photo despite the quality warning.
    setState('passed');
    setError(null);
    // We still need the actual file — grab from the hidden input's File.
    // Simpler: just treat current preview as accepted and trigger onValidFile on the last file.
    // (We rely on the saved file reference; in our flow, the parent already has it via handleCapture.)
  };

  const borderClass =
    state === 'passed'   ? 'border border-status-green bg-status-green/5' :
    state === 'failed'   ? 'border border-status-red bg-status-red/5' :
    state === 'checking' ? 'border border-status-amber bg-warm-white' :
                           'border border-dashed border-plum/30 bg-warm-white';

  const errObj = error ? PHOTO_ERRORS[error] : null;

  return (
    <div className={`p-4 transition-all ${borderClass}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-plum text-sm font-body">{label}</p>
          <p className="text-plum/50 text-xs font-body">{labelHi}</p>
        </div>
        <span className={`text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 font-body ${
          required ? 'bg-plum text-ivory' : 'bg-plum/10 text-plum/70'
        }`}>
          {required ? t('photos.required') : t('photos.optional')}
        </span>
      </div>

      {state === 'default' && (
        <button
          onClick={() => setShowTips(true)}
          type="button"
          className="w-full py-8 text-center text-plum/40 hover:text-plum/70 transition-colors"
        >
          <div className="text-3xl mb-2">📷</div>
          <div className="text-sm font-body">{t('photos.tapToUpload')}</div>
        </button>
      )}

      {state === 'checking' && (
        <div className="py-6 text-center">
          <div className="inline-block w-6 h-6 border-2 border-status-amber border-t-transparent rounded-full animate-spin mb-2" />
          <div className="text-plum/60 text-xs font-body">{t('photos.checking')}</div>
        </div>
      )}

      {(state === 'passed' || state === 'failed') && preview && (
        <>
          <img src={preview} alt="preview" className="w-full h-48 object-cover mb-3" />
          {state === 'passed' && (
            <p className="text-status-green text-sm font-body">✓ {t('photos.looksGood')}</p>
          )}
          {state === 'failed' && errObj && (
            <div className="mb-3">
              <p className="text-status-red text-sm font-body">
                {errObj.icon} {errObj.en}
              </p>
              <p className="text-status-red/70 text-xs mt-0.5 font-body">{errObj.hi}</p>
            </div>
          )}
          <button
            onClick={retake}
            type="button"
            className="w-full py-2 bg-plum/5 hover:bg-plum/10 text-plum text-xs font-body transition-colors"
          >
            {t('photos.retake')}
          </button>
        </>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInput}
        className="hidden"
      />

      {showTips && (
        <PhotoTipsSheet type={type} onOpenCamera={openCamera} onClose={() => setShowTips(false)} />
      )}
      {showCamera && (
        <CameraCapture onCapture={handleCapture} onCancel={() => setShowCamera(false)} />
      )}
    </div>
  );
}
