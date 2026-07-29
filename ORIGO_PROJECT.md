# Origo — Technical Project Profile

> Compiled from the repository's code, config, git history, and docs on 2026-07-29.
> Sources cited inline as `path/to/file`. Section 10 lists everything that
> could not be determined from the repo — fill those in yourself.

---

## 1. What it is

Origo is a verified-identity campus social platform — friends, dating, and
communities in one app — launching campus-by-campus, starting exclusively
with BITS Pilani, Hyderabad Campus (`CLAUDE.md`, `docs/THESIS.md`). It targets
the specific moment an incoming batch arrives on campus knowing nobody, and
positions itself explicitly as *not* a dating app: romantic discovery is
opt-in and episodic, every user is identity-verified through their college
email or Google Workspace account, and there is no anonymous posting anywhere
in the product (`docs/THESIS.md`). The system ships as three clients sharing
one backend: a React Native mobile app, a React marketing site + full web app,
and a Node/Express API — covering onboarding and verification, a campus feed
(Batch Space, Pulse, Happening, Senior Connect), a scarcity-gated
one-to-one "Rizz" messaging flow that converts into real chat, a Discover/
matching surface, communities with posts/events, a shareable Intro Card growth
loop, and Razorpay-based monetization (Premium, Profile Boost).

---

## 2. Tech stack

Three independent packages, each with its own lockfile (pnpm for
backend/web, npm/expo for the mobile app).

### Backend — `backend/package.json`
- **Runtime/language:** Node.js, TypeScript 5.x, `strict: true` (`backend/tsconfig.json`)
- **Framework:** Express 4.18
- **Database:** PostgreSQL via Prisma ORM 5.x (`@prisma/client`, `prisma`)
- **Cache/session/rate-limit store:** Redis via `ioredis` 5.3, `rate-limit-redis`
- **Realtime:** Socket.IO 4.6 (server)
- **Auth:** `jsonwebtoken` (custom JWT access/refresh pair), `bcrypt` (password hashing), `google-auth-library` (Google OAuth ID-token verification)
- **Payments:** `razorpay` 2.9 (India-market payment gateway), with a pseudo/mock mode for local dev (`payment.service.ts`)
- **Validation:** `zod` 3.22 (request schema validation middleware)
- **File storage:** `@aws-sdk/client-s3` (avatar/student-ID uploads), `@aws-sdk/client-rekognition` (installed, **appears unused** — no call sites found under `backend/src`)
- **Email:** `resend` (OTP delivery)
- **Content moderation:** `bad-words` (profanity filter, `utils/moderateText.ts`)
- **Scheduling:** `node-cron` (session/pulse expiry jobs)
- **Security middleware:** `helmet`, `cors` (explicit origin allowlist, no wildcard), `express-rate-limit`
- **Dev tooling:** `ts-node-dev` (hot reload), no test runner configured

### Web app — `origo-web/package.json`
- **Framework:** React 18.2 + Vite 5 (CSR, no SSR/SSG)
- **Language:** TypeScript 5.3, `strict: true` but `noUnusedLocals`/`noUnusedParameters` off (`origo-web/tsconfig.json`)
- **Styling:** Tailwind CSS 3.3 + PostCSS/Autoprefixer
- **Routing:** `react-router-dom` 6.20
- **State:** `zustand` 4.4 (auth/consent/freshers/notification/socket stores)
- **Data fetching:** `@tanstack/react-query` 5.17 + `axios` 1.6
- **Realtime:** `socket.io-client` 4.6
- **Animation:** `framer-motion` 10.16
- **Misc:** `qrcode` (Intro Card QR generation), `date-fns`, `react-hot-toast`, `react-intersection-observer`, `lucide-react` (icons)
- Has an `eslint` script defined but no committed `.eslintrc*` config found in the repo

