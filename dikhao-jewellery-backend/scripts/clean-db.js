#!/usr/bin/env node
/**
 * One-shot: wipe all non-waitlist tables + storage buckets.
 * EXPLICITLY protects jewellery_waitlist.
 */
require('dotenv').config();
const supabase = require('../services/supabase');

const TABLES_TO_CLEAN = [
  // child-first order so FKs don't block us
  'jwl_shortlist_items',
  'jwl_shortlists',
  'jwl_tryon_sessions',
  'jwl_products',
  'tryon_sessions',
  'customers',
  'stores',
];

const BUCKETS_TO_CLEAN = ['permanent', 'results'];

const FORBIDDEN_TABLES = new Set(['jewellery_waitlist']);

async function emptyTable(name) {
  if (FORBIDDEN_TABLES.has(name)) {
    throw new Error(`SAFETY: refusing to touch ${name}`);
  }
  const { count: before } = await supabase.from(name).select('*', { count: 'exact', head: true });
  const { error } = await supabase.from(name).delete().not('id', 'is', null);
  if (error) {
    console.error(`  ❌ ${name}: ${error.message}`);
    return { before, after: null };
  }
  const { count: after } = await supabase.from(name).select('*', { count: 'exact', head: true });
  console.log(`  ✓ ${name}: ${before || 0} → ${after || 0}`);
  return { before, after };
}

async function emptyBucket(name) {
  const { data: files, error: listErr } = await supabase.storage.from(name).list('', {
    limit: 1000,
    offset: 0,
  });
  if (listErr) {
    console.error(`  ❌ ${name} list: ${listErr.message}`);
    return;
  }
  if (!files || files.length === 0) {
    console.log(`  ✓ ${name}: already empty`);
    return;
  }
  // Recurse into "folders" (Supabase lists prefix-only at root).
  const allPaths = [];
  for (const entry of files) {
    if (entry.metadata) {
      allPaths.push(entry.name);
    } else {
      // Treat as folder: list inside
      const { data: inner } = await supabase.storage.from(name).list(entry.name, { limit: 1000 });
      for (const f of (inner || [])) allPaths.push(`${entry.name}/${f.name}`);
    }
  }
  if (allPaths.length === 0) {
    console.log(`  ✓ ${name}: no files`);
    return;
  }
  const { error: delErr } = await supabase.storage.from(name).remove(allPaths);
  if (delErr) {
    console.error(`  ❌ ${name} delete: ${delErr.message}`);
    return;
  }
  console.log(`  ✓ ${name}: deleted ${allPaths.length} file(s)`);
}

async function main() {
  console.log('Cleaning tables...');
  for (const t of TABLES_TO_CLEAN) {
    await emptyTable(t);
  }

  console.log('\nCleaning storage buckets...');
  for (const b of BUCKETS_TO_CLEAN) {
    await emptyBucket(b);
  }

  // Sanity: confirm waitlist still has rows
  const { count } = await supabase
    .from('jewellery_waitlist')
    .select('*', { count: 'exact', head: true });
  console.log(`\njewellery_waitlist: ${count || 0} rows (untouched)`);

  console.log('\nDone.');
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
