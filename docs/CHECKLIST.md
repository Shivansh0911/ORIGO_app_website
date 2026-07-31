> ⚠️ **Superseded for the current launch.** Last updated 2026-07-19, before the
> launch-scope brainstorm and cuts. The active backlog is
> [docs/BUILD_PLAN.md](BUILD_PLAN.md), which supersedes both the Dev TODO and
> Founder TODO sections below. Historical value only.

# Origo — Living Checklist

> Keep this current. Tick items in the same PR that completes them. Three
> sections: **Done**, **Dev TODO**, **Founder TODO**. Last updated: 2026-07-19.

---

## ✅ Done (web app, this pass)

- [x] Client-side matching engine — intent-aware weights, weighted interest
      overlap, Adamic–Adar graph term, reciprocity proxy, MMR diversity,
      exploration jitter (`origo-web/src/lib/matching.ts`)
- [x] Discover rewired to the engine: intent selector, "Why this match"
      breakdown, qualitative match **bands** instead of a raw % number
- [x] Intro Card generator — canvas render, story/square, QR, download + share
- [x] Freshers HQ hub (quests + Happening carousel + quick links)
- [x] Prom Radar (opt-in, date/group mode, ranked candidates)
- [x] Batch Space, Senior Connect, We Met (QR)
- [x] Happening Around You carousel with interleaved, ad-load-disciplined
      sponsored cards
- [x] Opt-in **consent** flow + banner + Privacy Policy page (`/privacy`)
- [x] **Telemetry** pipeline (opt-in, batched, resilient) + event instrumentation
      on the high-value training signals
- [x] Docs: `origo-web/IMPLEMENTATION.md`, this `docs/` folder

---

## 🔧 Dev TODO (mostly backend — ordered by leverage)

### P0 — unblocks everything else
- [ ] **`POST /v1/events` sink + `AnalyticsEvent` table** — receive and store the
      telemetry the web app already emits. Append-only. (See DATA_AND_PRIVACY.md.)
- [ ] **Rizz outcome logging** — persist every session outcome
      (`declined | expired_unopened | converted_to_chat | chat_survived_N | blocked_after`)
      to a `RizzOutcome` table. This is the ground-truth label set for any learned
      ranker. Nothing downstream works without it.
- [ ] **Consent log endpoint** — persist consent decisions server-side for an
      auditable record (DPDP/GDPR). Web store is ready to call it.

### P1 — makes the current matching engine materially better
- [ ] Add per-candidate `communities: {id, memberCount, category}[]` to the
      `/discover` payload → **activates the already-wired Adamic–Adar graph term**.
- [ ] Add per-candidate `responseRate` (from Rizz outcomes) → upgrades the
      reciprocity proxy to a real signal.
- [ ] Port `matching.ts` to the backend so ranking is server-authoritative and
      consistent across web + mobile.
- [ ] Data-subject rights endpoints: **export my data**, **delete my data**
      (wire to the existing privacy page + settings).

### P1 — freshers features → real data (replace seed)
- [ ] `GET /v1/freshers/quests` + `POST /.../complete`
- [ ] `GET /v1/happening` + `GET /v1/happening/sponsored`
- [ ] `GET /v1/seniors` + senior opt-in flag on User
- [ ] `GET /v1/batch/:campus/:year` (packaged Community)
- [ ] Prom: `POST /v1/prom/opt-in`, `GET /v1/prom/status`, `GET /v1/prom/candidates`
- [ ] `POST /v1/met` (from scanned QR token)
- [ ] **Pre-arrival verification path** (admission-letter upload or senior-invite
      gating) — college email OTP doesn't exist until registration. ⚠️ Blocks the
      whole pre-arrival play; decide + build before launch.

### P2 — after the data exists
- [ ] Train first learned ranker (LogReg → LightGBM) on Rizz outcomes; A/B vs the
      heuristic. (Trigger: see ROADMAP milestone M2.)
- [ ] Live QR scanning for We Met (native camera / `BarcodeDetector`)
- [ ] Terms of Service page (mirror the Privacy page)
- [ ] Code-split the web bundle (currently one ~660 kB chunk)

---

## 🧑‍💼 Founder TODO (Aryan)

### Infrastructure & keys (needed to run the product end-to-end)
- [ ] **Postgres** — create a DB and grab the connection string. Options: Neon
      (free), or **Supabase** (free; also gives you auth/storage if wanted).
      → sets `DATABASE_URL`.
- [ ] **Redis** — Upstash free tier. → sets `REDIS_URL`.
- [ ] **Deploy the backend** — Railway or **Render** (both fine; Render's free web
      service sleeps, Railway's trial doesn't). Connect the GitHub repo, add the
      env vars, deploy.
- [ ] **Deploy the web app** — Vercel (free, auto-HTTPS). Set `VITE_API_URL` to the
      backend URL.
- [ ] **Object storage** — AWS S3 or Cloudflare R2 (cheaper, no egress fees) for
      avatars + student IDs. → AWS/R2 keys.
- [ ] **Email** — Resend free tier for OTP. → `RESEND_API_KEY`.
- [ ] **Payments** — Razorpay test keys for Premium. → `RAZORPAY_KEY_*`.
- [ ] **Push** — Firebase FCM + Expo push (free).
- [ ] Generate secrets locally: two JWT secrets + one 32-byte encryption key
      (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
- [ ] *(Optional now, recommended soon)* **PostHog** free cloud for funnels/retention
      dashboards — complements our own event table. → project API key.

### Legal & privacy (do before real users)
- [ ] Get the **Privacy Policy + a Terms of Service reviewed by a lawyer** familiar
      with India's DPDP Act 2023. The shipped `/privacy` page is a solid starting
      draft, **not** legal advice.
- [ ] Set up the **`privacy@origo.app`** inbox (referenced in the policy).
- [ ] Appoint a **Grievance Officer** and publish contact (DPDP requirement once
      you're a "significant" fiduciary, good practice regardless).
- [ ] Confirm the **data retention** period we state and the deletion behaviour.

### GTM (freshers season — time-sensitive)
- [ ] Pick an explicit **density bar** for BITS Hyderabad before expanding
      (e.g. % of the incoming batch active) — see the Freshers Playbook memo.
- [ ] Line up 3–5 **freshers-page admins** for the Intro Card partner arrangement.
- [ ] Recruit 5–10 **seniors** as founding Senior Connect voices.
- [ ] Get **club coordinators'** contacts for the Club Hub.
- [ ] Plan the **orientation stall + QR posters** ("scan to meet your batch").

### Product decisions (need your call)
- [ ] Choose the **pre-arrival verification** method (admission letter vs senior
      invite) — this is a launch blocker, see Dev P1.
- [ ] Confirm you're happy with **match bands** (no raw % shown). Easy to revert.
- [ ] Decide whether **sport-buddy / study-buddy** stay implicit (via interests +
      communities) rather than becoming named modes — recommendation is yes.
