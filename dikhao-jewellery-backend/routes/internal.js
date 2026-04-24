const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const { deleteFromResults } = require('../services/supabaseStorage');
const verifyCronSecret = require('../middleware/cron');

// POST /api/internal/cleanup  — deletes expired result images (cron only)
router.post('/cleanup', verifyCronSecret, async (req, res) => {
  const now = new Date().toISOString();

  const { data: expired } = await supabase
    .from('tryon_sessions')
    .select('id, result_url')
    .lt('expires_at', now)
    .not('result_url', 'is', null);

  if (!expired) return res.json({ deleted: 0 });

  for (const session of expired) {
    try {
      await deleteFromResults(session.result_url);
      await supabase.from('tryon_sessions')
        .update({ result_url: null, share_token: null })
        .eq('id', session.id);
    } catch (err) {
      console.error('cleanup failed for', session.id, err.message);
    }
  }

  res.json({ deleted: expired.length });
});

module.exports = router;
