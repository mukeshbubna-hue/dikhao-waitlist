const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));
}

function buildViewPage(session) {
  const customerName = escapeHtml(session.customers?.name || '');
  const storeName    = escapeHtml(session.stores?.store_name || 'Dikhao');
  const resultUrl    = escapeHtml(session.result_url);
  const expiresAtMs  = new Date(session.expires_at).getTime();

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Your Try-On — ${storeName}</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  body{margin:0;background:#F7F5F2;font-family:Inter,system-ui,sans-serif;color:#1A1A2E;}
  .wrap{max-width:480px;margin:0 auto;padding:24px 16px 48px;}
  .logo{font-family:Poppins,sans-serif;font-weight:700;font-size:22px;text-align:center;margin-bottom:16px;}
  .img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.1);background:#eee;}
  .info{text-align:center;margin:16px 0;}
  .info .name{font-weight:600;font-size:18px;}
  .info .store{color:#666;font-size:14px;margin-top:4px;}
  .countdown{background:#FFF4E0;border:1px solid #E8A838;border-radius:12px;padding:12px;margin:16px 0;text-align:center;font-size:13px;color:#8a5a00;}
  .btn{display:block;width:100%;padding:14px;border-radius:12px;background:#E8A838;color:#1A1A2E;font-weight:700;text-align:center;text-decoration:none;margin-top:12px;border:0;font-size:15px;font-family:inherit;cursor:pointer;}
  .btn.wa{background:#25D366;color:white;}
  .tip{font-size:12px;color:#666;background:white;border:1px solid #eee;border-radius:10px;padding:12px;margin-top:16px;line-height:1.5;}
</style>
</head><body>
<div class="wrap">
  <div class="logo">Dikhao</div>
  <img class="img" src="${resultUrl}" alt="Your try-on"/>
  <div class="info">
    <div class="name">${customerName}</div>
    <div class="store">from ${storeName}</div>
  </div>
  <div class="countdown" id="countdown">Link expires in …</div>
  <a class="btn" href="${resultUrl}" download="dikhao-tryon.jpg">⬇ Download photo · फ़ोटो डाउनलोड करें</a>
  <a class="btn wa" href="https://wa.me/?text=${encodeURIComponent('See my try-on: ' + session.result_url)}" target="_blank">📲 Share with family · परिवार को भेजें</a>
  <div class="tip">
    <b>On iPhone:</b> press & hold the photo → Save to Photos<br/>
    iPhone पर: फ़ोटो को देर तक दबाएं → Photos में Save करें
  </div>
</div>
<script>
  const exp = ${expiresAtMs};
  function tick(){
    const ms = exp - Date.now();
    if (ms <= 0) { document.getElementById('countdown').innerText = 'Link has expired · लिंक expire हो गया'; return; }
    const h = Math.floor(ms/3600000);
    const m = Math.floor((ms%3600000)/60000);
    const s = Math.floor((ms%60000)/1000);
    document.getElementById('countdown').innerText = 'Link expires in ' + h + 'h ' + m + 'm ' + s + 's · ' + h + ' घंटे में expire होगा';
  }
  tick(); setInterval(tick, 1000);
</script>
</body></html>`;
}

function buildExpiredPage(storeName) {
  const s = escapeHtml(storeName || 'the store');
  return `<!doctype html>
<html><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Link expired</title>
<style>
  body{margin:0;background:#F7F5F2;font-family:system-ui,sans-serif;color:#1A1A2E;}
  .wrap{max-width:420px;margin:0 auto;padding:64px 24px;text-align:center;}
  h1{font-size:22px;margin-bottom:8px;}
  p{color:#666;font-size:14px;line-height:1.6;}
</style>
</head><body><div class="wrap">
  <h1>This link has expired</h1>
  <p>यह link expire हो गया</p>
  <p>Photos are deleted after 24 hours to protect your privacy.<br/>
     आपकी privacy के लिए तस्वीरें 24 घंटे बाद delete हो जाती हैं।</p>
  <p style="margin-top:24px">Contact ${s} to generate a new try-on.</p>
</div></body></html>`;
}

// GET /view/:token
router.get('/:token', async (req, res) => {
  const { data } = await supabase
    .from('tryon_sessions')
    .select('result_url, expires_at, share_token, customers(name), stores(store_name)')
    .eq('share_token', req.params.token)
    .single();

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (!data || !data.result_url || new Date() > new Date(data.expires_at)) {
    return res.send(buildExpiredPage(data?.stores?.store_name));
  }
  res.send(buildViewPage(data));
});

module.exports = router;
