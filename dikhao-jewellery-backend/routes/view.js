const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));
}

// ============================================================
// JEWELLERY SHORTLIST VIEW — shop-branded, ivory palette
// ============================================================

function buildShortlistPage({ shortlist, items, customer, store }) {
  const customerName = escapeHtml(customer?.name || '');
  const storeName    = escapeHtml(store?.store_name || 'Jewellers');
  const expiresAtMs  = new Date(shortlist.expires_at).getTime();

  const itemsHtml = items.map(it => `
    <div class="tile">
      <img class="tile-img" src="${escapeHtml(it.tryon_image_url)}" alt="try-on"/>
    </div>
  `).join('\n');

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${customerName}'s selections · ${storeName}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&family=Geist:wght@400;500&display=swap" rel="stylesheet"/>
<style>
  :root{
    --ivory:#F4EEE5; --warm:#FAF7F2; --plum:#3D0F1A; --plum-dim:#2A0810;
    --rose:#C8A28A; --rose-dim:#A68671; --ink:#1A1A1A; --ink-soft:#3D3D3D;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--ivory);font-family:'Geist',system-ui,sans-serif;color:var(--plum);}
  .wrap{max-width:720px;margin:0 auto;padding:32px 20px 64px;}
  header{text-align:center;border-bottom:1px solid rgba(61,15,26,0.12);padding-bottom:24px;margin-bottom:24px;}
  .eyebrow{font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:rgba(61,15,26,0.6);}
  .store{font-family:'Fraunces',Georgia,serif;font-size:28px;color:var(--plum);margin:4px 0 12px;letter-spacing:-0.02em;}
  .subline{font-size:14px;color:rgba(61,15,26,0.7);}
  .name{font-weight:500;color:var(--plum);}
  .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;}
  @media(min-width:640px){.grid{grid-template-columns:repeat(3,1fr);}}
  .tile{background:var(--warm);border:1px solid rgba(61,15,26,0.08);aspect-ratio:3/4;overflow:hidden;}
  .tile-img{width:100%;height:100%;object-fit:cover;display:block;}
  .countdown{background:var(--warm);border:1px solid rgba(200,162,138,0.4);padding:12px;margin:24px 0 0;text-align:center;font-size:12px;color:rgba(61,15,26,0.7);}
  .tip{font-size:12px;color:rgba(61,15,26,0.5);text-align:center;margin-top:24px;line-height:1.5;}
  footer{text-align:center;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(61,15,26,0.4);margin-top:40px;}
</style>
</head><body>
<div class="wrap">
  <header>
    <div class="eyebrow">${storeName}</div>
    <div class="store">${customerName}'s selections</div>
    <div class="subline">${items.length} ${items.length === 1 ? 'piece' : 'pieces'} · shortlisted with family in mind</div>
  </header>

  ${items.length === 0
    ? '<p style="text-align:center;color:rgba(61,15,26,0.6)">This shortlist is empty.</p>'
    : `<section class="grid">${itemsHtml}</section>`
  }

  <div class="countdown" id="countdown">Link expires in …</div>
  <p class="tip">
    Prices are shown in-store · दुकान पर पूछें<br/>
    To buy or ask about any piece, return to <b>${storeName}</b>
  </p>

  <footer>Made with Dikhao</footer>
</div>
<script>
  const exp = ${expiresAtMs};
  function tick(){
    const ms = exp - Date.now();
    if (ms <= 0) { document.getElementById('countdown').innerText = 'Link has expired · लिंक expire हो गया'; return; }
    const d = Math.floor(ms/86400000);
    const h = Math.floor((ms%86400000)/3600000);
    document.getElementById('countdown').innerText = 'Link expires in ' + d + ' day' + (d===1?'':'s') + ', ' + h + 'h';
  }
  tick(); setInterval(tick, 60_000);
</script>
</body></html>`;
}

function buildExpiredPage(storeName) {
  const s = escapeHtml(storeName || 'the store');
  return `<!doctype html>
<html><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Link expired</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&family=Geist:wght@400&display=swap" rel="stylesheet"/>
<style>
  body{margin:0;background:#F4EEE5;font-family:'Geist',system-ui,sans-serif;color:#3D0F1A;}
  .wrap{max-width:420px;margin:0 auto;padding:64px 24px;text-align:center;}
  h1{font-family:'Fraunces',Georgia,serif;font-size:28px;font-weight:500;margin-bottom:8px;letter-spacing:-0.02em;}
  p{color:rgba(61,15,26,0.7);font-size:14px;line-height:1.6;}
</style>
</head><body><div class="wrap">
  <h1>This link has expired</h1>
  <p>यह link expire हो गया</p>
  <p>Shortlists stay live for 5 days, then are removed automatically.<br/>
     5 दिन बाद लिंक हटा दिए जाते हैं।</p>
  <p style="margin-top:24px">Please visit ${s} to browse again.</p>
</div></body></html>`;
}

// GET /view/shortlist/:id
router.get('/shortlist/:id', async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const { data: shortlist } = await supabase
    .from('jwl_shortlists')
    .select('id, shop_id, customer_id, expires_at')
    .eq('id', req.params.id)
    .single();

  if (!shortlist) return res.status(404).send(buildExpiredPage());
  if (new Date() > new Date(shortlist.expires_at)) {
    const { data: store } = await supabase.from('stores').select('store_name').eq('id', shortlist.shop_id).single();
    return res.status(410).send(buildExpiredPage(store?.store_name));
  }

  // Mark as viewed on first open
  await supabase
    .from('jwl_shortlists')
    .update({ viewed_at: new Date().toISOString() })
    .eq('id', shortlist.id)
    .is('viewed_at', null);

  const [itemsRes, customerRes, storeRes] = await Promise.all([
    supabase
      .from('jwl_shortlist_items')
      .select('id, product_id, tryon_image_url, added_at')
      .eq('shortlist_id', shortlist.id)
      .order('added_at', { ascending: true }),
    supabase.from('customers').select('name').eq('id', shortlist.customer_id).single(),
    supabase.from('stores').select('store_name').eq('id', shortlist.shop_id).single(),
  ]);

  res.send(buildShortlistPage({
    shortlist,
    items: itemsRes.data || [],
    customer: customerRes.data,
    store: storeRes.data,
  }));
});

// ============================================================
// LEGACY: clothing try-on single-image share (kept for store app)
// ============================================================

function buildClothingViewPage(session) {
  const customerName = escapeHtml(session.customers?.name || '');
  const storeName    = escapeHtml(session.stores?.store_name || 'Dikhao');
  const resultUrl    = escapeHtml(session.result_url);
  const expiresAtMs  = new Date(session.expires_at).getTime();

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Your Try-On — ${storeName}</title>
<style>
  body{margin:0;background:#F7F5F2;font-family:system-ui,sans-serif;color:#1A1A2E;}
  .wrap{max-width:480px;margin:0 auto;padding:24px 16px 48px;}
  .logo{font-weight:700;font-size:22px;text-align:center;margin-bottom:16px;}
  .img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:16px;}
  .info{text-align:center;margin:16px 0;}
  .countdown{background:#FFF4E0;border:1px solid #E8A838;border-radius:12px;padding:12px;margin:16px 0;text-align:center;font-size:13px;}
</style>
</head><body><div class="wrap">
  <div class="logo">Dikhao</div>
  <img class="img" src="${resultUrl}" alt="Your try-on"/>
  <div class="info"><b>${customerName}</b><div>from ${storeName}</div></div>
  <div class="countdown" id="countdown">Link expires in …</div>
</div>
<script>
  const exp = ${expiresAtMs};
  function tick(){
    const ms = exp - Date.now();
    if (ms <= 0) { document.getElementById('countdown').innerText = 'Link has expired'; return; }
    const h = Math.floor(ms/3600000);
    document.getElementById('countdown').innerText = 'Link expires in ' + h + 'h';
  }
  tick(); setInterval(tick, 60_000);
</script>
</body></html>`;
}

// GET /view/:token (legacy clothing)
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
  res.send(buildClothingViewPage(data));
});

module.exports = router;
