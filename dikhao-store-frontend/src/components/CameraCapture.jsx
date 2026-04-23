import { useEffect, useRef, useState } from 'react';

// Opens a live camera preview (desktop webcam or phone rear camera),
// lets the user capture a frame, and returns it as a File to onCapture.
export function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [facing, setFacing] = useState('environment'); // 'environment' | 'user'

  useEffect(() => {
    let cancelled = false;

    async function start() {
      setReady(false);
      setError('');
      try {
        stopStream();
        const constraints = {
          video: {
            facingMode: { ideal: facing },
            width:  { ideal: 1280 },
            height: { ideal: 1920 },
          },
          audio: false,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setReady(true);
      } catch (err) {
        console.error(err);
        setError(err.name === 'NotAllowedError'
          ? 'Camera permission denied. Allow access in your browser settings.'
          : 'Camera unavailable. Use the Upload from gallery option below.');
      }
    }

    start();
    return () => { cancelled = true; stopStream(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing]);

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      stopStream();
      onCapture(file);
    }, 'image/jpeg', 0.9);
  };

  const handleGalleryUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) { stopStream(); onCapture(file); }
  };

  const cancel = () => { stopStream(); onCancel(); };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-3 bg-black/80 text-white">
        <button onClick={cancel} className="text-sm px-3 py-1.5">✕ Cancel</button>
        <button
          onClick={() => setFacing(f => f === 'environment' ? 'user' : 'environment')}
          className="text-sm px-3 py-1.5 opacity-70 hover:opacity-100"
        >🔄 Flip</button>
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {error ? (
          <div className="text-center text-white/80 max-w-xs px-6">
            <p className="text-sm mb-4">{error}</p>
            <label className="block w-full py-3 rounded-xl bg-brand-gold text-brand-navy font-bold text-sm cursor-pointer">
              Upload from gallery
              <input type="file" accept="image/*" onChange={handleGalleryUpload} className="hidden" />
            </label>
          </div>
        ) : (
          <video
            ref={videoRef}
            className="max-w-full max-h-full object-contain"
            playsInline
            muted
            autoPlay
          />
        )}
      </div>

      <div className="p-5 bg-black/80 flex items-center justify-between gap-4">
        <label className="text-white/70 text-xs px-3 py-1.5 cursor-pointer">
          🖼 Gallery
          <input type="file" accept="image/*" onChange={handleGalleryUpload} className="hidden" />
        </label>
        <button
          onClick={capture}
          disabled={!ready}
          className={`w-16 h-16 rounded-full border-4 border-white flex items-center justify-center
            ${ready ? 'bg-white hover:scale-95 transition-transform' : 'bg-white/40'}`}
          aria-label="Capture photo"
        >
          <span className={`block w-12 h-12 rounded-full ${ready ? 'bg-white' : 'bg-white/60'}`} />
        </button>
        <span className="w-14" />
      </div>
    </div>
  );
}
