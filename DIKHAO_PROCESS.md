# Dikhao — Step-by-Step Process for Each Module

Last updated: 2026-04-24

Conventions:
- **UI step** = what the user sees / does
- **System** = what the backend / AI does under the hood
- **Data** = what gets stored and where

---

## Module 1 · Waitlist (public landing page)

**Who:** prospective jewellery shop owners (B2B lead capture).
**URL:** https://dikhao-jewellery-waitlist.vercel.app (live, deployed on Vercel)

1. **UI:** visitor lands on marketing page. Reads value prop. Clicks **"Join the waitlist"**.
2. **UI:** form opens with fields — store name, owner name, WhatsApp number, state (dropdown), city (dropdown filtered by state).
3. **UI:** submits → success screen: *"You're on the list. We'll WhatsApp you the moment we open a pilot slot in your city."*
4. **System:** client-side POST to Supabase `jewellery_waitlist` table using the anon key.
5. **Data:** one row in `jewellery_waitlist` with all fields + `verified:true` + timestamp.
6. **Analytics:** Datafast tracks pageview + `signup` conversion event.

**Notes:** duplicate mobile is silently treated as success (upsert via `onConflict: 'mobile'`).

---

## Module 2 · Store Signup / Login

**Who:** shop owner creating or returning to their Dikhao account.

### First-time signup
1. **UI:** visits app → lands on `/login`. Taps *"Create account"* → `/signup`.
2. **UI:** fills store name, owner name, state, city, 10-digit mobile. Taps *"Send OTP on WhatsApp"*.
3. **System:** `POST /api/auth/send-otp` → generates a 6-digit OTP, stores it in DB with 10-min expiry. In demo mode (`MOCK_OTP=true`) the OTP is returned in the response and shown in a banner on screen.
4. **UI:** `/verify` page shows the OTP banner. User enters the 6 digits in the OtpInput widget.
5. **System:** `POST /api/auth/verify-otp` → if OTP matches, creates a row in `stores` (mobile, store_name, owner_name, state, city). Returns a JWT token + store object.
6. **UI:** token saved to `localStorage`. User lands on `/dashboard`.

### Returning login
1. Same flow, but on verify the existing store row is fetched — no new row created.

**Data:** `stores` table. JWT token in browser `localStorage.dikhao_token`.

---

## Module 3 · Catalogue Admin (shop owner uploads pieces)

**Who:** shop owner managing their jewellery inventory.

1. **UI:** Sidebar → **💎 Catalogue**. Admin page loads: add-piece form at top, existing-pieces grid below.
2. **UI:** taps the photo box → device gallery / camera opens → picks the piece photo.
3. **UI:** selects **category** (6 options: Necklace / Earrings / Choker / Pendant / Borla·Tikka / Nath). A **category-specific photo tip** appears — tells shop owner how to frame that category for best try-on results.
4. **UI:** types **price** in ₹. Taps **"Add piece"** button.
5. **System:** `POST /api/catalogue` (multipart). Original photo uploaded to Supabase Storage bucket `permanent` under `{store_id}/{uuid}.jpg`. Row inserted in `jwl_products`.
6. **UI:** button flips to *"Saving…"*. Returns in ~1 second. Form resets. New tile appears in grid immediately with the original photo.
7. **System (async):** background-removal via local rembg server (`http://localhost:7001/api/remove`). Produces a transparent PNG. Re-uploads as the piece's photo_url.
8. **UI:** 10s after add, the page auto-refetches. The grid tile now shows the clean cut-out version.

**Data:** `jwl_products` table; files in `permanent/` bucket.

**Filters baked in:** API accepts `?category=` and `?priceBand=` for filtering.

---

## Module 4 · Customer Onboarding

**Who:** shop salesperson seating a walk-in customer.

1. **UI:** Sidebar → **Customer Onboarding**. Form appears with phone + name.
2. **UI:** salesperson types customer's **10-digit mobile**. As the 10th digit is entered:
   - **System:** `GET /api/customers/search?mobile=X` fires.
   - If **found** → page flips to *"✨ Returning customer · Welcome back"*. Name prefilled. "Saved photo" panel shows two tiles side-by-side: **Original** + **✨ Cleaned** (the kurta-dressed version used for try-ons).
   - If **not found** → page stays on *"New customer · Register"*. Salesperson types name.
3. **UI (new customer only):** Inline photo guidelines displayed in a cream card:
   - ✓ Wear a plain white full-sleeve kurta
   - ✓ Face, neck, shoulders AND both ears visible
   - ✓ Hair behind the ears
   - ✓ Remove any jewellery on neck and ears
   - ✓ Plain background, even lighting
   - ✓ Looking straight at the camera
