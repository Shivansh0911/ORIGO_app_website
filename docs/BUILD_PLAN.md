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

### 1.0 ⬜ Onboarding + profile shape · **decided 2026-07-29**

**Signup:** Google sign-in (auto-verifies) → DOB → interests. That's it — they're in.
Intro Card is prompted **immediately after** signup, not inside it, so a user who
bounces off card creation is still a signed-up user.

**Drop the bio field from onboarding entirely.** Bio stays editable in profile
settings for those who want it; it is never asked for up front. Replace it with
**prompt answers** — "Hot take: ___" produces something specific, memorable and
conversation-starting; a bio produces "chill guy, love music and travelling."

**Profiles need 2–3 prompt answers**, not one — they're load-bearing for the
Hinge-style profile view (1.1) and for Rizz openers (1.3a).

> **Design context:** most users will sign up *from their room*, not at the
> stall. The stall is a boost channel, not the design constraint. This means we
> can ask for a richer profile than a queue would allow — a real photo, multiple
> prompts, considered answers.

### 1.1 ⬜ Discover — context-first browse, Hinge-style profile

> **Batch Space is cut.** It was a threads/messaging surface competing directly
> with the batch WhatsApp group every fresher is already in — an incumbent with
> 100% penetration, zero switching cost, and better messaging than we will ever
> ship. We don't fight that; those groups are our *distribution channel* (where
> Intro Cards get posted), not our competitor.
>
> What WhatsApp structurally cannot do is **structured discovery** — you can sit
> in a 200-person city group for a month and never learn who's in your branch.
> That capability survives, folded into Discover rather than given its own tab.

Two distinct layers. Hinge conflates them because dating only needs the second;
Origo needs both kept separate.

**Browse layer — context chips as filters over a list.**

- Chips with counts along the top: "Jaipur · 12" · "CSE · 34" · "Hostel D · 18"
- A list of people below. Tapping a chip **filters** the list; it does not
  navigate to a separate destination.
- Derived from `hometown` / `branch` / `joiningYear` / interests (task 1.10).
- **Senior badge** shown on profiles — replaces the ask-a-senior thread entirely.

> **Why filters, not destinations:** making contexts their own screens forces a
> choice before any content is visible, and dead-ends anyone who shares no
> context with the pool. Chips-over-list has no dead end, no forced step, and is
> less to build than either carousels or separate screens.

**No intent selector on Discover.** The DATING / FRIENDS / NETWORKING /
STUDY_BUDDY chips come off. Romantic discovery is opt-in via Radar ([0004](decisions/0004-dating-as-opt-in-episodic-surface.md)),
so surfacing "Dating" as a chip on the main people surface both contradicts that
and re-codes the app as a dating product. The engine still supports intents; the
UI runs `FRIENDS` and stops asking.

**Ranking within the list** uses the existing client engine (`matching.ts`) at
launch — the server ranker is Phase 3. Be honest about the stakes: ordering 12
people in a context is near-irrelevant, and that engine's value only arrives with
scale. Do not over-invest here before density exists.

**Profile layer — Hinge-style.** Photos interleaved with prompt answers, one
person at a time, full detail. This is where considered engagement happens.

**Reach out by reacting to a specific prompt** — that reaction becomes the Rizz
opener (see 1.3a). This is Hinge's genuinely good idea: you engage with
*content*, not a face, so the first message is specific by construction rather
than "hey".

> **Why not full Hinge-style browsing:** one-at-a-time is a bad way to answer
> "who's from my city" (a directory question), it exhausts a small pool fast,
> and it is unavoidably the dating-app interaction model — which cuts against
> the positioning. Split across two layers, we get the good part without that.

⚠️ Density tiers apply — see 1.1a.

### 1.1a ⬜ Density tiers — never show an empty room

Context clusters do **not** solve cold start; with 20 users there are no
clusters, and "Jaipur · 1" advertises that the app is empty at the worst
possible moment. Behaviour must change by population:

| Users | Discover shows |
|---|---|
| **< 40** | One list of everyone. No context cards, no counts. |
| **40–150** | Context cards appear **only at ≥5 members**; the rest fall into "Others on campus". |
| **150+** | Full context-first experience. |

- **Never render a count below 5.** Suppress the card instead.
- **No zero-state reads as failure.** Not "No one from your city yet" but
  "You're the first from Jaipur — your card will find them."

