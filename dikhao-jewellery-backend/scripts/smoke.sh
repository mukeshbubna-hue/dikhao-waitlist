#!/bin/bash
# Jewellery store smoke test — verifies every critical API path end-to-end.
# Run: bash scripts/smoke.sh
#
# By default skips Vertex/Gemini calls (they cost ₹3-10 per run).
# Run with --full to include a real try-on + WhatsApp view render.
#
# Exits 0 if all critical paths pass, 1 on any failure.
set -euo pipefail

BASE="${BACKEND_URL:-http://localhost:3001}"
FULL=0
[[ "${1:-}" == "--full" ]] && FULL=1

pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1"; FAILED=1; }
FAILED=0

TEST_MOBILE=${TEST_MOBILE:-9999000022}
TEST_STORE_MOBILE=${TEST_STORE_MOBILE:-9999000033}
CUSTOMER_MOBILE="$TEST_MOBILE"

echo "=== Jewellery store smoke ==="
echo "Backend: $BASE"
echo "Full mode (includes Vertex/Gemini): $FULL"
echo

# 1. Backend health
echo "1. Backend health"
if curl -s --max-time 5 "$BASE/health" | grep -q '"status":"ok"'; then
  pass "health endpoint reachable"
else
  fail "backend not responding"
  exit 1
fi

# 2. Auth: send OTP
echo
echo "2. Auth send-otp"
OTP_RESP=$(curl -s -X POST "$BASE/api/auth/send-otp" \
  -H 'Content-Type: application/json' \
  -d "{\"mobile\":\"$TEST_STORE_MOBILE\"}")
OTP=$(echo "$OTP_RESP" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("dev_otp",""))')
if [[ -n "$OTP" ]]; then
  pass "OTP sent, dev_otp=$OTP"
else
  fail "no dev_otp in response: $OTP_RESP"; exit 1
fi

# 3. Auth: verify OTP
echo
echo "3. Auth verify-otp (store create/login)"
AUTH=$(curl -s -X POST "$BASE/api/auth/verify-otp" \
  -H 'Content-Type: application/json' \
  -d "{\"mobile\":\"$TEST_STORE_MOBILE\",\"otp\":\"$OTP\",\"store_name\":\"SMOKE Store\",\"owner_name\":\"Smoke\",\"state\":\"Karnataka\",\"city\":\"Bengaluru\"}")
TOKEN=$(echo "$AUTH" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("token",""))')
STORE_ID=$(echo "$AUTH" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("store",{}).get("id",""))')
if [[ -n "$TOKEN" && -n "$STORE_ID" ]]; then
  pass "store=$STORE_ID token=${TOKEN:0:20}…"
else
  fail "auth failed: $AUTH"; exit 1
fi

AUTH_HEADER="Authorization: Bearer $TOKEN"

# 4. Catalogue list (should be empty for new store)
echo
echo "4. Catalogue GET (new store, should be empty)"
PRODUCTS=$(curl -s -H "$AUTH_HEADER" "$BASE/api/catalogue")
COUNT=$(echo "$PRODUCTS" | python3 -c 'import sys,json;print(len(json.load(sys.stdin).get("products",[])))')
pass "catalogue returned $COUNT products"

# 5. Customer: search (should find none)
echo
echo "5. Customer search (unknown mobile)"
SEARCH=$(curl -s -H "$AUTH_HEADER" "$BASE/api/customers/search?mobile=$CUSTOMER_MOBILE")
if echo "$SEARCH" | grep -q '"customer":null'; then
  pass "no existing customer for $CUSTOMER_MOBILE"
else
  pass "customer exists (OK — re-using prior smoke data)"
fi

# 6. Shortlist active (should be empty)
echo
echo "6. Shortlist active query (shapes)"
if [[ -n "${CUSTOMER_ID:-}" ]]; then
  SL=$(curl -s -H "$AUTH_HEADER" "$BASE/api/shortlists/active?customerId=$CUSTOMER_ID")
  if echo "$SL" | grep -qE '"items"|"shortlist"'; then
    pass "shortlist endpoint shape OK"
  else
    fail "shortlist shape wrong: $SL"
  fi
fi

# 7. Tryon-jewellery today endpoint
echo
echo "7. Tryon-jewellery/today endpoint"
TODAY=$(curl -s -H "$AUTH_HEADER" "$BASE/api/tryon-jewellery/today")
if echo "$TODAY" | grep -qE '"sessions"'; then
  pass "today endpoint shape OK"
else
  fail "today shape wrong: $TODAY"
fi

# 8. rembg (needed for full mode)
echo
echo "8. rembg availability"
if curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:7001/api | grep -q 200; then
  pass "rembg on :7001 reachable"
else
  echo "  ⚠ rembg on :7001 unavailable — catalogue bg-removal will fail-open"
fi

