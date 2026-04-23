// Client-side photo quality validator — runs before upload
// type: 'person' | 'cloth'
// Uses createImageBitmap with imageOrientation: 'from-image' so EXIF
// rotation from iPhone / Android cameras is applied correctly.
export async function checkPhotoQuality(file, type) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // Older browsers — fall back to Image load
    bitmap = await loadViaImage(file);
  }

  const w = bitmap.width;
  const h = bitmap.height;

  // Downscale to speed up pixel analysis — keeps aspect ratio
  const maxSide = 800;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const cw = Math.max(1, Math.floor(w * scale));
  const ch = Math.max(1, Math.floor(h * scale));

  const canvas = document.createElement('canvas');
  canvas.width  = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, cw, ch);
  const data = ctx.getImageData(0, 0, cw, ch).data;

  // --- Brightness ---
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    total += data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
  }
  const avg = total / (data.length / 4);
  if (avg < 30)  return { pass: false, reason: 'too_dark' };
  if (avg > 225) return { pass: false, reason: 'too_bright' };

  // --- Min resolution ---
  const minSide = type === 'person' ? 400 : 300;
  if (Math.min(w, h) < minSide) return { pass: false, reason: 'too_small' };

  // --- Blur: downsized Laplacian variance ---
  const gray = new Float32Array(cw * ch);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    gray[j] = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
  }
  let diffSum = 0;
  for (let y = 1; y < ch - 1; y++) {
    for (let x = 1; x < cw - 1; x++) {
      const idx = y * cw + x;
      const lap = Math.abs(
        -gray[idx-cw-1] - gray[idx-cw] - gray[idx-cw+1]
        - gray[idx-1] + 8*gray[idx] - gray[idx+1]
        - gray[idx+cw-1] - gray[idx+cw] - gray[idx+cw+1]
      );
      diffSum += lap;
    }
  }
  const blurScore = diffSum / (cw * ch);
  if (blurScore < 3) return { pass: false, reason: 'blurry' };

  // --- Aspect ratio (person only) ---
  // Phone portrait photos should be taller than wide.
  // We check on the corrected dimensions from createImageBitmap.
  if (type === 'person') {
    const ratio = h / w;
    if (ratio < 1.1) return { pass: false, reason: 'not_full_length' };
  }

  return { pass: true };
}

function loadViaImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload  = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}