**Delete:** `BatchSpacePage.tsx`, `BATCH_INFO` from `lib/freshers/content.ts`,
`freshersStore.batchJoined`, and the `/app/batch` route.

**Acceptance:** a verified user with hometown + branch set sees at least two
populated rows on first load, without anyone having posted anything.

### 1.2 ✅ `POST /v1/events` sink + `AnalyticsEvent` model
Done 2026-07-29. Append-only table, batched, auth-optional, never fails the
request. See `backend/src/routes/events.routes.ts`.

### 1.3 ✅ Rizz allocation controls
Done 2026-07-29 — decline permanence, finite premium cap, inbound capacity cap
(`K=3`). All config in `backend/src/config/matching.ts`, env-overridable.
Closes B1, B2.

### 1.3a ✅ Rizz — consecutive-message cap + opaque declines
Done 2026-07-29 — max 2 consecutive messages, `DECLINED` masked to `EXPIRED`
for the initiator. See `rizz.service.ts`. Openers-from-prompt-reactions still
waits on the Discover rewrite (1.1).

### 1.4 ✅ Ship a Friend — relax eligibility + enforce privacy
Done 2026-07-29 — campus-wide eligibility, `allowShipsFrom` enforced, daily cap.
Closes B4. Extended 2026-07-29 by Shivansh with block-checks across all three
parties and clearer error handling — same shape, no conflict.

### 1.5 ✅ Tab restructure → 3 tabs
Done 2026-08-05. Seven nav slots collapsed to three, each answering one
question:

| Tab | Question it answers | Contains |
|---|---|---|
| **Campus** | *What's happening?* | Happening (events) · Pulse · Quests · Communities · Senior Connect |
| **People** | *Who's here?* | Discover · Ship a Friend |
| **Chats** | *Who am I talking to?* | Rizz sessions · conversations |

Campus is the default landing tab (`/app/freshers`) — a group-shaped surface
first, so the app doesn't read as a people-browsing product on open. Nothing
lost its route; Pulse/Rizz/Ship/Profile are cross-linked from inside the tab
that now hosts them instead of holding their own primary nav slot. Profile
moved to the avatar (mobile header, desktop sidebar footer) rather than a tab.

Found and fixed while touching Campus's quick-links: a dead `/app/batch` link
(Batch Space was deleted earlier this session; this reference was missed) and
a `/app/met` (We Met) link, which is out of scope — see 1.6. Both removed.

### 1.6 🟨 Hide out-of-scope surfaces behind a flag
Revised list, decided 2026-08-05 — **Quests stays** (it drives exactly the
onboarding actions we need this week: profile, Intro Card, communities) and
**Freshers HQ hub can't be hidden, it's now the Campus tab** (1.5). Hide —
do not delete. Empty surfaces are the main cause of "this app is dead."

- ✅ **Premium** — the only actual entry point anywhere in the frontend (a
  button on ProfilePage) removed. Route/page untouched, just not promoted.
- ✅ **Boost, Sticker Pack, Rizz Pack, See Who Shipped You** — checked; none
  of the four have ever had any frontend reference at all (grepped for
  their route/service symbols across origo-web). Nothing to hide — they
  were never wired to a UI in the first place.
- ⬜ **We Met** — dead link into it already removed from Campus's quick
  links (1.5), but the route/page itself still exists and isn't guarded.

### 1.7 ✅ Discover: interim de-dating (do now, ahead of the full rewrite)

> **⚠️ For Shivansh — flagging directly, since this shipped after your BLOCK-3
> commit and you likely haven't seen [0004](decisions/0004-dating-as-opt-in-episodic-surface.md) yet:**
> Discover's intent chips still include `DATING` as a first-class option on the
> main people surface. That's a considered decision we reversed — romantic
> discovery is opt-in via Radar, never the default surface, because the moment
> Origo reads as a dating app to a new user, the majority who'd never install
> one are gone, and they're the network. Your BLOCK-3 graph/responsiveness
> wiring is unaffected and still correct under the fix below — it scores
> candidates regardless of which intents the UI exposes.

The full Discover rewrite (chips-over-list + Hinge-style profiles, 1.1) is on
`feat/discover-redesign` and deliberately deferred — it's the biggest, riskiest
piece and everything else ships without it. But leaving `DATING` visible on the
current swipe UI until that lands means launching with exactly the positioning
problem we spent a session arguing against. So: a small interim fix, decoupled
from the rewrite —