### Mobile app — `origo-app/package.json`
- **Framework:** React Native 0.74 via Expo SDK 51
- **Language:** TypeScript 5.3, `strict: true`, extends `expo/tsconfig.base`
- **Navigation:** `@react-navigation` (native, bottom-tabs, stack)
- **State/data:** `zustand`, `@tanstack/react-query`, `axios`
- **Local storage:** `react-native-mmkv`
- **Realtime:** `socket.io-client`
- **Media/native:** `expo-camera`, `expo-image-picker`, `expo-document-picker`, `expo-linear-gradient`, `expo-notifications`
- **UI:** `react-native-deck-swiper` (swipe cards for Discover), `react-native-gesture-handler`, custom font loading via `@expo-google-fonts/*`
- No test runner configured; `ts:check` script is the only CI-adjacent script

### Hosting / infra
`docker-compose.yml` exists at repo root (likely Postgres + Redis for local
dev — see Section 10 for what it actually targets in each environment).
`DEPLOYMENT.md` and `.env.example`-style guidance exist for Railway
(referenced directly in `auth.service.ts` comments: "Set GOOGLE_CLIENT_ID in
Railway env vars"). No CI/CD pipeline (`.github/workflows`) exists in the repo.

---

## 3. Architecture

### Directory structure (top 2 levels)

```
backend/
  src/
    config/       — collegeDomains.ts (allowlist), matching.ts (Rizz tuning constants)
    controllers/  — auth.controller.ts (thin HTTP layer over services)
    jobs/         — pulseExpiry.job.ts, rizzExpiry.job.ts (node-cron)
    middleware/    — auth.ts, rateLimiter.ts, validate.ts (zod)
    routes/       — one file per resource (auth, chat, communities, discover, events,
                    matches, notifications, payments, posts, pulse, rizz, ships, users)
    schemas/      — zod schemas (auth, pulse, user)
    services/     — business logic (auth, chat, community, discover, match,
                    notification, payment, pulse, rizz, ship, user)
    socket/       — Socket.IO connection + event handlers
    utils/        — blindIndex, collegeDomains, encryption, jwt, moderateText,
                    prisma client, redis client, supabase (S3-compatible storage helper)
  prisma/         — schema.prisma, seed.ts, hand-written migrations/
origo-web/
  src/
    api/          — axios client + typed endpoint map
    components/    — consent, happening, layout, pulse, sections (marketing), ui (design system)
    lib/           — freshers content, introCard (canvas rendering), matching.ts
                    (client-side scoring), payment.ts, telemetry.ts
    pages/         — app/* (authenticated app screens), auth/* (onboarding flow),
                    marketing pages (About/Features/Privacy/Download/Landing)
    store/         — zustand stores (auth, consent, freshers, notification, socket)
origo-app/
  src/
    api/           — axios client
    components/    — chat, community, discover, rizz widgets
    hooks/         — useChat, useSocket
    navigation/    — AppNavigator, MainTabNavigator, OnboardingNavigator
    screens/       — communities, discover, messages, onboarding, profile, rizz
    store/         — authStore, notificationStore
    theme/         — colors, spacing, typography
docs/
    decisions/     — ADRs (0001–0004)
    BUILD_PLAN.md, BRAINSTORM.md, CHECKLIST.md, DATA_AND_PRIVACY.md,
    ROADMAP.md, THESIS.md, matching-spec.md
```

### Rendering strategy & routing
- **Web:** pure client-side rendering (Vite SPA), `react-router-dom` for
  client routing, no SSR/SSG/ISR.
- **Mobile:** native React Native screens via React Navigation stack + bottom
  tabs, split into an `OnboardingNavigator` and a `MainTabNavigator`.

### Data model (Prisma, `backend/prisma/schema.prisma`)
30 models. Core relationships:
- **User** is the hub — one-to-many/many-to-many into `UserInterest`,
  `Match`, `RizzSession`/`RizzMessage`, `ConversationParticipant`/`Message`,
  `CommunityMember`, `Post`/`Comment`/`PostLike`, `Ship` (three FKs:
  initiator + two targets), `Subscription`, `ProfileBoost`, `Notification`,
  `Block`, `Report`, `ConsentLog`, `Pulse`/`PulseResponse`, `IapPurchase`.
- **Verification/identity:** `email` (plaintext, unique), `collegeEmail`
  (AES-256-GCM encrypted), `collegeEmailHash` (deterministic HMAC blind index
  for dedup lookups without decryption — see Section 5).
- **Matching:** `Match` (sender/receiver/status/compatibilityScore/matchType),
  distinct from `RizzSession` which models the scarcity-gated approach flow
  that *creates* a `Match` + `Conversation` on mutual reply.
- **Monetization:** `Subscription` (plan/status/Razorpay sub id),
  `ProfileBoost`, `IapPurchase` (item/order/payment id, separate `verifiedAt`
  + `consumedAt` timestamps — see decision 0001).
- **Privacy/safety:** `UserPrivacy` (per-user visibility settings), `Block`,
  `Report`, `ConsentLog` (IP/UA/version, DPDP-Act-oriented), `DeletionAuditLog`.
- **Telemetry:** `AnalyticsEvent` — append-only, `userId` nullable and
  deliberately *not* a foreign key so events survive account deletion as
  anonymous rows (see schema comment, `schema.prisma:503-514`).

Migrations are hand-written (`backend/prisma/migrations/*`) rather than
generator-produced in at least the later ones, per `CLAUDE.md` convention
("no local Postgres running") — e.g. `20260728120000_add_iap_purchase`,
`20260729090000_add_analytics_event`.

### API surface (Express routes under `/v1`, `backend/src/server.ts`)
~65 endpoints across 13 route files. Representative surface:
- `auth`: register, login, Google OAuth, refresh/logout, DOB setup, college
  email verify + OTP confirm, student ID upload, account deletion
- `users`: profile CRUD, avatar upload, interests, block/report, push token
- `discover`: `/people` (ranked/filtered), `/campus`
- `matches`: create/list/respond/delete
- `rizz`: session create/list/get, message send, decline, icebreaker prompt
- `conversations` (chat): list, messages get/send, mark read, delete message
- `communities`: list/detail, join/leave, posts, likes, comments, events
- `pulse`: feed, mine, create, respond, delete
- `ships`: create, list, eligible targets
- `payments`: subscription order/verify, boost order/verify, ship/sticker/
  rizz-pack/view-ships order, generic IAP verify
- `notifications`: list (cursor-paginated), unread count, mark read/read-all
- `events`: public creation endpoint (no auth middleware — see Section 8)
- `events` (telemetry sink): `POST /v1/events`, deliberately unauthenticated
  because it must capture pre-signup funnel events (`server.ts:83-86`)

Route-level auth is applied per-router in `server.ts` (`authMiddleware` +
`requireVerified` composed onto `rizz`, `discover`, `matches`, `communities`,
`pulse`), rather than per-route, which is a source of the routing/gating
inconsistencies noted in Section 8.

### Auth model
- **Providers:** email+password (bcrypt, cost 12) and Google OAuth (ID token
  verified server-side against Google's public keys via `google-auth-library`).
- **Session strategy:** custom JWT access + refresh token pair
  (`utils/jwt.ts`), refresh tokens tracked in Redis keyed by user+device,
  rotated on refresh, revocable in bulk on account deletion
  (`invalidateAllSessions`).
- **Identity verification tier:** a second gate beyond auth — `isVerified` /
  `requireVerified` middleware — satisfied either via college-email OTP or
  automatically via Google Workspace `hd` claim (see Section 5).
- **Roles:** no admin/staff role model found in the schema; `CommunityRole`
  (ADMIN/MODERATOR/MEMBER) is scoped to community membership only.

### Background jobs, cron, realtime
- `node-cron` jobs: `rizzExpiry.job.ts`, `pulseExpiry.job.ts` — sweep expired
  Rizz sessions and Pulses.
- Socket.IO (`socket/index.ts`): JWT-authenticated handshake, per-user room
  (`user:{id}`), per-conversation rooms with membership checks on
  `join_conversation` and `send_message`, typing indicators, read receipts,
  online/last-seen tracked in both Redis (`online:{userId}`, TTL) and Postgres.
- No message queue (SQS/BullMQ/etc.) — Redis is used purely as cache/session
  store, not as a job broker.

### External integrations
Google OAuth (`google-auth-library`), Razorpay (payments, pseudo-mode
fallback), Resend (transactional email/OTP), AWS S3 (media/document storage,
`utils/supabase.ts` despite the filename — see Section 8), AWS Rekognition
(installed, unused).

---

## 4. Features shipped

### Shipped and working
| Feature | Primary files |
|---|---|
| Email + Google OAuth signup/login, JWT session management | `services/auth.service.ts`, `utils/jwt.ts`, `middleware/auth.ts` |
| College-email OTP verification + Google Workspace auto-verify | `auth.service.ts:125-210,221-273`, `config/collegeDomains.ts` |
| Discover / ranked matching feed | `services/discover.service.ts`, `origo-web/src/lib/matching.ts` |
| Rizz — scarcity-gated approach → mutual-reply → real chat | `services/rizz.service.ts`, `config/matching.ts` |
| Real-time chat (1:1, typing, read receipts, presence) | `socket/index.ts`, `services/chat.service.ts`, `hooks/useChat.ts`/`useSocket.ts` |
| Communities (posts, comments, likes, events, membership) | `services/community.service.ts`, `routes/communities.routes.ts` |
| Pulse (ephemeral "what are you up to" → Rizz) | `services/pulse.service.ts`, `jobs/pulseExpiry.job.ts` |
| Ship a Friend (matchmaking-by-friend), free-for-v1 by deliberate scoping | `services/ship.service.ts`, `routes/ships.routes.ts` |
| Intro Card — canvas-rendered shareable card + QR, holographic themes | `origo-web/src/lib/introCard.ts` |
| Premium subscription checkout (Razorpay, real or pseudo-mode) | `services/payment.service.ts`, `routes/payments.routes.ts` |
| Profile Boost (paid) | `payment.service.ts`, `ProfileBoost` model |
| Privacy controls, block/report, DPDP-oriented account deletion + consent log | `services/user.service.ts`, `UserPrivacy`/`Block`/`Report`/`ConsentLog` models |
| Push notifications (token registration + in-app notification feed) | `routes/notifications.routes.ts`, `services/notification.service.ts` |
| Content moderation on chat/Rizz/pulse text | `utils/moderateText.ts` |
| Telemetry sink (previously dropped silently, fixed 2026-07-29) | `routes/events.routes.ts`, `AnalyticsEvent` model |

### In progress / stubbed / unfinished
- **Sticker Pack, Rizz Pack, See Who Shipped You** — order + verify endpoints
  exist and purchases are tracked (`IapPurchase`), but no feature currently
  consumes the entitlement (`CLAUDE.md`).
- **Ship a Friend payment enforcement** — plumbing (`IapPurchase`,
  `createShipOrder`/`verifyShipOrder`) exists and is tested but intentionally
  not wired into `ShipService.createShip` (free for v1 by product decision).
- **Razorpay webhook verification** — deferred; client-callback verification
  only, flagged `SEC-02 TODO` in `payment.service.ts`/`server.ts` (misses
  cases like the user closing the tab mid-payment).
- **Prom Radar, Senior Connect, We Met, Freshers Quests** — present as
  web pages/routes (`origo-web/src/pages/app/PromRadarPage.tsx`,
  `SeniorConnectPage.tsx`, `WeMetPage.tsx`) but scope/completeness of backend
  support for each was not independently verified here — check current state
  before describing these as fully shipped.
- **RSVP** — noted as a stub in the most recent commit message
  (`147b7b3 fix(web): ... RSVP stub`); not independently verified further.

---

## 5. Hard technical problems

### a) Matching reframed as a market-design problem, not a recommender
**Problem:** With ~300–1,000 users at a single launch campus and a ~75:25
gender skew (`WORKLOG.local.md`), a conventional swipe/recommend model
concentrates all attention on a small top slice of profiles and starves
everyone else — the classic thin-market/congestion failure, not a ranking
quality problem. **Solution:** treat discovery as **allocation**, not
prediction: (1) `DiscoverService` computes a transparent, deterministic
Jaccard-similarity composite score (interests 55pts + goals 20pts + campus
15pts + recency 10pts + profile completeness 5pts, `discover.service.ts:12-133`)
rather than a black-box ML ranker; (2) `RizzService` enforces **inbound
capacity caps** (`MATCHING.inboundPendingCap`) so no profile can absorb
unlimited unanswered approaches, and **outbound daily budgets**
(`MATCHING.outboundDaily`/`outboundDailyPremium`) so Premium buys a bounded
uplift, never unlimited cold contact (`rizz.service.ts:36-54`); (3) romantic
discovery is deliberately opt-in/episodic rather than a default mode
(`docs/decisions/0004-dating-as-opt-in-episodic-surface.md`) to concentrate
liquidity into windows instead of diffusing it. **Files:**
`backend/src/services/discover.service.ts`, `backend/src/services/rizz.service.ts`,
`backend/src/config/matching.ts`, `docs/decisions/0003-matching-strategy.md`,
`docs/matching-spec.md`. **Tradeoff:** an explainable heuristic scorer over a
learned ranker — the right call at this scale/cold-start (no training data,
needs to be defensible/debuggable to two people, not a data science team) but
would need revisiting at materially larger scale.

### b) Consent-preserving scarcity mechanics in Rizz
**Problem:** A message-budget approach (5 messages before needing a reply)
alone still lets an initiator burst all 5 at once — which, from the
receiving end on a skewed campus, is a wall-of-text from a stranger.
Separately, an initiator who is declined and can immediately re-approach
turns a single "no" into indefinite low-grade harassment on a campus where
the two people will physically cross paths again. **Solution:** pacing rule
caps *consecutive* messages before forcing a `WAITING` state
(`rizz.service.ts:96-116`, `MATCHING.maxConsecutiveMessages`); declines are
permanent and block re-approach entirely (`rizz.service.ts:21-28`,
`MATCHING.declineIsPermanent`); the initiator's UI never surfaces an explicit
decline — it's shown as an ordinary expiry (`maskDeclineForInitiator`,
`rizz.service.ts:233-252`) so the rejection has no visible "face," while the
decline still fully and permanently blocks re-contact internally. **Tradeoff:**
masking the decline is a UX/psychological-safety choice that trades
transparency (the initiator doesn't know they were declined vs. ignored) for
reduced confrontation risk on a small, socially dense campus — a defensible
but debatable call.

### c) Field-level encryption with equality search via blind index
**Problem:** College email needs to be both (1) encrypted at rest (PII under
DPDP-Act-oriented handling, `docs/DATA_AND_PRIVACY.md`) and (2) deduplicated
via an exact-match unique constraint — but AES-GCM with a random IV
(`utils/encryption.ts:15-21`) produces different ciphertext for the same
plaintext every time, so `WHERE collegeEmail = X` against ciphertext can
never match. **Solution:** a separate deterministic HMAC-SHA256 "blind index"
column (`collegeEmailHash`, `utils/blindIndex.ts`) computed from a distinct
key (`BLIND_INDEX_KEY`) is used for lookup/uniqueness, while the actual
`collegeEmail` column stays randomly-IV encrypted and unindexable by content.
**Files:** `backend/src/utils/encryption.ts`, `backend/src/utils/blindIndex.ts`,
`backend/src/services/auth.service.ts:221-232`. **Tradeoff:** a second secret
key and a second column to keep in sync, versus either weakening encryption
(deterministic IV, enabling ciphertext-equality/frequency attacks) or losing
dedup entirely.

### d) A production payment-bypass caught by manual diff review, not tooling
**Problem:** A "pseudo mode" for local Razorpay testing was implemented as
`if (IS_PSEUDO || orderId.startsWith('mock_') || signature === 'mock_sig') return true`
— the last two clauses were unconditional, so in *production*, with real
Razorpay keys configured, any client sending the literal string `mock_sig`
skipped HMAC signature verification entirely, making every paid feature free.
It typechecked, tests (there were none) would not have caught it, and it sat
directly beneath a `SEC-02 TODO` comment that made the area look
already-audited. **Solution:** rewritten so the mock branch only ever
executes inside `IS_PSEUDO`, which is itself controlled purely by whether
real Razorpay credentials are configured — i.e. gated on something the
*operator* controls, never on something the *caller* sends. **Files:**
`backend/src/services/payment.service.ts`,
`docs/decisions/0002-pseudo-mode-payment-bypass.md`. **Tradeoff:** deleting
pseudo-mode entirely was considered and rejected — it would force every
contributor to hold live payment credentials for local dev, which invites
worse ad hoc bypasses in feature branches.

### e) Entitlement model for in-app purchases (verify ≠ redeem)
**Problem:** IAP endpoints verified a Razorpay signature and returned
`{ verified: true }` without persisting anything — `POST /ships` had no link
to any payment at all, so the create-ship endpoint could be called directly
and succeed for free; and even with ownership checked, a valid signature
proves *a* payment happened, not *which* user, *what* it was for, or whether
it had already been redeemed (unbounded replay). **Solution:** an
`IapPurchase` model with two independent timestamps — `verifiedAt` (signature
checked) and `consumedAt` (artifact actually granted) — where redemption is
stamped inside the same DB transaction that creates the purchased artifact,
guarded by a `consumedAt: null` WHERE clause so two concurrent requests can't
double-spend one order. **Files:** `backend/prisma/schema.prisma:564-581`,
`docs/decisions/0001-iap-entitlement-model.md`. **Tradeoff:** the two-timestamp
model is used only for Ship (a genuine paid/used moment gap); the other three
IAP types (Sticker/Rizz Pack/View Ships) intentionally use a simpler
grant-at-verification model since no feature yet consumes them — a
deliberately non-uniform design rather than one pattern copy-pasted
everywhere.

---

## 6. Verifiable metrics

- **Lines of code** (excluding `node_modules`/`dist`): **~6,029** lines of
  `.ts` (backend logic, types), **~12,940** lines of `.tsx` (React/React
  Native UI across web + mobile), **~53** lines of plain `.js`. Total
  **~19,000 lines** of first-party source.
- **Commits:** 62 total on `master`.
- **Contributors:** 2 — `jtushya` (34 commits) and `Shivansh0911` (28
  commits, `singhtrial11@gmail.com`) (`git shortlog -sne`). Split of *what*
  each person built beyond commit authorship is not reliably inferable from
  message text alone — see Section 10.
- **First commit:** 2026-06-29 (`114cdf3`, "Initial commit: Origo campus
  social app"). **Most recent commit:** 2026-07-29 (`36f586f`,
  "feat(analytics): add POST /v1/events sink").
- **Routes/endpoints:** ~65 Express route handlers across 13 route files
  (`backend/src/routes/`).
- **Pages/screens:** 24 page components in `origo-web/src/pages/` (marketing
  + app + auth); 20 screen components in `origo-app/src/screens/`.
- **Reusable components:** ~14 in `origo-web/src/components/`, ~10 in
  `origo-app/src/components/`.
- **Database tables:** 30 Prisma models, 24 enums (`backend/prisma/schema.prisma`).
- **Migrations:** 6 migration folders (`backend/prisma/migrations/`), several
  hand-written rather than CLI-generated per project convention.
- **Tests:** **0** — no `*.test.ts`/`*.spec.ts` files found anywhere in the
  repo, no test runner configured in any `package.json`.
- **ADRs:** 4 formal decision records (`docs/decisions/0001`–`0004`).

---

## 7. Engineering practices

- **Testing:** none present — no unit, integration, or e2e test files or
  runner config in any of the three packages. Verification is described in
  commit bodies/ADRs as manual (`tsc --noEmit`, manual runs, headless-Chromium
  visual checks for the Intro Card render — `RESUME_NOTES.local.md`), not
  automated.
- **CI/CD:** no `.github/workflows` or other CI config found in the repo.
- **Linting/formatting:** `origo-web` defines an `eslint` script
  (`eslint . --ext ts,tsx`) but no committed ESLint config was found; no
  Prettier config found in any package.
- **TypeScript strictness:** `strict: true` in all three `tsconfig.json`
  files; backend and mobile app also compile with `noFallthroughCasesInSwitch`.
  `origo-web` explicitly turns off `noUnusedLocals`/`noUnusedParameters`.
- **Error handling:** centralized Express error middleware
  (`server.ts:90-97`) distinguishes moderation errors (422) from generic
  failures (500, logged, message not leaked to client). Socket handlers
  swallow DB errors with `.catch(() => {})` in places (presence updates) —
  acceptable for best-effort state, would be a gap if used for anything
  correctness-critical.
- **Monitoring/observability:** none beyond `console.log`/`console.error` and
  a `/health` endpoint; the newly-added `AnalyticsEvent` sink
  (`routes/events.routes.ts`) is product telemetry, not app/infra monitoring.
- **Env/secrets management:** startup fails closed — `server.ts:3-14` and
  `utils/encryption.ts:5-11` throw before boot if `JWT_SECRET`,
  `JWT_REFRESH_SECRET`, `FIELD_ENCRYPTION_KEY`, `BLIND_INDEX_KEY`, or
  `DATABASE_URL` are missing, and the two key-material vars are format-checked
  (64-hex-char). `.env` is gitignored (`.gitignore`). CORS has no wildcard
  fallback with credentials in production (`server.ts:49-64`).
- **Code review evidence in git:** `WORKLOG.local.md` documents a 22-commit
  incoming security-audit branch (SEC-01…SEC-16) reviewed by hand before
  merge, with 6 conflicts resolved manually and one critical bug (payment
  bypass) found only by reading the raw diff rather than trusting commit
  messages or automated checks.
- **Commit/documentation discipline:** `CLAUDE.md` mandates structured commit
  messages (why, not just what), `SEC-NN`/`VAL-NN`/`CFG-NN` audit labels, and
  ADRs for schema/API/security-boundary changes — and the actual commit log
  and `docs/decisions/` folder show this convention is followed in practice,
  not just documented aspirationally.

---

## 8. Known gaps

- **No automated tests anywhere.** Every fix described in the git history and
  ADRs (including a critical payment-bypass vulnerability) was verified by
  manual inspection or `tsc --noEmit`, not by a test suite. This is the
  single largest engineering gap in the project.
- **No CI/CD.** Nothing runs typecheck/build/lint automatically on push or PR.
- **Two `SEC-02 TODO`s still open** (`server.ts:38`, `payment.service.ts:67`):
  Premium and Boost checkout still validate Razorpay signature-only, without
  order-ownership checks, and Razorpay webhook-based verification (the
  "correct long-term answer" per ADR 0001) is explicitly deferred.
- **AWS Rekognition dependency installed but apparently unused** — no
  reference to `@aws-sdk/client-rekognition` found under `backend/src`; likely
  intended for automated student-ID verification but not wired up.
- **`utils/supabase.ts` filename vs. actual implementation** — worth
  double-checking before describing storage as "Supabase" on a resume; the
  file may wrap S3-compatible storage rather than the Supabase platform
  itself (not fully traced in this pass — verify directly).
- **`POST /v1/events` (creating an Event) has no auth middleware**
  (`events.routes.ts:51`) — distinct from the intentionally-public telemetry
  sink at the same path prefix; confirm whether this is deliberate (public
  event listing use case) or an oversight before describing the API as fully
  authenticated.
- **Ownership/consistency risk in routing:** auth/verification gating is
  applied per-router in `server.ts` rather than per-route, which has
  historically been a source of mismatches in this codebase per `CLAUDE.md`'s
  own warning about silent field/contract drift (e.g. past `plan` vs
  `planId` bug) — worth re-auditing route-by-route before launch.
- **`.catch(() => {})` error-swallowing** in socket presence updates
  (`socket/index.ts:31,74`) and a few Prisma calls — acceptable for
  best-effort online-status writes, but would silently hide real failures if
  extended to correctness-critical paths.
- **Several product surfaces are unfinished by design, not by omission** —
  see Section 4's "in progress" list (Sticker/Rizz Pack/See Who Shipped You
  entitlements unconsumed; Ship a Friend payment plumbing built but
  unwired). This is documented and intentional (`CLAUDE.md`), not hidden debt,
  but worth stating precisely rather than implying full monetization coverage.
- **Nothing has been deployed to production yet** as of the last commit in
  this repo (`WORKLOG.local.md`, 2026-07-28 entry: "Nothing deployed yet;
  freshers arrive Aug 1. Deployment is the critical path.") — confirm current
  deployment status yourself; do not claim a live launch without checking.

---

## 9. Resume bullets (drafts)

1. Designed and shipped the matching/discovery system for a campus social
   platform as an allocation-market problem rather than a recommender —
   implementing Jaccard-similarity ranking, per-user inbound capacity caps,
   and outbound rate budgets in TypeScript/Prisma/PostgreSQL to prevent
   attention concentration in a ~[VERIFY: 75:25] gender-skewed, [VERIFY:
   300–1,000]-user cold-start market.
2. Found and fixed a production payment-verification bypass in a merged
   security-audit branch by manually reviewing a 22-commit diff, where an
   unconditional mock-signature check would have let any client obtain every
   paid feature for free with real Razorpay credentials configured — wrote up
   the root cause and generalized fix as a permanent architecture decision
   record.
3. Designed a consumable-entitlement payment model (`IapPurchase`, dual
   `verifiedAt`/`consumedAt` timestamps, transactional redemption) to close a
   replay vulnerability where purchase verification and feature delivery were
   completely unlinked in the existing codebase.
4. Implemented field-level AES-256-GCM encryption with a separate
   HMAC-SHA256 blind-index column to support exact-match deduplication on
   encrypted PII (college email) without weakening the encryption's
   random-IV guarantee, in a Node/Express/Prisma backend handling DPDP-Act–
   scoped student data.
5. Built a real-time chat and matchmaking layer (Socket.IO, JWT-authenticated
   handshake, per-conversation membership-checked rooms, Redis-backed
   presence) supporting a scarcity-gated introduction flow that converts into
   persistent conversations across a React/React Native + Express stack.
6. Co-designed and maintained a two-person engineering practice for a
   ~19,000-line, [VERIFY: N]-week TypeScript monorepo (Express/Prisma/
   PostgreSQL backend, React web app, React Native/Expo mobile app) — writing
   formal architecture decision records and enforcing an audit-labeled
   (`SEC-NN`/`VAL-NN`) commit convention across independent contributors'
   security review passes.

---

## 10. What you must provide manually

Could not be determined from the repository — fill these in yourself:

- **User counts / traction:** signups, DAU/WAU, retention, verification
  completion rate, Rizz-session-to-chat conversion rate, Intro Cards
  generated/shared. `RESUME_NOTES.local.md` explicitly lists these as
  "fill in as they become real" and none had real values as of the last commit.
- **Launch date:** the repo indicates freshers "arrive Aug 1" as of the
  2026-07-28 worklog entry, but whether the app actually launched, on what
  date, and to how many users is not recorded in the repo itself.
- **Team size and role split beyond commit counts:** git attributes 34
  commits to `jtushya` and 28 to `Shivansh0911`, but *what fraction of design
  vs. implementation vs. review* each person owned isn't reliably derivable
  from commit messages alone — especially since `RESUME_NOTES.local.md`
  frames one contributor's 22-commit branch as a security-audit wave built
  independently. Confirm your actual role/title (e.g. "technical co-founder,"
  per your own local notes) before using it externally.
- **Company/product context:** whether this is a registered company, funding
  status, what "campus-by-campus" expansion actually means operationally
  (team size running the ground game, campus partnerships), and any business
  metrics (revenue, paying-user conversion on Premium/Boost).
- **Performance numbers:** p95 API latency, peak concurrent Socket.IO
  connections, database size/query performance under real load — none of
  this exists yet per the repo; the app has not been run against real traffic
  as far as this codebase shows.
- **Hosting/infrastructure specifics actually in production** (vs. what
  `DEPLOYMENT.md`/`docker-compose.yml` merely describe as intended) — confirm
  what's actually deployed, where, and its current status.
- **Any numbers marked `[VERIFY]` in Section 9** — the gender-skew ratio and
  user-count range come from `WORKLOG.local.md`'s working notes, not a
  measured, citable figure; confirm before publishing externally.
