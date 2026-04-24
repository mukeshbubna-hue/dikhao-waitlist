const express = require('express');
const multer  = require('multer');
const router  = express.Router();
const requireAuth = require('../middleware/auth');
const { verifyIsPerson } = require('../services/photoVerify');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } });

// POST /api/photo/verify-person  multipart: { photoFile }
// Returns { isHuman: boolean, reason: string }.
// Fail-open policy: if Gemini errors, return isHuman=true with a note so
// a network blip never blocks customer onboarding.
router.post('/verify-person', requireAuth, upload.single('photoFile'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'photoFile required' });
  const t0 = Date.now();
  try {
    const result = await verifyIsPerson(req.file.buffer, req.file.mimetype);
    console.log(`[verify-person] ${Date.now() - t0}ms isHuman=${result.isHuman} reason="${result.reason}"`);
    return res.json(result);
  } catch (err) {
    console.error(`[verify-person] failed (fail-open):`, err.message);
    return res.json({ isHuman: true, reason: 'verification unavailable — allowed' });
  }
});

module.exports = router;
