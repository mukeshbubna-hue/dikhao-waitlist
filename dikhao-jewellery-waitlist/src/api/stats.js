import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Returns { total, cities } via a Supabase RPC function that aggregates the
// waitlist without exposing individual rows.
export async function getWaitlistStats() {
  const { data, error } = await supabase.rpc('jewellery_waitlist_stats');
  if (error) {
    console.error('waitlist stats error', error.message);
    return null;
  }
  return data;
}