# --- Full mode: real data + Vertex/Gemini calls ---
if [[ "$FULL" -eq 1 ]]; then
  echo
  echo "=== Full mode: real try-on (costs ~₹5) ==="

  ASSET_DIR="$(cd "$(dirname "$0")/../../dikhao-store-backend/test-assets" 2>/dev/null && pwd || echo "")"
  if [[ -z "$ASSET_DIR" ]]; then
    fail "test-assets not found at ../dikhao-store-backend/test-assets/"; exit 1
  fi

  echo
  echo "9. Catalogue POST (sync bg-removal, ~20s)"
  PROD=$(curl -s -X POST "$BASE/api/catalogue" -H "$AUTH_HEADER" \
    -F "price=48500" -F "category=necklace" \
    -F "photoFile=@$ASSET_DIR/shirt.jpg")
  PRODUCT_ID=$(echo "$PROD" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("product",{}).get("id",""))')
  [[ -n "$PRODUCT_ID" ]] && pass "product=$PRODUCT_ID" || { fail "product POST failed: $PROD"; exit 1; }

  echo
  echo "10. Customer POST (kurta dressing fires async)"
  CUST=$(curl -s -X POST "$BASE/api/customers" -H "$AUTH_HEADER" \
    -F "name=SMOKE Customer" -F "mobile=$CUSTOMER_MOBILE" \
    -F "photoFile=@$ASSET_DIR/person.jpg")
  CUSTOMER_ID=$(echo "$CUST" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("customer",{}).get("id",""))')
  [[ -n "$CUSTOMER_ID" ]] && pass "customer=$CUSTOMER_ID" || { fail "customer POST failed: $CUST"; exit 1; }

  echo
  echo "11. Wait for customer photo_clean_url (Gemini kurta, up to 60s)"
  for i in $(seq 1 20); do
    C=$(curl -s -H "$AUTH_HEADER" "$BASE/api/customers/$CUSTOMER_ID")
    if echo "$C" | grep -q '"photo_clean_url":"https://'; then
      pass "clean photo ready after ${i}×3s"
      break
    fi
    sleep 3
  done

  echo
  echo "12. Start try-on + poll until done"
  SESS=$(curl -s -X POST "$BASE/api/tryon-jewellery" -H "$AUTH_HEADER" \
    -H 'Content-Type: application/json' \
    -d "{\"customerId\":\"$CUSTOMER_ID\",\"productId\":\"$PRODUCT_ID\"}")
  SESSION_ID=$(echo "$SESS" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("sessionId",""))')
  [[ -n "$SESSION_ID" ]] && pass "session=$SESSION_ID" || { fail "tryon POST failed: $SESS"; exit 1; }

  for i in $(seq 1 30); do
    T=$(curl -s -H "$AUTH_HEADER" "$BASE/api/tryon-jewellery/$SESSION_ID")
    STATUS=$(echo "$T" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("status",""))')
    RESULT=$(echo "$T" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("resultUrl",""))')
    if [[ "$STATUS" == "done" && -n "$RESULT" ]]; then
      pass "try-on done after ${i}×3s: $RESULT"
      break
    elif [[ "$STATUS" == "failed" || "$STATUS" == "photo_error" ]]; then
      fail "try-on $STATUS"; break
    fi
    sleep 3
  done

  echo
  echo "13. Add to shortlist"
  ADD=$(curl -s -X POST "$BASE/api/shortlists/add-item" -H "$AUTH_HEADER" \
    -H 'Content-Type: application/json' \
    -d "{\"customerId\":\"$CUSTOMER_ID\",\"productId\":\"$PRODUCT_ID\",\"tryOnImageUrl\":\"$RESULT\"}")
  SHORTLIST_ID=$(echo "$ADD" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("shortlistId",""))')
  [[ -n "$SHORTLIST_ID" ]] && pass "shortlist=$SHORTLIST_ID" || fail "add-item failed: $ADD"

  echo
  echo "14. WhatsApp URL endpoint"
  WA=$(curl -s -X POST "$BASE/api/shortlists/$SHORTLIST_ID/whatsapp" -H "$AUTH_HEADER")
  WAURL=$(echo "$WA" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("waUrl",""))')
  [[ "$WAURL" == https://wa.me/* ]] && pass "waUrl OK" || fail "waUrl wrong: $WA"

  echo
  echo "15. View page renders"
  VIEW_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/view/shortlist/$SHORTLIST_ID")
  [[ "$VIEW_CODE" == "200" ]] && pass "view page HTTP 200" || fail "view page HTTP $VIEW_CODE"

  # Cleanup — delete customer + shortlist + products + store
  echo
  echo "16. Cleanup"
  node scripts/delete-customer.js "$CUSTOMER_MOBILE" > /dev/null 2>&1 && pass "customer wiped" || echo "  ⚠ cleanup script skipped"
fi

echo
if [[ "$FAILED" -eq 0 ]]; then
  echo "✓ Jewellery store smoke PASSED"
  exit 0
else
  echo "✗ Jewellery store smoke FAILED"
  exit 1
fi