4. **UI:** taps camera button → native camera opens → takes bust shot.
5. **System (client-side):** image compressed in browser to max 1600px JPEG q=85 (4–8MB phone photo → ~400KB). Quality checks run (brightness, blur, resolution — lenient thresholds).
6. **UI:** shows preview with ✓ green checkmark + "Retake" option. Taps **"Start browsing →"**.
7. **System:** `POST /api/customers` (multipart). Original uploaded to `permanent/`. Row upserted in `customers`. Returns in ~1 second.
8. **System (async, fires after response):** `processCustomerBgCleanAsync()`:
    - **Primary path:** Gemini 2.5 Flash Image ("Nano Banana") — one call replaces her clothing with a white kurta and cleans the background to cream.
    - **Fallback:** if Gemini fails → local rembg (bg only, no kurta change).
    - Result stored as `customers.photo_clean_url`.
9. **UI:** frontend navigates to catalogue. Customer starts browsing immediately.

**Data:** `customers` table (mobile unique per `store_id`); files in `permanent/`.

**Cost per customer:** ~₹3–4 (one Gemini image call, cached forever).

---

## Module 5 · Catalogue Browsing (customer-facing)

**Who:** customer, using the tablet that the salesperson hands over.

1. **UI:** page shows shop brand (top-left) + customer name (below) + filter context (top-right).
2. **UI:** bottom sticky banner shows status:
   - Until `photo_clean_url` is set: *"Preparing your photo... browse meanwhile"* with a rose-gold spinner.
   - Once set: *"✨ Ready — tap any piece to try it on"*.
3. **System:** frontend polls `GET /api/customers/:id` every 3s (and once on mount) until `photo_clean_url` appears.
4. **UI:** **two horizontal chip rows:**
    - Row 1 — price bands: All / Under ₹25k / ₹25k–75k / ₹75k–2L / ₹2L–5L / ₹5L+
    - Row 2 — categories: All / Necklace / Earrings / Choker / Pendant / Borla / Nath
    - Active chip uses **plum** for price, **rose-gold** for category.
5. **UI:** responsive grid (2 cols mobile, 3 tablet, 4 desktop) with just product photos — no prices, no spec text visible.
6. **System:** grid refetches `GET /api/catalogue?category=X&priceBand=Y` on every chip change.
7. **UI:** customer filters, scrolls, taps a tile → module 6.

**Notes:** Tapping before `photo_clean_url` is set shows *"Photo is still being prepared — try again in a few seconds"* with no navigation.

---

## Module 6 · Try-On (per piece)

**Who:** triggered when customer taps a tile in the grid.

1. **UI:** tile visibly compresses (plum border, scale 0.97). Immediate navigation to `/dashboard/jewellery-tryon/:sessionId`.
2. **System:** `POST /api/tryon-jewellery` with `{ customerId, productId }` → inserts row in `jwl_tryon_sessions` with `status='queued'` → responds immediately with `{ sessionId }`.
3. **System (async pipeline):** `processJewelleryTryOn(sessionId)` fires:
    - Fetches session + related customer + product (category).
    - Logs show: `related fetched (person pre-cleaned: true, category: X)`.
    - Fetches both images (parallel).
    - If customer not yet pre-cleaned → falls back to inline rembg.
    - **Routes by category:**
      - **Vertex VTON** (clothing-origin model, handles garment-like items) → **Necklace, Choker, Pendant**.
      - **Gemini 2.5 Flash Image** (text-prompted edit with purpose-built placement prompts) → **Earrings, Borla/Tikka, Nath**.
    - Result uploaded to `results/{session_id}.jpg` with 5-day expiry.
    - `jwl_tryon_sessions` row updated to `status='done'`, `result_url=...`.
4. **UI:** polls `GET /api/tryon-jewellery/:sessionId` every 2.5s.
   - While `queued`/`processing`: big mm:ss timer counting up, rose-gold progress bar, *"Creating her look · तस्वीर बन रही है"*. After 90s shows gentle *"Taking a bit longer…"* copy.
   - On `done`: flips to result screen showing the rendered image full-width + two buttons below.
   - On `failed` / `photo_error`: gentle error + "Back to catalogue".

**Time per try-on:**
- Vertex path (necklace etc.): ~20–30s including fetch + vertex + upload.
- Gemini path (earrings etc.): ~15–25s.

**Cost per try-on:**
- Vertex path: ~₹10–15.
- Gemini path: ~₹3–4.

---

## Module 7 · Shortlist + WhatsApp Share

**Who:** customer during her session, then salesperson when she's done.

