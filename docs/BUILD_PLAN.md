# Build Plan — Launch

**The single source of truth for what to build and in what order.** Updated as
decisions are made. If this contradicts another doc, this wins for *sequencing*;
`decisions/` wins for *reasoning*.

- **Campus opens:** Aug 1, 2026 · freshers arriving from ~Jul 30
- **Prom:** ~Aug 23 or Aug 29 (all-campus) — date TBC
- **Currently deployed:** nothing

**Read first:** [THESIS.md](THESIS.md) — every task below should ladder to
"Origo is how you find your people on campus." If a task doesn't, question it.

Status: ⬜ not started · 🟨 in progress · ✅ done · ❄️ deferred (out of scope for launch)

---

## Phase 0 — Deploy · **by Jul 30** · CRITICAL PATH

Nothing else matters until Origo exists on the internet. No feature work in this
phase.

| # | Task | Notes |
|---|---|---|
| 0.1 ⬜ | Provision Postgres (Neon or Supabase free tier) | → `DATABASE_URL` |
| 0.2 ⬜ | Provision Redis (Upstash free tier) | → `REDIS_URL`. Required: rate limiters + OTP storage |
| 0.3 ⬜ | Generate + set all secrets | `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FIELD_ENCRYPTION_KEY`, `BLIND_INDEX_KEY` (each 64-hex). **Server refuses to boot without these — by design** |
| 0.4 ⬜ | `npx prisma migrate deploy` | 3 migrations pending incl. `20260728120000_add_iap_purchase` |
| 0.5 ⬜ | **Seed the `Interest` table** | ⚠️ Onboarding's interest picker is empty without this and signup dead-ends |
| 0.6 ⬜ | Google OAuth: client ID + authorised origins | Must include the Vercel URL **and** `localhost:3000` |
| 0.7 ⬜ | Deploy backend (Railway / Render) | Set `ALLOWED_ORIGINS` to the real web origin — CORS fails closed in production |
| 0.8 ⬜ | Deploy web (Vercel) | Set `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID` |
| 0.9 ⬜ | **End-to-end smoke test on production** | Google sign-in → auto-verify → profile → discover → send Rizz → reply → chat. Do this manually, on a phone, on campus wifi |

**Resend/email is NOT on the critical path.** BITS uses Google Workspace, so
Google Sign-In auto-verifies via the `hd` claim (`backend/src/utils/collegeDomains.ts`).
Email OTP is the fallback path only.

---

## Phase 1 — Launch blockers · **Jul 30 → Aug 1**

### 1.1 ⬜ Discover, grouped by context — **replaces Batch Space**

> **Batch Space is cut.** It was a threads/messaging surface competing directly
> with the batch WhatsApp group every fresher is already in — an incumbent with
> 100% penetration, zero switching cost, and better messaging than we will ever
> ship. We don't fight that; those groups are our *distribution channel* (where
> Intro Cards get posted), not our competitor.
>
> What WhatsApp structurally cannot do is **structured discovery** — you can sit
> in a 200-person city group for a month and never learn who's in your branch.
> That capability survives, folded into Discover rather than given its own tab.

Replace the single ranked list with **context-grouped rows**:

- "From Jaipur (12)" · "In CSE (34)" · "In Hostel D (18)" · "Also into F1 (7)"
- Groups derive from `hometown` / `branch` / `batchYear` / interests (task 1.10).
- Each row is horizontally scrollable; tapping a person opens their profile.
- A person appears in multiple rows — that's a feature, it's how you notice
  overlap ("she's from my city *and* in my branch").
- **Senior badge** on profiles replaces the ask-a-senior thread entirely.

**Why this works at cold start:** rows populate by derivation the moment someone
verifies. Zero posts required, so there is no visible emptiness — the value is
the people, not the content.

**Delete:** `BatchSpacePage.tsx`, `BATCH_INFO` from `lib/freshers/content.ts`,
`freshersStore.batchJoined`, and the `/app/batch` route.

**Acceptance:** a verified user with hometown + branch set sees at least two
populated rows on first load, without anyone having posted anything.

### 1.2 ⬜ `POST /v1/events` sink + `AnalyticsEvent` model
The web client already emits batched, consent-gated telemetry to this endpoint —
**it does not exist**, so every event is dropped after buffering. See
`origo-web/src/lib/telemetry.ts`.

