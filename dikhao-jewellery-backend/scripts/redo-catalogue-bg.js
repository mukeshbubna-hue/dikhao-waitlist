#!/usr/bin/env node
// Re-run bg-removal for any jwl_products whose async bg-removal got cut short
// (usually because nodemon restarted mid-flight). Detects by updated_at == created_at.
require('dotenv').config();
const supabase = require('../services/supabase');
const { removeBackground } = require('../services/backgroundRemoval');
const { fetchImage, uploadToPermanent } = require('../services/supabaseStorage');

async function main() {
  const { data: products, error } = await supabase
    .from('jwl_products')
    .select('id, shop_id, category, photo_url, created_at, updated_at')
    .eq('active', true);

  if (error) throw new Error(error.message);

  const needsRedo = products.filter(p => {
    const c = new Date(p.created_at).getTime();
    const u = new Date(p.updated_at).getTime();
    return Math.abs(u - c) < 2000;  // bg-removal never bumped updated_at
  });

  console.log(`${products.length} total products, ${needsRedo.length} need re-processing.\n`);
  if (!needsRedo.length) { console.log('Nothing to do.'); return; }

  let ok = 0, fail = 0;
  for (const p of needsRedo) {
    const t0 = Date.now();
    try {
      const original = await fetchImage(p.photo_url);
      const clean    = await removeBackground(original);
      const cleanUrl = await uploadToPermanent(clean, p.shop_id, 'image/png');
      await supabase.from('jwl_products')
        .update({ photo_url: cleanUrl, updated_at: new Date().toISOString() })
        .eq('id', p.id);
      console.log(`  ✓ ${p.category} ${p.id.slice(0,8)} — ${Date.now() - t0}ms`);
      ok++;
    } catch (err) {
      console.error(`  ✗ ${p.category} ${p.id.slice(0,8)}: ${err.message}`);
      fail++;
    }
  }

  console.log(`\nDone: ${ok} ok, ${fail} failed.`);
}

main().then(() => process.exit(0)).catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
