#!/bin/bash
# Waitlist smoke test — verifies the full public path works end-to-end.
# Run: bash scripts/smoke.sh
#
# Exits 0 if all critical paths pass, 1 on any failure. Tests against the
# live Supabase project via the public anon key (safe, same as the browser).
set -euo pipefail

SUPA="${SUPABASE_URL:-https://ihvwswqrjhkjxhmttvza.supabase.co}"
KEY="${SUPABASE_ANON_KEY:-sb_publishable_ewURndyoGW0AnfWNL5rgpg_S3yl7-iJ}"
TEST_MOBILE="9999000011"

pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1"; FAILED=1; }
FAILED=0

echo "=== Waitlist smoke ==="
echo

# 1. Page loads
echo "1. Live waitlist page"
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://dikhao-jewellery-waitlist.vercel.app/)
[[ "$CODE" == "200" ]] && pass "https://dikhao-jewellery-waitlist.vercel.app/ -> HTTP 200" || fail "HTTP $CODE"

# 2. Stats RPC
echo
echo "2. jewellery_waitlist_stats RPC"
STATS=$(curl -s -X POST "$SUPA/rest/v1/rpc/jewellery_waitlist_stats" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" -d '{}')
if echo "$STATS" | grep -qE '"total"\s*:\s*[0-9]+'; then
  pass "stats returned: $STATS"
else
  fail "stats malformed: $STATS"
fi

# 3. Submit RPC (what the form calls)
echo
echo "3. submit_waitlist RPC"
SUBMIT=$(curl -s -X POST "$SUPA/rest/v1/rpc/submit_waitlist" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d "{\"p_store_name\":\"__SMOKE_TEST\",\"p_owner_name\":\"Smoke\",\"p_mobile\":\"$TEST_MOBILE\",\"p_state\":\"Karnataka\",\"p_city\":\"Bengaluru\"}")
if echo "$SUBMIT" | grep -q '"success"\s*:\s*true'; then
  pass "submit returned: $SUBMIT"
else
  fail "submit failed: $SUBMIT"
fi

# 4. Direct table read is blocked (RLS)
echo
echo "4. Anon SELECT is blocked (privacy check)"
ROWS=$(curl -s "$SUPA/rest/v1/jewellery_waitlist?select=mobile&limit=5" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY")
if [[ "$ROWS" == "[]" ]]; then
  pass "SELECT returns [] via anon key (RLS working)"
else
  fail "SELECT leaked rows: $ROWS"
fi

# 5. Cleanup test row via service role (needs backend .env)
echo
echo "5. Cleanup test row"
BE_ENV="$(dirname "$0")/../../dikhao-jewellery-backend/.env"
if [[ -f "$BE_ENV" ]]; then
  (cd "$(dirname "$0")/../../dikhao-jewellery-backend" && node -e "
    require('dotenv').config();
    const s = require('./services/supabase');
    (async () => {
      const { count } = await s.from('jewellery_waitlist').delete({ count:'exact' }).eq('mobile', '$TEST_MOBILE');
      console.log('  ✓ deleted', count, 'test row(s)');
    })();
  " 2>&1)
else
  echo "  ⚠ skipped (backend .env not found — test row $TEST_MOBILE may remain)"
fi

echo
if [[ "$FAILED" -eq 0 ]]; then
  echo "✓ Waitlist smoke PASSED"
  exit 0
else
  echo "✗ Waitlist smoke FAILED"
  exit 1
fi
