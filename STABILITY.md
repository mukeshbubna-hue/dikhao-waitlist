# Stability playbook

Short, opinionated rules so we stop reintroducing fixed bugs. Read this before
editing backend code or changing a prompt.

---

## Smoke scripts — run after every change

Two scripts, each idempotent and fast. Run both after any backend change,
and the waitlist one after any `dikhao-jewellery-waitlist/` change.

```bash
# Waitlist (tests Supabase RPC path — safe, costs nothing)
bash dikhao-jewellery-waitlist/scripts/smoke.sh

# Store app (tests API shape — costs nothing. Vertex/Gemini skipped by default)
bash dikhao-jewellery-backend/scripts/smoke.sh

# Store app — FULL run (exercises Vertex + Gemini; costs ~₹5 per run)
bash dikhao-jewellery-backend/scripts/smoke.sh --full
```

Exit code 0 = pass, 1 = fail. Pipe to `|| echo "SMOKE FAIL"` if you want a
loud banner.

### What each smoke covers

**Waitlist (5 checks, ~2s):**
1. Live page HTTPS 200
2. `jewellery_waitlist_stats` RPC returns `{total, cities}`
3. `submit_waitlist` RPC inserts a test row
4. Anon SELECT on the table returns `[]` (RLS still on)
5. Service-role cleanup removes the test row

**Store app — default mode (8 checks, ~5s):**
1. Backend `/health`
2. `POST /api/auth/send-otp`
3. `POST /api/auth/verify-otp` (creates a SMOKE test store)
4. `GET /api/catalogue` shape
5. `GET /api/customers/search`
6. `GET /api/shortlists/active` shape
7. `GET /api/tryon-jewellery/today` shape
8. `GET /api/rembg` on :7001

**Store app — `--full` (16 checks, ~60s, ~₹5):**
   Above, plus real catalogue upload (sync rembg), real customer registration
   (async Gemini kurta), real try-on, real shortlist add, real WhatsApp URL,
   real view page render, full cleanup.

---

## When a specific change, run a specific check

| What you changed | Smoke scripts | Extra |
|---|---|---|
| Any `routes/*.js` (backend) | `bash dikhao-jewellery-backend/scripts/smoke.sh` | — |
| `services/imageEdit.js` (prompts) | `--full` smoke | After deploy: `node scripts/redo-kurta.js` so existing customers re-dress |
| `services/backgroundRemoval.js` | — | `node scripts/redo-catalogue-bg.js` to reprocess any pending products |
| Anything in `dikhao-jewellery-waitlist/` | `bash dikhao-jewellery-waitlist/scripts/smoke.sh` | — |
| Supabase schema (DDL) | both smokes | Check RLS policies with `SELECT * FROM pg_policies WHERE tablename='…'` |
| Vertex / Gemini region | `--full` smoke | — |

---

## Cache dependencies (what to invalidate when what changes)

| Change in backend | Invalidates this cache | Fix command |
|---|---|---|
| `KURTA_PROMPT` in `services/imageEdit.js` | `customers.photo_clean_url` of every existing customer | `node dikhao-jewellery-backend/scripts/redo-kurta.js` |
| `ACCESSORY_PROMPTS[x]` in `services/imageEdit.js` | Nothing cached — each try-on re-renders | None |
| `jwl_tryon_sessions` `result_url` | Shortlist items referencing this URL | On re-heart, we UPDATE the item URL — covered in `shortlists.add-item` |
| rembg available / unavailable | Product photos uploaded during the outage | `node dikhao-jewellery-backend/scripts/redo-catalogue-bg.js` |
| Datafast `data-website-id` | Browser cache of the injected script tag | None server-side; users hard-refresh |

---

## Deploy flow (remember this order)

### Waitlist
1. Edit → `npm run build` → `vercel --prod --yes`
2. Then: `bash scripts/smoke.sh`

### Store app frontend
1. Edit → `npm run build` → `vercel --prod --yes`
2. Then open the deployed URL and do the 60-second manual flow

### Store backend
- Currently runs on Mac via `npm run dev` (nodemon) + ngrok tunnel
- **Nodemon will restart on every backend file save.** That kills any in-flight
  async work. The pipeline is now synchronous for bg-removal exactly to
  survive this, BUT `processCustomerBgCleanAsync` still fires-and-forgets for
  the kurta dressing. If you save a backend file during a new customer
  registration, re-run the redo script.

---

## Things that are OK even though they look weird

- Vertex VTON is still imported in `jewelleryTryOnPipeline.js` even though
  accessory categories never route to it. It's the fallback for an unknown
  category — essentially dead code that's kept as a safety net.
- Supabase column `shop_id` on `jwl_*` tables is the store's ID (not shop's).
  The store table uses `store_id` elsewhere. Inconsistent names, same meaning.
  Legacy from the original schema; don't "fix" without updating the pipeline.
- `dikhao-store-backend/` and `dikhao-store-frontend/` are the OLD clothing
  app. Untouched since the fork. Don't confuse with `dikhao-jewellery-*`.
- `buildWhatsAppUrl` used to exist in the frontend. Removed — the backend
  `POST /api/shortlists/:id/whatsapp` is the single source of truth for the
  message template. Don't reintroduce client-side message building.

---

## Git hygiene

Commit after every *verified* working change. One change per commit with a
descriptive message. If you break something, `git log` shows the offending
commit immediately and `git revert <sha>` undoes it.

Don't push to `origin/main` without human review — that remote is
`dikhao-waitlist.git`, the original repo, and the jewellery code is new.

---

## When the smoke fails — recovery order

1. Read the fail line closely. Most failures include a partial response body.
2. If the failure is auth-related, check backend logs for the most recent
   `[customers.post]` or `[shortlists.add-item]` line — they log entry + exit.
3. If Gemini is returning `GEMINI_TRYON_EMPTY: STOP`, it's a transient flake —
   the pipeline auto-retries. If it persists, the product image is likely
   unreadable (wrong orientation, transparent, etc.).
4. Before assuming the backend is broken, run `curl -s $BASE/health` — the
   most common cause of smoke failure is "backend is down / nodemon crashed".
5. Before assuming the frontend is broken, check the deployed bundle hash
   in the HTML — if it matches what you last built, the change IS live.
