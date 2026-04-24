#!/usr/bin/env node
// Re-process every existing customer through Gemini kurta dressing.
// Safe to re-run — writes the new clean URL over the old one in customers.photo_clean_url.
require('dotenv').config();
const supabase = require('../services/supabase');
const { fetchImage, uploadToPermanent } = require('../services/supabaseStorage');
const { dressInKurta } = require('../services/imageEdit');

async function main() {
  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, store_id, name, photo_url')
    .not('photo_url', 'is', null);

  if (error) throw new Error(error.message);

  console.log(`Found ${customers.length} customer(s) with photos. Re-processing through Gemini...\n`);

  let ok = 0, fail = 0;
  for (const c of customers) {
    const t0 = Date.now();
    try {
      const original = await fetchImage(c.photo_url);
      const dressed  = await dressInKurta(original, 'image/jpeg');
      const cleanUrl = await uploadToPermanent(dressed, c.store_id, 'image/png');
      await supabase.from('customers').update({ photo_clean_url: cleanUrl }).eq('id', c.id);
      console.log(`  ✓ ${c.name || c.id} — ${Date.now() - t0}ms`);
      ok++;
    } catch (err) {
      console.error(`  ✗ ${c.name || c.id}: ${err.message}`);
      fail++;
    }
  }

  console.log(`\nDone: ${ok} ok, ${fail} failed.`);
}

main().then(() => process.exit(0)).catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