- Remove `DATING` from the intent chip options on the current Discover page.
  Engine still supports the intent; UI defaults to and only offers `FRIENDS` /
  `NETWORKING` / `STUDY_BUDDY` until the rewrite ships.
- Relabel `Like`/`Pass` → `Say hi`/`Skip` on the existing swipe cards — "Pass" is
  a judgment on a person you'll sit next to in lab tomorrow.
- This is throwaway UI churn once 1.1 lands, and that's fine — it's ten minutes
  against a real positioning risk for the gap in between.

### 1.8 ⬜ Manual verification approval
Fallback for the first week if a fresher's college email isn't issued yet.
Admin-only endpoint to approve a pending user + a minimal list UI. Student-ID
upload already exists (`uploadStudentId`, private Supabase bucket).

### 1.9a ✅ Pulse — author-set response cap
Done 2026-07-29 — `maxResponses` on creation, enforced on response, status
flips to `FULFILLED` at cap. Closes B3. Details below for reference.
Closes B3 (uncapped inbound via Pulse) without imposing an arbitrary limit: the
**author chooses how many people they want**, which is consent by their own
choice rather than a rule we impose.

- `Pulse.maxResponses Int` — author picks at creation. Default 3, hard max from
  config (`PULSE_MAX_RESPONSES`, start at 10) so a careless 100 can't reopen the
  flooding hole.
- **`TALK` is demoted, not cut.** Order it last, keep it out of featured
  placeholders and examples, and default it to a lower cap (1–2). "Need someone
  to vent to" from an 18-year-old is a vulnerability broadcast and will attract
  the wrong responders — it shouldn't be what a new user sees first. CHILL /
  MOVE / PLAY take centre stage.
- UI: a small stepper on the compose sheet — *"How many people?"* Shows
  remaining slots on the card ("2 spots left") which also creates urgency.
- At cap → status `FULL`, hidden from feed, no further responses accepted.
- The author's chosen cap **overrides** the general inbound Rizz cap for that
  Pulse — they explicitly invited these people, up to a number they picked.

**Responding still consumes the responder's daily Rizz budget.** This is
deliberate and must not be "optimised away": without it, Pulse is a total bypass
of the Rizz limits — respond to 40 pulses, get 40 conversations, never touch the
cap. Make the UI honest about it ("Responding starts a Rizz session").

### 1.9 ✅ Happening — real content plumbing · **content ownership: Shivansh**
Done 2026-07-30 — `HappeningEvent` model, `GET /v1/happening` (campus-scoped,
sorted by `startAt`), frontend rewired to fetch it, sponsored-card logic
deleted entirely (out of scope for launch). Seeded with 3 generic placeholder
events (orientation / club fair / prom) scoped to the real campus name.

**Content itself is still Shivansh's, with a weekly update commitment** — the
plumbing being done doesn't mean the job is done. Replace the 3 placeholders
with real dates/venues before Aug 1, and keep adding through arrival week.
This is the only surface whose content we fully control, which makes it the
day-one hero — the app is never empty regardless of user count if this has
15 real events in it. It also goes stale fastest, and a stale events list is
visible evidence of abandonment.

> ⚠️ **Found while wiring this up:** `backend/prisma/seed.ts`'s mock users are
> scoped to `collegeName: 'IIT Delhi'`, not the real campus name
> (`BITS Pilani — Hyderabad Campus` per `collegeDomains.ts`). A genuinely
> BITS-verified test account will never see the mock users in Discover, and
> now won't see mock Happening content either unless seeded separately (which
> this commit does, scoped correctly). Worth fixing the mock data's campus
> name at some point so local testing reflects reality — not urgent, but it
> will confuse whoever debugs "why is Discover empty for my test account" next.

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

## Recent activity (folded in from `ORIGO_STATUS.md`, 2026-07-29/30)

Shivansh shipped three commits independently, all reviewed and aligned except
the one flagged in 1.7 above:

- **BLOCK-3 — Discover graph/responsiveness wiring.** `discover.service.ts` now
  returns `communities[]` and a `responsiveness` proxy per candidate, and
  `DiscoverPage.tsx` feeds them into `rankCandidates` as `contextById`. This
  activates the Adamic–Adar graph term (`matching.ts`'s dominant weight for
  `FRIENDS`, 0.34), which was silently zeroed since it had no data to score
  against. Correctly advances [matching-spec](matching-spec.md) §3–5 ahead of
  schedule — the ranking engine work survives the Discover UI rewrite (1.1)
  regardless of which layout consumes it.
