const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const requireAuth = require('../middleware/auth');

// GET /api/plan/check → { allowed, customersRemaining, tryonsPerCustomer }
router.get('/check', requireAuth, async (req, res) => {
  const { data: store } = await supabase.from('stores').select('*').eq('id', req.store.id).single();
  const { data: planRow } = await supabase.from('plan_limits').select('*').eq('plan', store.plan).single();
  if (!planRow) return res.status(500).json({ error: 'Plan not configured.' });

  const customersRemaining = Math.max(0, planRow.customers_per_month - (store.customers_used || 0));
  const allowed = customersRemaining > 0 && new Date(store.plan_end_date) >= new Date();

  res.json({
    plan: store.plan,
    allowed,
    customersRemaining,
    tryonsPerCustomer: planRow.tryons_per_customer,
    planEndDate: store.plan_end_date,
  });
});

module.exports = router;
