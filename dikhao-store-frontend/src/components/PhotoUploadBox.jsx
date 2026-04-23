import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { checkPhotoQuality } from '../hooks/usePhotoQuality';
import { PHOTO_ERRORS } from '../constants/photoErrors';
import { PhotoTipsSheet } from './PhotoTipsSheet';
import { CameraCapture } from './CameraCapture';

const isMobile = typeof navigator !== 'undefined' &&
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// states: 'default' | 'checking' | 'passed' | 'failed'
export function PhotoUploadBox({ type, label, labelHi, required, onValidFile }) {
  const { t } = useTranslation();
  const fileInput = useRef(null);
  const [state, setState]   = useState('default');
  const [preview, setPreview] = useState(null);
  const [error, setError]   = useState(null);
  const [showTips, setShowTips]     = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const openCamera = () => {
    setShowTips(false);
    // On mobile, trigger native camera via file input (works without HTTPS).
    // On desktop, open in-browser camera (getUserMedia, webcam).
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

  const handleCapture = async (file) => {
    setShowCamera(false);
    setState('checking');
    setPreview(URL.createObjectURL(file));

    const result = await checkPhotoQuality(file, type);
    if (result.pass) {
      setState('passed');
      setError(null);
      onValidFile?.(file);
    } else {
      setState('failed');
      setError(result.reason);
      onValidFile?.(null);
    }
  };

  const retake = () => {
    setState('default');
    setPreview(null);
    setError(null);
    onValidFile?.(null);
  };

  const borderClass =
    state === 'passed'   ? 'border-2 border-status-green bg-status-green/5' :
    state === 'failed'   ? 'border-2 border-status-red bg-status-red/5' :
    state === 'checking' ? 'border-2 border-status-amber bg-white/[0.03]' :
                           'border border-dashed border-white/15 bg-white/[0.03]';

  const errObj = error ? PHOTO_ERRORS[error] : null;

  return (
    <div className={`rounded-2xl p-4 transition-all ${borderClass}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-white text-sm font-semibold">{label}</p>
          <p className="text-white/50 text-xs">{labelHi}</p>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
          ${required ? 'bg-brand-purple/30 text-brand-purple-mid' : 'bg-white/10 text-white/50'}`}>
          {required ? t('photos.required') : t('photos.optional')}
        </span>
      </div>

      {state === 'default' && (
        <button
          onClick={() => setShowTips(true)}
          className="w-full py-8 text-center text-white/40 hover:text-white/60 transition-colors"
        >
          <div className="text-3xl mb-2">📷</div>
          <div className="text-sm">{t('photos.tapToUpload')}</div>
        </button>
      )}

      {state === 'checking' && (
        <div className="py-6 text-center">
          <div className="inline-block w-6 h-6 border-2 border-status-amber border-t-transparent rounded-full animate-spin mb-2" />
          <div className="text-white/60 text-xs">{t('photos.checking')}</div>
        </div>
      )}

      {(state === 'passed' || state === 'failed') && preview && (
        <>
          <img src={preview} alt="preview" className="w-full h-40 object-cover rounded-lg mb-3" />
          {state === 'passed' && (
            <p className="text-status-green text-sm font-semibold">✓ {t('photos.looksGood')}</p>
          )}
          {state === 'failed' && errObj && (
            <div className="mb-3">
              <p className="text-status-red text-sm font-semibold">
                {errObj.icon} {errObj.en}
              </p>
              <p className="text-status-red/70 text-xs mt-0.5">{errObj.hi}</p>
            </div>
          )}
          <button
            onClick={retake}
            className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
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
