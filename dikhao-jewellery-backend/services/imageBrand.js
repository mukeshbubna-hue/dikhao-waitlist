const sharp = require('sharp');

// Composites a small "Dikhao" brand mark onto the top-right corner of a rendered
// try-on image. Positioned in the background area — away from face, neck (where
// necklaces sit), and ears (where earrings sit).
async function addBrand(imageBuffer) {
  try {
    const meta = await sharp(imageBuffer).metadata();
    const imgW = meta.width || 0;
    const imgH = meta.height || 0;
    if (!imgW || !imgH) return imageBuffer;

    // Logo ~13% of image width, aspect 260:72
    const logoW = Math.max(160, Math.round(imgW * 0.13));
    const logoH = Math.round(logoW * (72 / 260));
    const fontSize = Math.round(logoH * 0.45);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${logoW}" height="${logoH}">
      <rect width="100%" height="100%" x="0" y="0" fill="rgba(244,238,229,0.90)" rx="6" ry="6"/>
      <text x="50%" y="${Math.round(logoH * 0.68)}"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="${fontSize}" fill="#3D0F1A"
        text-anchor="middle" font-weight="600" letter-spacing="1">Dikhao</text>
    </svg>`;

    const margin = Math.round(imgW * 0.025);  // ~2.5% of width
    const left = imgW - logoW - margin;
    const top = margin;

    return await sharp(imageBuffer)
      .composite([{ input: Buffer.from(svg), top, left }])
      .jpeg({ quality: 90 })
      .toBuffer();
  } catch (err) {
    console.error('[imageBrand] failed, returning original:', err.message);
    return imageBuffer;
  }
}

module.exports = { addBrand };