- **Chat WebSocket fix.** Real root-cause diagnosis: the Socket.IO connection
  handler awaited ~200-800ms of Redis+Supabase writes *before* registering
  `join_conversation`, so a client that joined immediately on connect lost the
  event before the listener existed. Fixed by making the handler synchronous
  and firing presence updates fire-and-forget. Also closed three
  service/frontend type-shape mismatches (`getConversations`, `getMessages`,
  event name casing) and the same Rizz `ACCEPTED` dead-end fixed independently
  in BLOCK-3. Verified with an actual WS test script, not just typecheck.
- **Moderation.** Replaced the placeholder 6-regex list with the `bad-words`
  npm package (already a dependency) plus the Hindi/Hinglish patterns it
  misses. Closes the SEC-10 stub note.

`ORIGO_STATUS.md` (root-level doc he wrote, overlapping this file) has been
folded in and removed — see "Secrets, storage, file map" below for what it
added that this doc didn't already have.

## Known bugs — fix alongside the phase they belong to

Found by inspection this cycle. Each is real and verified in code; none were
caught by typecheck or tests.

| # | Bug | Where | Severity |
|---|---|---|---|
| B1 ✅ | **Declined Rizz can be revived.** `startSession` rejects only `ACTIVE`/`WAITING`/`ACCEPTED`; a `DECLINED` session falls through to the trailing `upsert`, which resets counters and reactivates it. A declined user can re-approach immediately, forever. | `rizz.service.ts:15-39` | **Critical** — harassment vector |
| B2 ✅ | **Premium bypasses the Rizz daily limit entirely.** `if (!initiator?.isPremium)` skips the cap, so a paying user can cold-contact unlimited people. On a 75:25 campus this sells the ability to flood the minority side. | `rizz.service.ts:26` | **Critical** |
| B3 ✅ | **Pulse responses spawn uncapped Rizz sessions.** `respondToPulse` calls `RizzService.startSession` per responder, so a popular Pulse generates unbounded inbound sessions — the flooding hole again, through a different door. Fixed by the author-set cap (1.9a). *Note: the budget consumption is correct and must stay — see 1.9a.* | `pulse.service.ts:88-109` | **High** |
| B4 ✅ | **`UserPrivacy.allowShipsFrom` is never enforced.** The field exists in the schema and is checked nowhere in the backend. The privacy toggle is decorative — users who disabled ships still receive them. | schema vs `ship.service.ts` | **High** — privacy |
| B5 ✅ | ~~Batch Space is entirely a mock~~ — resolved by cutting the feature (task 1.1). Delete the dead code rather than fixing it. | `BatchSpacePage.tsx` | Closed |
| B6 ✅ | **Telemetry posts to a route that doesn't exist.** Client buffers, retries, and silently drops. All product data since launch of the pipeline is lost. | `telemetry.ts:93` | **High** — see 1.2 |
| B7 ⬜ | **Discover scores only the 100 most-recently-active users.** A highly compatible but less-active person is unreachable regardless of score. | `discover.service.ts:79-88` | **Medium** — see 3.1 |
| B8 ⬜ | **Premium + Boost don't validate order ownership.** Unlike the IAP flow, `verifyAndActivate`/`activateBoost` check only that the HMAC is valid — not that the order was raised for this user and hasn't been redeemed. Low risk while the secret stays private; must close before real keys. | `payment.service.ts` (`SEC-02 TODO`) | **Medium** |
| B9 ✅ | **Razorpay env validation — revised from the original bug.** The original framing ("require real keys in prod") would have blocked Phase 0 deploy, since pseudo-mode is the *intentional* state — payments are cut from launch scope. Fixed instead: reject exactly-one-of-`RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` set (a config mistake, never deliberate) and log a loud non-blocking warning when pseudo-mode is active in production, so it's never silently forgotten if payments come back in scope later. | `server.ts` | Closed |
| B10 ✅ | **Stale docs contradict the current plan.** `docs/ROADMAP.md`, `docs/CHECKLIST.md`, and `origo-web/IMPLEMENTATION.md` all describe the superseded ML-first matching phasing and a feature set we've since cut. Anyone (or any model) reading them will build the wrong thing. Add a superseded banner pointing here + to `decisions/0003`. | `docs/` | **Medium** — misleads contributors |

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
| Intro Card prompted **after** signup, not inside it | 1.0 |
| Bio dropped from onboarding; replaced by 2–3 prompt answers | 1.0 |
| Discover = context **filter chips over a list** + Hinge-style profile; reach out by reacting to a prompt | 1.1 |
| No intent selector on Discover — "Dating" comes off the main people surface entirely | 1.1 |
| Swipe card stack + Like/Pass deleted, not relabelled | 1.7 |
| Density tiers — never show a cluster count below 5 | 1.1a |
| Rizz: max 2 consecutive messages without a reply | 1.3a |
| Declines never surfaced to the initiator (shown as expired) | 1.3a |
| Pulse `TALK` demoted — kept, but never centre stage | 1.9a |
| Happening owned by **Shivansh**, weekly updates | 1.9 |
| **Intro Card requires a photo**; signup does not | 1.0 / 2.3 |
| Most users sign up from their room — stall is a boost channel, not the design constraint | 1.0 |
| Happening ships, manually curated, no sponsored cards | 1.9 |
| Payments/Premium cut from launch | 1.6 |
| Behavioural data collected under a specific notice + business-transfer clause | — |

