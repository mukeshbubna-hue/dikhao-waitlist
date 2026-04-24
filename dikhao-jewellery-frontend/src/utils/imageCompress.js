// Downscale + recompress phone photos (4–8MB) to ~400–800KB so multipart
// uploads don't time out on free tunnels or spotty 4G.
export async function compressImage(file, maxSide = 1600, quality = 0.85) {
  if (!file) return file;
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
