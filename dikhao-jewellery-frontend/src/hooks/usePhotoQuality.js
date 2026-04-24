// Client-side photo quality validator — runs before upload.
// Lenient checks for jewellery bust-shots: brightness, resolution, blur.
// Aspect-ratio check intentionally dropped — bust shots can be portrait or near-square.
// Uses createImageBitmap with imageOrientation: 'from-image' so EXIF
// rotation from iPhone / Android cameras is applied correctly.
export async function checkPhotoQuality(file /* type ignored — kept for API compatibility */) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    bitmap = await loadViaImage(file);
  }

  const w = bitmap.width;
  const h = bitmap.height;

  // Downscale to speed up pixel analysis
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

  // Brightness
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    total += data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
  }
  const avg = total / (data.length / 4);
  if (avg < 25)  return { pass: false, reason: 'too_dark' };
  if (avg > 230) return { pass: false, reason: 'too_bright' };

  // Min resolution — at least 400px on the short side
  if (Math.min(w, h) < 400) return { pass: false, reason: 'too_small' };

  // Blur: Laplacian variance on the downscaled grayscale
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
  if (blurScore < 2) return { pass: false, reason: 'blurry' };

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
