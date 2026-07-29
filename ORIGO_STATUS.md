# Origo — Complete Status Document
**Last updated:** 2026-07-29 · **Campus opens:** 2026-08-01 · **Prom:** ~Aug 23–29

This is the single source of truth for what Origo is, what's built, what's left,
and what the user flow looks like end-to-end. Read this before touching any feature.

---

## What Origo Is

Origo is a **verified campus social app** for Indian college students — friends,
dating, and community, all in one place. It launches **campus-by-campus**, starting
exclusively with **BITS Pilani – Hyderabad Campus**.

**The thesis in one sentence:** Origo is how you find your people on campus.

Origo is not a general social network. It is not anonymous. Every feature is
identity-attached — your college email verifies who you are, every connection is a
real person you could run into tomorrow. This is the product's core safety and
quality guarantee.

**Distribution:** Progressive Web App (PWA) — no App Store needed for v1. Students
open the web app on their phone, add to home screen, and use it like a native app.
The mobile Expo app exists in the codebase but is not shipped yet (shows "Coming
Soon").

---

## Verification Model

1. **Google Sign-In (primary):** BITS Pilani – Hyderabad Campus uses Google Workspace
   (`hyderabad.bits-pilani.ac.in` domain). The Google OAuth `hd` claim auto-verifies
   the student — no OTP needed.
2. **College Email OTP (fallback):** If Google sign-in isn't used, the user enters their
   `.bits-pilani.ac.in` address and receives a 6-digit OTP via Resend/email.
3. **Student ID upload:** Supabase private bucket (`origo-private`) — stored, not
   auto-validated. Manual review capability for edge cases.

Campus-gate enforcement lives in `backend/src/config/collegeDomains.ts`. Do NOT
expand the allowlist without checking with Aryan.

---

## Shipped Features

### Onboarding & Profile
- **Google OAuth sign-in** with campus auto-verification
- **Multi-step onboarding:** register → DOB → interests (min 3) → `lookingFor` → profile setup
- **Intro Card:** beautiful canvas-rendered shareable card with holographic gradient themes,
  photo/avatar, interests, hometown, joining year — shareable to WhatsApp groups as PNG.
  QR code + custom handle for in-person scanning. Card is the distribution engine for
  virality (freshers share cards in batch WhatsApp groups).
- **Avatar upload** to Supabase Storage public bucket (`origo`)
- **User privacy settings** (`discoverableBy`: EVERYONE / MATCHES_ONLY / NOBODY)
- **Block & report** flows
- **Account deletion** (hard delete)
- **Onboarding guide** (5-slide tour with skip option shown on first login)

### Discovery & Matching
- **Discover page:** intent-filtered browse (Friends / Dating / Networking / Study Buddy)
  with client-side re-ranking using Jaccard interest similarity, graph overlap (Adamic–Adar
  via shared communities), reciprocity proxy, recency, and completeness. "Why this match"
  expandable breakdown on each card.
- **Match requests:** send/accept/decline. Mutual match creates a Conversation.
- **Filter chips** by intent, auto-advances to next person on action.
- **Privacy-aware:** honours `discoverableBy` setting; non-premium users see same-campus only.
- **Telemetry** on every swipe/like/pass/rizz-start (training data for future ranking).

### Rizz In 5
Scarcity-gated chat approach — the "cold message" problem solved for campus:

- Initiator gets **5 messages max** before the target must reply (budget managed by
  `MATCHING.rizzMessageBudget`).
- **Consecutive message cap:** after 2 messages without a reply, status flips to WAITING.
  "Make them count" — prevents wall-of-text from strangers.
- **Inbound cap:** target can hold max 3 pending unanswered approaches (`MATCHING.inboundPendingCap`).
  Prevents top profiles absorbing every approach on a skewed campus.
- **Daily outbound budget:** 3/day (free) · 6/day (Premium). Finite for everyone — uncapped
  cold contact is not a product feature that works on a campus where you see people tomorrow.
- **Declines are permanent.** Attempting to re-approach someone who declined you throws
  `DECLINE_IS_FINAL`. Shown as EXPIRED to the initiator (campus safety — `maskDeclineForInitiator`).
- **Target's first reply → ACCEPTED:** session unlocks, a Conversation and Match are created,
  the user is directed to Messages.
- **Icebreaker** button: AI-generated opening line prompt for the session.
- **Real-time via Socket.IO** (per-session rooms, JWT auth handshake).

### Chat / Conversations
- Direct message conversations created on Rizz acceptance or manual match acceptance.
- Real-time via Socket.IO.
- Messages stored with `readAt` timestamp; unread count tracked per conversation.
- `markRead` on open.
- Message types: TEXT (live), STICKER and IMAGE (plumbing exists, not exposed in UI).

### Pulse
Ephemeral "what are you up to" posts that create Rizz sessions:

- Author sets category (CHILL / MOVE / PLAY / TALK / GROW / DATE_PRACTICE), vibe text, and
  `maxResponses` (1–10, default 3).
- Pulse expires after 24h. Status: ACTIVE → FULFILLED (maxResponses hit) / EXPIRED / CANCELLED.
- Responding to a Pulse starts a Rizz session with the author.
- Feed is campus-scoped; moderation applied before write.

### Communities
- Create / browse / join communities (interest-linked, campus-scoped).
- Posts with likes and comments.
- Community events with RSVP (RSVP backend route not yet implemented — UI shows "coming soon").
- Member count tracked.

### Happening Around You
- Sponsored + organic event carousel on the home feed.
- At most 1 sponsored card per 5 items (paid placement cap).

### Ship a Friend
Anonymous matchmaking — suggest that two people would be great together:

- Eligible targets: all verified campus users (removed match requirement — unusable on day 1).
- Privacy-respecting: checks `UserPrivacy.allowShipsFrom`.
- Daily cap: 5 ships per user per day.
- Block checks in all 3 directions.
- Ship is anonymous — initiator name never in notifications.
- Payment plumbing (`IapPurchase`, `createShipOrder`) exists but not wired — Ship is **free
  for v1** (explicit launch-scope decision).

### Prom Radar
- Dedicated page/section for the annual prom vote/RSVP event. Timed to Aug 23–29 Prom window.

### Senior Connect
- Surface for seniors to mark themselves as mentors/connectors and for freshers to reach out.

### Freshers HQ
- Fresher-specific hub surface; orientation week context.

### We Met (QR)
- QR-based "we met in person" connection flow. Scans their QR → sends a match request.

### Premium
- Razorpay subscription: MONTHLY / QUARTERLY / ANNUAL plans.
- In **pseudo-mode** when `RAZORPAY_KEY_ID`/`KEY_SECRET` not set (mock orders for dev).
- Premium benefits: 6 daily Rizz sessions (vs 3), campus-wide discover (vs same-campus only).
- Profile Boost: paid feature, exists in backend.

### Analytics Telemetry
- `POST /v1/events` — always 202, auth optional, max 200 events/batch.
- Append-only `AnalyticsEvent` table. Training data for future ranking models.
- Client-side `track()` calls on every meaningful user action.

---

## Architecture

| Layer | Stack |
|---|---|
| Web app | React 18 + Vite + TypeScript · Tailwind CSS · TanStack Query · Zustand |
| Backend | Express + TypeScript · Prisma ORM · PostgreSQL (Supabase) |
| Real-time | Socket.IO (JWT auth handshake, per-room events) |
| Cache / Rate limit | Upstash Redis via ioredis (`rediss://` TLS URL required) |
| Storage | Supabase Storage: `origo` (public, avatars) · `origo-private` (private, student IDs) |
| Email | Resend (OTP emails) |
| Payments | Razorpay (pseudo-mode in dev, real in prod when keys set) |
| Auth | JWT access token (15m) + per-device UUID refresh token in Redis (30d) · Google OAuth |
| Encryption | AES-256-GCM (`FIELD_ENCRYPTION_KEY`) for PII · HMAC blind index (`BLIND_INDEX_KEY`) |
| Mobile (not shipped) | Expo SDK 51 / React Native in `origo-app/` — shows "Coming Soon" on web |

**DB:** 30 models, 6 migrations. Hand-written migrations (no `prisma migrate dev` — no local Postgres).  
**Backend:** ~65 REST endpoints + Socket.IO events.  
**Frontend:** ~19,000 LOC, 62 commits, 2 contributors.

---

## Complete User Flow

### First-Time User (Fresher, Arrival Week)

```
1. Opens Origo (web URL or QR from friend's Intro Card)
2. "Continue with Google" → auto-verifies BITS Hyderabad domain
   ↳ (if not BITS domain → "College email not supported yet")
3. Enter Date of Birth (age gate)
4. Pick ≥3 interests from 44 options (8 categories)
5. Pick what you're looking for (Friends / Dating / Networking / Study Buddy — multi-select)
6. Upload avatar (optional but encouraged)
7. ✅ You're in — Onboarding Guide slides (5 slides, skippable)
8. Prompted to make your Intro Card (shareable canvas card)

→ Discover: browse ranked people on campus
→ Pulse: post what you're up to, see what others posted
→ Communities: join groups
→ Rizz: approach someone with 5 messages
→ Messages: full chat after Rizz accepted or match accepted
→ Ship: anonymously suggest two people to each other
```

### Rizz Flow (core engagement loop)

```
Initiator sees someone on Discover →
  Taps ⚡ → Rizz session created (ACTIVE)
  Sends up to 2 messages (consecutive cap) → status: WAITING
  Target gets notification: "Someone wants to Rizz you!"
  Target replies → session: ACCEPTED → Conversation + Match created
  Both get "🎉 Chat unlocked — head to Messages!" banner
  Continue in Messages →
```

### Ship Flow

```
User taps "Ship" (on profile or dedicated page)
Picks Target 1 and Target 2 from campus users (no existing match required)
Adds optional message ("I think you two would be great together")
Both targets get anonymous notification
```

### Prom Radar (Aug 23–29)

```
Students register interest → anonymous vote pool →
Mutual matches revealed at Prom → special Conversation thread created
```

---

## What's Left (Prioritized)

### Blocker for Launch (by Aug 1)

| # | Item | Status |
|---|---|---|
| 0.x | Deploy backend to Railway/Render | ⬜ Needs Aryan |
| 0.x | Deploy web to Vercel | ⬜ Needs Aryan |
| 0.x | Set `ALLOWED_ORIGINS`, `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID` on prod | ⬜ Needs Aryan |
| 0.5 | ✅ Seed `Interest` table | **Done 2026-07-29** |
| 1.0a | Persist prompt answers from Intro Card to User profile | ⬜ |
| 1.1a | Discover: filter chips (branch, hometown, hostel) | ⬜ |
| 1.9 | Happening Around You: real events seeded | ⬜ Needs Shivansh |

### Near-Term (Arrival Week, Aug 1–6)

| # | Item | Status |
|---|---|---|
| 1.3a | Rizz icebreaker presets (tappable, not text field) | ⬜ |
| 1.6 | Feature-flag out-of-scope surfaces | ⬜ |
| 1.10 | Persist joiningYear / degreeType / branch / hometown from Intro Card | ⬜ |
| — | Community RSVP route (currently stubbed "coming soon") | ⬜ |
| — | Profile prompt answers (Hinge-style) | ⬜ |

### Prom Phase (Aug 20–29)

| # | Item | Status |
|---|---|---|
| 4.x | Prom Radar: nominee submission + voting | ⬜ |
| 4.x | Prom reveal + special conversation thread | ⬜ |
| 4.x | Prom night mode (UI theme + live radar) | ⬜ |

### Deferred / Out of Scope for Launch

| Item | Decision |
|---|---|
| Mobile app (Expo) | Shows "Coming Soon" — code exists, not shipped |
| Batch Space tab | Cut — WhatsApp groups are the incumbent; Discover absorbs the use case |
| Real Razorpay payments | Mock mode only — Ship is free for v1 |
| Sticker Pack / Rizz Pack / See Who Shipped | Plumbing exists, not wired |
| AI moderation (Rekognition / OpenAI) | Regex + `bad-words` npm for now |
| Push notifications | `pushToken` stored, but no push service wired |
| CI/CD | Zero automated tests, no CI pipeline (known gap, intentional for speed) |
| Multi-campus expansion | After BITS Hyderabad pilot validates the model |

---

## Open Bugs

| ID | Bug | Status |
|---|---|---|
| B7 | Discover pool only 100 users (by recency) — misses active users not recently seen | Known, live |
| B8 | Payment `orderId` vs `planId` field name drift (client ↔ backend) | Check before enabling real payments |
| B9 | Razorpay ownership: who receives money? Verify merchant account before go-live | Needs Aryan |
| B10 | Stale docs (BUILD_PLAN references 3 migrations, 6 exist now) | Cosmetic |

---

## Fixed (This Session, 2026-07-29)

| Fix | What Was Wrong |
|---|---|
| BLOCK-1: Redis TLS | `redis://` → `rediss://` — Upstash requires TLS, server was hanging on auth |
| BLOCK-2: passwordHash nullable | Initial migration created it NOT NULL, schema says nullable → Google OAuth signup failed |
| BLOCK-3: Discover community context | Backend now returns `communities[]` and `responsiveness` per candidate; frontend wires `contextById` into `rankCandidates` — graph (Adamic–Adar) and reciprocity scoring now live |
| Rizz type drift | Frontend used `receiver/messageCount/UNLOCKED`; backend sends `target/initiatorMsgCount/ACCEPTED` |
| Rizz decline PATCH→POST | Frontend sent PATCH, backend expected POST |
| Icebreaker data.tip→data.prompt | Backend returns `{ prompt }`, frontend was reading `data.tip` |
| Socket port 4000→3001 | Fallback URL corrected |
| RSVP 404 stub | No backend route — UI now shows "coming soon" toast |
| BatchSpacePage dead code | Removed from App.tsx (Batch Space is cut) |
| Download page | Rewritten as "Coming Soon" pointing to the web app |
| Rizz ACCEPTED dead-end | Input disabled on ACCEPTED; "Continue in Messages →" button shown |
| Moderation | Replaced 6-pattern regex with `bad-words` npm + Hinglish patterns |
| Interest seed | 44 interests + 8 communities + 5 mock users seeded to prod DB |

---

## Secrets Required on Production

```
DATABASE_URL          # Supabase Postgres
REDIS_URL             # Upstash rediss:// (TLS)
JWT_SECRET            # 64-hex random
JWT_REFRESH_SECRET    # 64-hex random
FIELD_ENCRYPTION_KEY  # 64-hex random (AES-256-GCM)
BLIND_INDEX_KEY       # 64-hex random (HMAC blind index)
RESEND_API_KEY        # For college email OTP
GOOGLE_CLIENT_ID      # Google OAuth
SUPABASE_URL          # For storage uploads
SUPABASE_SERVICE_ROLE_KEY  # sb_secret_... format
# NOT set in prod (payment mock mode is intentional for v1):
# RAZORPAY_KEY_ID
# RAZORPAY_KEY_SECRET
```

Server throws at boot if any required secrets are missing or malformed — this is
deliberate (SEC-01/SEC-03). Do NOT add fallback defaults.

---

## Supabase Storage Setup

Two buckets required:
- `origo` — **public** — avatar images (served at `supabase_url/storage/v1/object/public/origo/...`)
- `origo-private` — **private** — student ID uploads

---

## Key Config Knobs (env-overridable, no restart needed)

```
MATCH_INBOUND_CAP=3          # Pending approaches a target can hold
MATCH_OUTBOUND_DAILY=3       # Rizz sessions free users can start per day
MATCH_OUTBOUND_DAILY_PREMIUM=6  # Premium daily outbound
MATCH_MAX_CONSECUTIVE=2      # Messages before waiting for reply
MATCH_RIZZ_BUDGET=5          # Total initiator messages per session
MATCH_DECLINE_PERMANENT=true # A decline cannot be retried
PULSE_DEFAULT_RESPONSES=3    # Default maxResponses on a Pulse
PULSE_MAX_RESPONSES=10       # Hard cap on Pulse maxResponses
MATCH_SHIPS_PER_DAY=5        # Ship operations per user per day
```

---

## File Map (Key Locations)

```
backend/
  src/
    config/
      collegeDomains.ts   # Campus allowlist — do NOT expand without Aryan
      matching.ts         # All matching/allocation limits (env-overridable)
    services/
      rizz.service.ts     # Rizz session lifecycle + rules
      discover.service.ts # Discover pool + server-side scoring
      ship.service.ts     # Ship a Friend logic
      pulse.service.ts    # Pulse lifecycle
      payment.service.ts  # Razorpay (pseudo-mode when keys absent)
    utils/
      moderateText.ts     # bad-words + Hinglish patterns — all writes pass through
  prisma/
    schema.prisma         # 30 models
    migrations/           # 6 hand-written migrations

origo-web/
  src/
    lib/
      matching.ts         # Client-side re-ranking engine — DO NOT MODIFY internals
      introCard.ts        # Intro Card canvas renderer — DO NOT MODIFY internals
      telemetry.ts        # Analytics track() helper
    pages/app/
      DiscoverPage.tsx    # Browse + intent filter + card stack
      RizzPage.tsx        # Rizz session list
      RizzChatPage.tsx    # Rizz chat with progress bar
      PulsePage.tsx       # Pulse feed + create
      MessagesPage.tsx    # Full chat conversations
    components/ui/
      OnboardingGuide.tsx # 5-slide first-login tour (skip option included)
      IntroCard.tsx       # Card preview + share
```