### Hearting pieces
1. **UI:** on try-on result screen, taps **"♡ Add to your list · शॉर्टलिस्ट करें"**.
2. **System:** `POST /api/shortlists/add-item` with customer + product + try-on image URL. Backend finds (or creates) her active shortlist (5-day expiry) and adds the item.
3. **System:** cap enforced at **7 pieces**. 8th add returns 409 with `{ maxed: true }`.
4. **UI:** button flips to *"✓ Added to your list"*.
5. **UI:** customer taps **"← Try another piece"** → back to catalogue grid. Grid's bottom bar now shows *"1 piece shortlisted"* + **"Send on WhatsApp →"** button.

### Sending the shortlist
1. **UI:** salesperson (with tablet in hand) taps **"Send on WhatsApp →"**.
2. **System:** `POST /api/shortlists/:id/whatsapp` → builds a wa.me URL with a pre-filled message:
   > *"Hi {name}! Here are your selections from {store} — view, share with family, and come by when ready. {link}"*
3. **UI:** salesperson's WhatsApp app opens with the message typed out. Just hits send. Goes from the **shop's own WhatsApp number** — no API integration.
4. **Customer receives** the link on her WhatsApp.

### Viewing the shortlist page (customer / family)
1. **UI:** tap the link in WhatsApp. Shop-branded page opens (ivory palette, Fraunces + Geist fonts):
   - Header: *"{Shop Name}"* + *"{Customer Name}'s selections"*
   - Grid of rendered try-on images (her wearing each piece)
   - **No prices** (by design — prices are shown in-store)
   - Countdown: *"Link expires in 4 days, 23h"*
2. **System:** first open stamps `jwl_shortlists.viewed_at`. Link auto-expires at `expires_at` and shows a polite "expired" page afterwards.

**Data:** `jwl_shortlists` + `jwl_shortlist_items` tables.

---

## Module 8 · Dashboard (shop owner's home)

**Who:** shop owner; first screen after login.

1. **UI:** greeting: *"Namaste, {first name} 👋"*.
2. **UI:** Plan card (plan tier, customers used vs limit, days left in trial).
3. **UI:** Two tall CTAs side by side:
    - **Customer Onboarding** (plum background) → Module 4.
    - **Manage Catalogue** (warm-white) → Module 3.
4. **UI:** **"Today's try-ons · आज के try-ons"** — list of all jewellery try-on sessions from today.
    - Each row: thumbnail of rendered try-on (or customer initials while processing), customer name, mobile, time-ago, status pill (*Done · तैयार* / *Processing · बन रहा* / *Photo error · फ़ोटो*).
    - Tap a row → opens the try-on result (if done) or routes back to onboarding (if photo_error).
5. **System:** `GET /api/tryon-jewellery/today` filters `jwl_tryon_sessions` by store + today's date.

---

## Module 9 · Customers List

**Who:** shop owner looking up past customers.

1. **UI:** Sidebar → **👥 Customers**. Page shows searchable list.
2. **UI:** search box filters live by **name OR mobile**.
3. **UI:** each row — photo (cleaned version), name, mobile, "first visit" timestamp, an arrow on the right.
4. **UI:** tap a row → navigates to Customer Onboarding with her mobile prefilled (triggers the returning-customer state, auto-fills name, shows saved photo, ready to continue to catalogue).
5. **System:** `GET /api/customers` returns all customers for this store, newest first.

---

## Background & Infra (not user-facing)

- **rembg server** — Python HTTP server on localhost:7001 running the u²-net segmentation model. Serves background-removal calls from catalogue uploads + fallback for customer registration.
- **Cloudflare tunnels** — `cloudflared tunnel --protocol http2` exposes local backend (3001) and frontend (5173) with public HTTPS URLs for demo/testing from anywhere.
- **Vercel (waitlist only)** — `dikhao-jewellery-waitlist` is permanently deployed; the store app is still running locally + tunneled.
- **Supabase** — single project, all tables: `stores`, `customers`, `jewellery_waitlist`, `jwl_products`, `jwl_tryon_sessions`, `jwl_shortlists`, `jwl_shortlist_items`, plus legacy clothing `tryon_sessions`. Buckets: `permanent` (originals + product photos), `results` (rendered try-ons, 5-day TTL).

---

## Maintenance scripts

All in `dikhao-jewellery-backend/scripts/`:

- `clean-db.js` — wipe ALL non-waitlist data (tables + storage). For fresh demo runs.
- `redo-kurta.js` — re-process every existing customer through Gemini kurta dressing. Needed once after deploying a new dressing prompt.
- `delete-customer.js <mobile>` — remove one customer + all their try-ons + shortlists + storage files.
- `test-gemini-kurta.js` — one-shot probe to verify Gemini image edit is working via Vertex.
- `test-pipeline.js` — end-to-end probe of the try-on pipeline.