- Append-only table: `name`, `props` (Json), `userId?`, `sessionId`, `ts`, `receivedAt`.
- Accept batches (`{ events: [...] }`), validate loosely, never fail the request.
- ⚠️ Build this **before** launch traffic. This data cannot be backfilled.

### 1.3 ⬜ Rizz allocation controls
Per [decisions/0003](decisions/0003-matching-strategy.md) Layer 0 + [matching-spec §6](matching-spec.md).

- **Decline is permanent.** Currently a `DECLINED` session is revived by the
  trailing `upsert` with counters reset — a declined user can re-approach
  immediately and indefinitely. *Harassment vector; fix first.*
- **Cap premium.** `if (!initiator?.isPremium)` exempts premium from the daily
  limit entirely. Apply a finite higher limit instead.
- **Inbound capacity cap.** Reject when target holds ≥ `K` pending
  (`ACTIVE`|`WAITING`) sessions. `K = 3`, env-configurable.
- Config in `backend/src/config/matching.ts`, all env-overridable — these need
  tuning *during* freshers week without a redeploy.

### 1.4 ⬜ Ship a Friend — relax eligibility + enforce privacy
- Eligibility: anyone in your batch/campus, **not** only accepted matches
  (currently requires 2 accepted matches — unusable on day 1).
- **Enforce `UserPrivacy.allowShipsFrom`** — the field exists and is checked
  *nowhere* in the backend. The privacy toggle is currently decorative.
- Rate-limit ships per user per day.

### 1.5 ⬜ Tab restructure → 3 tabs
Each tab answers exactly one question:

| Tab | Question it answers | Contains |
|---|---|---|
| **Campus** | *What's happening?* | Happening (events) · Pulse (right now) |
| **People** | *Who's here?* | Discover w/ context clusters · Ship a Friend |
| **Chats** | *Who am I talking to?* | Rizz sessions · conversations |

Campus is the default landing tab — a group-shaped surface first, so the app
doesn't read as a people-browsing product on open.

### 1.6 ⬜ Hide out-of-scope surfaces behind a flag
We Met, Quests, Premium, Boost, Sticker/Rizz/ViewShips, Freshers HQ hub.
Hide — do not delete. Empty surfaces are the main cause of "this app is dead."

### 1.7 ⬜ Discover: change the action verbs
`Like` / `Pass` → **`Say hi` / `Skip`**. Copy-only change. "Pass" is a judgment
on a person you'll sit next to in lab tomorrow; different social weight than an
anonymous city-wide app.

### 1.8 ⬜ Manual verification approval
Fallback for the first week if a fresher's college email isn't issued yet.
Admin-only endpoint to approve a pending user + a minimal list UI. Student-ID
upload already exists (`uploadStudentId`, private Supabase bucket).

### 1.9a ⬜ Pulse — author-set response cap
Closes B3 (uncapped inbound via Pulse) without imposing an arbitrary limit: the
**author chooses how many people they want**, which is consent by their own
choice rather than a rule we impose.

- `Pulse.maxResponses Int` — author picks at creation. Default 3, hard max from
  config (`PULSE_MAX_RESPONSES`, start at 10) so a careless 100 can't reopen the
  flooding hole.
- UI: a small stepper on the compose sheet — *"How many people?"* Shows
  remaining slots on the card ("2 spots left") which also creates urgency.
- At cap → status `FULL`, hidden from feed, no further responses accepted.
- The author's chosen cap **overrides** the general inbound Rizz cap for that
  Pulse — they explicitly invited these people, up to a number they picked.

**Responding still consumes the responder's daily Rizz budget.** This is
deliberate and must not be "optimised away": without it, Pulse is a total bypass
of the Rizz limits — respond to 40 pulses, get 40 conversations, never touch the
cap. Make the UI honest about it ("Responding starts a Rizz session").

### 1.9 ⬜ Happening — real content
Cut sponsored cards. Add a way for the team to enter real orientation events
(admin endpoint or direct DB seed is fine). During orientation this should
simply be the best campus schedule that exists.

### 1.10 ⬜ Persist `joiningYear`, `degreeType`, `branch`, `hometown` on `User`
`IntroCardPage` collects branch/batch/hometown and throws them all away (local
state only). These are the strongest cold-start signals for matching **and** they
power the Discover context rows (1.1).

**Derive batch + degree from the verified college email — never self-report.**
BITS IDs encode both:

```
f20230141
│ │    └── ID number (4 digits)
│ └─────── joining year (4 digits) → 2023
└───────── degree type: f = first degree · h = higher degree · p = PhD
```

```ts
// local part of the verified college email
const m = /^([fhp])(\d{4})(\d{4})$/i.exec(localPart);
// m[1] → degreeType, m[2] → joiningYear, m[3] → idNumber
```

- Parse on verification (both the Google Workspace path and the OTP path).
- `joiningYear` and `degreeType` are **read-only** to the user — deriving them
  from a verified credential is what makes cohort membership trustworthy.
- Parse failure (transfers, legacy formats) → leave null and fall back to
  self-report. Never block verification on a parse failure.
- `branch` and `hometown` stay user-editable; they aren't in the ID.

> **Naming convention — get this right.** BITS students identify by **joining
> year** ("23 batch"), not passout year. Our copy currently defaults to
> `"Batch of '30"` (`IntroCardPage.tsx`), which is the passout convention and
> reads as outsider-written. Use joining year everywhere. Passout isn't reliably
> derivable anyway — a 4-year B.E. and a 5-year dual degree from the same intake
> graduate in different years.

---

## Phase 2 — Arrival week · **Aug 1 → 6**

| # | Task |
|---|---|
| 2.1 ⬜ | QR posters, one distinct `?src=` per location (hostel-d, mess-a, admin-block, orientation-stall) |
| 2.2 ⬜ | QR landing page must be **public** — a scan that hits a login wall converts terribly |
| 2.3 ⬜ | Intro Card: `?src=introcard&by=<username>` for viral attribution + a copy-paste caption |
| 2.4 ⬜ | Watch the concentration metric daily; tune `K` / outbound budget |
| 2.5 ⬜ | Ops: seed real events, recruit ~10 seniors, staff the orientation stall |

---

## Phase 3 — Density · **Aug 7 → 20**

| # | Task |
|---|---|
| 3.1 ⬜ | Server-side ranker per [matching-spec](matching-spec.md) §3–5; delete the `take: 100 orderBy lastSeen` pre-filter |
| 3.2 ⬜ | `DiscoveryImpression` + `RizzOutcome` logging (spec §7) incl. flagged exploration slots |
| 3.3 ⬜ | Discover → context rows ("From your hometown (7)", "In CSE (12)") instead of a card stack |
| 3.4 ⬜ | Senior badge on profiles + pinned ask-a-senior thread |
| 3.5 ⬜ | Real communities beyond the batch (only once batch density justifies it) |

---

## Phase 4 — Prom Radar · **Aug 20 → 29**

The retention weapon, landing on the week-3/4 churn cliff by design.
All-campus (max participation expected from freshers + sophomores).

| # | Task |
|---|---|
| 4.1 ⬜ | `RadarEvent` + `RadarParticipant` models; opt-in window with open/close times |
| 4.2 ⬜ | Date mode **and** group/table mode — group mode is first-class, not a consolation |
| 4.3 ⬜ | Stable-matching assignment computed at window close ([0004](decisions/0004-dating-as-opt-in-episodic-surface.md)) |
| 4.4 ⬜ | Minimum-participation threshold before a window opens |
| 4.5 ⬜ | Measure per-gender opt-in rate — report honestly even if ugly |

---

## Known bugs — fix alongside the phase they belong to

Found by inspection this cycle. Each is real and verified in code; none were
caught by typecheck or tests.

