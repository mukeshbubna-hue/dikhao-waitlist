#!/usr/bin/env node
// Delete a customer + their try-ons + shortlists + storage files.
// Usage: node scripts/delete-customer.js <mobile>
require('dotenv').config();
const supabase = require('../services/supabase');

const mobile = process.argv[2];
if (!mobile) { console.error('Usage: node scripts/delete-customer.js <mobile>'); process.exit(1); }

function filePathFromPublicUrl(url) {
  // Supabase public URL shape: https://xxx.supabase.co/storage/v1/object/public/<bucket>/<path>
  const m = url?.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  return m ? { bucket: m[1], path: m[2] } : null;
}

async function main() {
  const { data: customer } = await supabase
    .from('customers').select('*').eq('mobile', mobile).maybeSingle();
  if (!customer) { console.log(`No customer with mobile ${mobile}`); return; }
  console.log(`Found: ${customer.name} (${customer.id})`);

  // Gather storage paths to delete
  const toDelete = {};
  for (const url of [customer.photo_url, customer.photo_clean_url].filter(Boolean)) {
    const f = filePathFromPublicUrl(url);
    if (f) (toDelete[f.bucket] ||= []).push(f.path);
  }

  // Try-on results
  const { data: sessions } = await supabase
    .from('jwl_tryon_sessions').select('id, result_url').eq('customer_id', customer.id);
  for (const s of sessions || []) {
    if (s.result_url) {
      const f = filePathFromPublicUrl(s.result_url);
      if (f) (toDelete[f.bucket] ||= []).push(f.path);
    }
  }

  // Shortlists + items (items cascade from shortlists via FK)
  const { data: shortlists } = await supabase
    .from('jwl_shortlists').select('id').eq('customer_id', customer.id);
  const shortlistIds = (shortlists || []).map(s => s.id);

  console.log(`→ ${sessions?.length || 0} try-on sessions`);
  console.log(`→ ${shortlistIds.length} shortlists`);

  if (shortlistIds.length) {
    await supabase.from('jwl_shortlist_items').delete().in('shortlist_id', shortlistIds);
    await supabase.from('jwl_shortlists').delete().eq('customer_id', customer.id);
  }
  await supabase.from('jwl_tryon_sessions').delete().eq('customer_id', customer.id);
  await supabase.from('customers').delete().eq('id', customer.id);

  // Delete storage files
  for (const [bucket, paths] of Object.entries(toDelete)) {
    if (!paths.length) continue;
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) console.error(`  ✗ ${bucket}: ${error.message}`);
    else      console.log(`  ✓ ${bucket}: deleted ${paths.length} file(s)`);
  }

  console.log('\nDone.');
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