## Open questions

1. Prom date confirmation (Aug 23 vs 29) — sets the Phase 4 deadline.
2. Do `h` (higher degree) and `p` (PhD) students belong in the same discovery
   pool as first-degree students, or should `degreeType` filter the default view?
   Now that we can derive it reliably, it's a product call worth making
   deliberately rather than by default.
3. Which prompts ship at launch? Needs ~8 written, each with 2–3 suggested
   answers so the field is never blank. These carry the profile, the Intro Card,
   and the Rizz opener — worth writing carefully rather than generating.

## Explicitly out of scope for launch

We Met · Freshers Quests · Premium · Profile Boost · Sticker/Rizz/ViewShips IAP ·
sponsored cards · cross-campus discovery · any ML ranker · native mobile app.

Hidden behind flags, not deleted. Each returns when there's density to justify it.

---

## Reference — secrets, storage, architecture

Folded in from `ORIGO_STATUS.md`. Kept here rather than in a second doc so there
is one place this can go stale.

### Secrets required in production

```
DATABASE_URL          # Postgres
REDIS_URL             # rediss:// (TLS) if using Upstash — plain redis:// hangs on auth otherwise
JWT_SECRET            # 64-hex random
JWT_REFRESH_SECRET    # 64-hex random
FIELD_ENCRYPTION_KEY  # 64-hex random (AES-256-GCM)
BLIND_INDEX_KEY       # 64-hex random (HMAC blind index)
RESEND_API_KEY        # college email OTP fallback path
GOOGLE_CLIENT_ID      # Google OAuth
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
# Deliberately NOT set in prod yet — pseudo-mode is intentional, Ship is free for v1:
# RAZORPAY_KEY_ID
# RAZORPAY_KEY_SECRET
```

Server throws at boot if any required secret is missing or malformed (SEC-01/
SEC-03). Do not add fallback defaults.

### Supabase Storage

Two buckets: `origo` (**public** — avatars) and `origo-private` (**private** —
student ID uploads for manual verification review).

### Architecture snapshot

| Layer | Stack |
|---|---|
| Web | React 18 + Vite + TS · Tailwind · TanStack Query · Zustand |
| Backend | Express + TS · Prisma · Postgres |
| Real-time | Socket.IO, JWT auth handshake, per-room events |
| Cache / rate limit | Redis (Upstash `rediss://` in prod) |
| Storage | Supabase Storage (see above) |
| Email | Resend (OTP fallback only) |
| Payments | Razorpay, pseudo-mode until real keys are set |
| Mobile | Expo app exists in `origo-app/`, **not shipped** — web shows "Coming Soon" |

### File map — where things live

```
backend/src/
  config/
    collegeDomains.ts   # campus allowlist — do NOT expand without Aryan
    matching.ts         # all allocation limits, env-overridable
  services/
    rizz.service.ts | discover.service.ts | ship.service.ts | pulse.service.ts
    payment.service.ts  # pseudo-mode when Razorpay keys absent
  routes/events.routes.ts  # analytics sink
  prisma/schema.prisma, prisma/migrations/

origo-web/src/
  lib/
    matching.ts    # client-side ranking engine — portable to backend, don't fork logic
    introCard.ts   # canvas renderer for the Intro Card
    telemetry.ts   # track() — consent-gated, batched
  pages/app/
    DiscoverPage.tsx | RizzChatPage.tsx | PulsePage.tsx | ShipAFriendPage.tsx
```