| # | Bug | Where | Severity |
|---|---|---|---|
| B1 ⬜ | **Declined Rizz can be revived.** `startSession` rejects only `ACTIVE`/`WAITING`/`ACCEPTED`; a `DECLINED` session falls through to the trailing `upsert`, which resets counters and reactivates it. A declined user can re-approach immediately, forever. | `rizz.service.ts:15-39` | **Critical** — harassment vector |
| B2 ⬜ | **Premium bypasses the Rizz daily limit entirely.** `if (!initiator?.isPremium)` skips the cap, so a paying user can cold-contact unlimited people. On a 75:25 campus this sells the ability to flood the minority side. | `rizz.service.ts:26` | **Critical** |
| B3 ⬜ | **Pulse responses spawn uncapped Rizz sessions.** `respondToPulse` calls `RizzService.startSession` per responder, so a popular Pulse generates unbounded inbound sessions — the flooding hole again, through a different door. Fixed by the author-set cap (1.9a). *Note: the budget consumption is correct and must stay — see 1.9a.* | `pulse.service.ts:88-109` | **High** |
| B4 ⬜ | **`UserPrivacy.allowShipsFrom` is never enforced.** The field exists in the schema and is checked nowhere in the backend. The privacy toggle is decorative — users who disabled ships still receive them. | schema vs `ship.service.ts` | **High** — privacy |
| B5 ✅ | ~~Batch Space is entirely a mock~~ — resolved by cutting the feature (task 1.1). Delete the dead code rather than fixing it. | `BatchSpacePage.tsx` | Closed |
| B6 ⬜ | **Telemetry posts to a route that doesn't exist.** Client buffers, retries, and silently drops. All product data since launch of the pipeline is lost. | `telemetry.ts:93` | **High** — see 1.2 |
| B7 ⬜ | **Discover scores only the 100 most-recently-active users.** A highly compatible but less-active person is unreachable regardless of score. | `discover.service.ts:79-88` | **Medium** — see 3.1 |
| B8 ⬜ | **Premium + Boost don't validate order ownership.** Unlike the IAP flow, `verifyAndActivate`/`activateBoost` check only that the HMAC is valid — not that the order was raised for this user and hasn't been redeemed. Low risk while the secret stays private; must close before real keys. | `payment.service.ts` (`SEC-02 TODO`) | **Medium** |
| B9 ⬜ | **Production without Razorpay keys silently accepts mock payments.** Pseudo-mode keys off "are real credentials present", so a deploy that forgets them accepts `mock_sig`. Add `RAZORPAY_KEY_*` to `checkEnv()` so production refuses to boot without them. | `payment.service.ts` + `server.ts` | **Medium** |
| B10 ⬜ | **Stale docs contradict the current plan.** `docs/ROADMAP.md`, `docs/CHECKLIST.md`, and `origo-web/IMPLEMENTATION.md` all describe the superseded ML-first matching phasing and a feature set we've since cut. Anyone (or any model) reading them will build the wrong thing. Add a superseded banner pointing here + to `decisions/0003`. | `docs/` | **Medium** — misleads contributors |

## Decisions settled

| Decision | Where |
|---|---|
| Socialising platform, not a dating app — hard constraint on defaults | [THESIS](THESIS.md) |
| `FRIENDS` outranks `DATING` as default intent | ✅ done (`matching.ts`) |
| Romantic discovery is opt-in + episodic (Radar), never the default surface | [0004](decisions/0004-dating-as-opt-in-episodic-surface.md) |
| Matching = allocation problem, not prediction. No ML at launch | [0003](decisions/0003-matching-strategy.md) |
| Gale–Shapley for Radar windows only, never the continuous feed | [0004](decisions/0004-dating-as-opt-in-episodic-surface.md) |
| Google Workspace `hd` auto-verify is the primary path; email OTP is fallback | Phase 0 |
| All users assumed 18+; existing `RegisterSchema` gate stands unchanged | — |
| **Batch Space cut.** Don't fight WhatsApp on messaging — it has 100% penetration and no switching cost. Those groups are our distribution channel, not our competitor. Structured discovery (what WhatsApp *can't* do) folds into Discover | 1.1 |
| Ship a Friend ships at launch with relaxed eligibility | 1.4 |
| Pulse ships, inside Campus rather than its own tab | 1.5 |
| Batch + degree type derived from the verified BITS email ID, never self-reported | 1.10 |
| Cohorts named by **joining year** ("23 batch"), not passout — matches how students actually speak | 1.10 |
| Pulse response cap is set by the author, bounded by config max | 1.9a |
| Happening ships, manually curated, no sponsored cards | 1.9 |
| Payments/Premium cut from launch | 1.6 |
| Behavioural data collected under a specific notice + business-transfer clause | — |

## Open questions

1. Prom date confirmation (Aug 23 vs 29) — sets the Phase 4 deadline.
2. Do `h` (higher degree) and `p` (PhD) students belong in the same discovery
   pool as first-degree students, or should `degreeType` filter the default view?
   Now that we can derive it reliably, it's a product call worth making
   deliberately rather than by default.

## Explicitly out of scope for launch

We Met · Freshers Quests · Premium · Profile Boost · Sticker/Rizz/ViewShips IAP ·
sponsored cards · cross-campus discovery · any ML ranker · native mobile app.

Hidden behind flags, not deleted. Each returns when there's density to justify it.
