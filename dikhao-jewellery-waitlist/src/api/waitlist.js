import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Calls a SECURITY DEFINER function in Postgres. This bypasses RLS for the
// narrow purpose of writing one row, avoiding issues with anon-role policies
// on Supabase's newer sb_publishable_* key format.
export async function submitWaitlist({ store_name, owner_name, mobile, state, city }) {
  const { error } = await supabase.rpc('submit_waitlist', {
    p_store_name: store_name,
    p_owner_name: owner_name,
    p_mobile:     mobile,
    p_state:      state,
    p_city:       city,
  });
  if (error) throw error;
  return { success: true };
}
