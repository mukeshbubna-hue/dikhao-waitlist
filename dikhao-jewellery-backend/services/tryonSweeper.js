// Periodic sweeper: finds try-on sessions whose pipeline was killed mid-flight
// (usually by a nodemon restart or a Node process crash) and marks them as
// failed so the frontend stops polling forever.
//
// Triggers on: updated_at older than MAX_AGE_MS AND status in (queued, processing).
// Safe because the pipeline bumps updated_at when it transitions state — a
// healthy 55-second try-on never matches this filter; only orphans do.
const supabase = require('./supabase');

const SWEEP_INTERVAL_MS = Number(process.env.SWEEPER_INTERVAL_MS || 30_000);  // every 30s
const MAX_AGE_MS        = Number(process.env.SWEEPER_MAX_AGE_MS || 90_000);   // orphan after 90s

async function sweepStuckSessions() {
  const cutoffISO = new Date(Date.now() - MAX_AGE_MS).toISOString();
  const { data, error } = await supabase
    .from('jwl_tryon_sessions')
    .update({ status: 'failed', updated_at: new Date().toISOString() })
    .in('status', ['queued', 'processing'])
    .lt('updated_at', cutoffISO)
    .select('id, created_at');

  if (error) {
    console.error('[sweeper] sweep failed:', error.message);
    return;
  }
  if (data && data.length > 0) {
    const ids = data.map(r => `${r.id.slice(0, 8)} (${Math.round((Date.now() - new Date(r.created_at).getTime()) / 1000)}s old)`).join(', ');
    console.log(`[sweeper] marked ${data.length} orphaned session(s) failed: ${ids}`);
  }
}

function startSweeper() {
  // Run once immediately so a freshly-started process catches crashes from the previous run
  sweepStuckSessions();
  const handle = setInterval(sweepStuckSessions, SWEEP_INTERVAL_MS);
  console.log(`[sweeper] running every ${SWEEP_INTERVAL_MS / 1000}s, age threshold ${MAX_AGE_MS / 1000}s`);
  return handle;
}

module.exports = { startSweeper, sweepStuckSessions };
