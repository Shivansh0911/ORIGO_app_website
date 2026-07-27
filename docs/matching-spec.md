# Matching — Implementation Spec

Implementation contract for the design decided in
[decisions/0003](decisions/0003-matching-strategy.md) and
[decisions/0004](decisions/0004-dating-as-opt-in-episodic-surface.md).
**Read both before changing anything here.** This document says *what to build*;
those say *why*, and the why is load-bearing.

Everything below is sized for **300–1,000 users on one campus**. Full table
scans are correct at this scale. Do not add caching, denormalisation, or
approximate retrieval — they cost correctness and buy nothing yet.

---

## 0. Non-goals (do not build these)

- No ML model, no embeddings, no two-tower retrieval. There is not enough
  labelled data; a learned model would lose to this heuristic.
- No Gale–Shapley in the continuous feed. (It belongs in Radar events only —
  §8, later phase.)
- No approximate nearest-neighbour / vector search.

---

## 1. Schema changes (`backend/prisma/schema.prisma`)

### 1.1 `User` — new fields

```prisma
batchYear      Int?      // e.g. 2030 — graduating batch
branch         String?   // e.g. "CSE"
hometown       String?   // free text, normalised lowercase on write
openToDating   Boolean   @default(false)
datingOptInAt  DateTime?

@@index([collegeName, batchYear])
```

> **Note:** `IntroCardPage.tsx` already collects branch/batch/hometown but only
> as local component state — it is never persisted. These are the strongest
> cold-start signals available for freshers and are currently thrown away.
> Persist them from the intro-card flow and from profile edit.

### 1.2 New enum + models

```prisma
enum RizzOutcomeType {
  DECLINED
  EXPIRED_UNOPENED
  EXPIRED_AFTER_READ
  CONVERTED_TO_CHAT
  CHAT_SURVIVED        // ≥10 messages exchanged post-unlock
  BLOCKED_AFTER
}

enum DiscoverySurface {
  SOCIAL
  ROMANTIC
}

/// One row per candidate shown in a ranked feed. Negatives — candidates shown
/// and NOT acted on — are the majority of any future training set and cannot
/// be reconstructed later. This table exists to be boring and append-only.
model DiscoveryImpression {
  id             String           @id @default(cuid())
  viewerId       String
  candidateId    String
  surface        DiscoverySurface
  intent         String
  rank           Int
  score          Float
  wasExploration Boolean          @default(false)
  createdAt      DateTime         @default(now())
  viewer         User             @relation("ImpressionViewer", fields: [viewerId], references: [id], onDelete: Cascade)

  @@index([viewerId, createdAt])
  @@index([candidateId, createdAt])
}

/// Terminal outcome of a Rizz session. Written exactly once, by whichever code
/// path ends the session (reply, decline, expiry job, block).
model RizzOutcome {
  id               String          @id @default(cuid())
  sessionId        String          @unique
  initiatorId      String
  targetId         String
  outcome          RizzOutcomeType
  initiatorMsgs    Int
  timeToOutcomeSec Int
  fromExploration  Boolean         @default(false)
  createdAt        DateTime        @default(now())

  @@index([targetId, outcome])
  @@index([initiatorId, outcome])
}
```

Add the matching back-relation on `User` (`impressions DiscoveryImpression[] @relation("ImpressionViewer")`).

**Retention:** `DiscoveryImpression` grows ~50–100k rows/day at 1k users. Add a
scheduled job to delete rows older than 90 days. Not urgent at launch; do not
forget it.

---

## 2. Configuration — `backend/src/config/matching.ts`

All values runtime-configurable via env. Correct values are empirical and will
need tuning **during** freshers week without a redeploy.

```ts
export const MATCHING = {
  inboundPendingCap:  int(process.env.MATCH_INBOUND_CAP, 3),
  outboundDaily:      int(process.env.MATCH_OUTBOUND_DAILY, 3),
  outboundDailyPremium: int(process.env.MATCH_OUTBOUND_DAILY_PREMIUM, 6),
  exposureFloorWeekly:  int(process.env.MATCH_EXPOSURE_FLOOR, 20),
  explorationRate:    float(process.env.MATCH_EXPLORATION_RATE, 0.10),
  declineIsPermanent: bool(process.env.MATCH_DECLINE_PERMANENT, true),
  feedSize:           int(process.env.MATCH_FEED_SIZE, 20),
};
```

`outboundDailyPremium` **must remain finite.** Premium buys a modest uplift,
never uncapped cold contact (see 0003 Layer 0).

---

## 3. Features

All features return `0..1`. Implement in `backend/src/services/matching/features.ts`.

### 3.1 `structural(A, B)` — cold-start backbone

```
sameBatch    = A.batchYear && A.batchYear === B.batchYear      ? 1 : 0
sameBranch   = A.branch    && A.branch    === B.branch         ? 1 : 0
sameHometown = A.hometown  && A.hometown  === B.hometown       ? 1 : 0

structural = min(1, 0.45*sameBatch + 0.30*sameBranch + 0.35*sameHometown)
```

### 3.2 `interestIdf(A, B)` — rarity-weighted overlap

Flat overlap barely discriminates because everyone picks the same popular
interests. Weight by inverse frequency so *rare* shared interests carry signal.

```
idf(i) = ln(1 + N / (1 + count(i)))      // N = verified users on campus
                                          // count(i) = users with interest i

interestIdf(A,B) = Σ_{i ∈ A∩B} idf(i)
                 / sqrt( Σ_{i∈A} idf(i) · Σ_{i∈B} idf(i) )     // 0 if either empty
```

Recompute `count(i)` in a nightly job; cache in Redis as a plain map. It is a
single `GROUP BY` over `UserInterest`.

### 3.3 `graph(A, B)` — Adamic–Adar

Port from `origo-web/src/lib/matching.ts` (`adamicAdar`) unchanged. Inputs:
shared communities, plus (when available) We Met edges and Ship nominations
treated as communities of size 2.

### 3.4 `reciprocity(A, B, intent)` — directional, romantic surface only

```
respondRate(B) = (repliesGiven(B) + 5 * 0.30) / (rizzReceived(B) + 5)   // smoothed
intentOpen(B)  = B.lookingFor.includes(intent) ? 1 : 0.35
reciprocity    = respondRate(B) * intentOpen(B)
```

`repliesGiven` / `rizzReceived` come from `RizzOutcome`. Until that table has
data the smoothing prior (0.30) dominates, which is the intended behaviour.

### 3.5 `freshness(B)`, `completeness(B)`

Port `recencyScore` and `completenessScore` from the web module unchanged.

---

## 4. Scoring

```
score(A→B, intent) = Σ_k  w[intent][k] * f_k(A,B)      // → 0..100 after *100
```

Weights (hand-set priors — document as such, do not defend the third decimal):

| intent | structural | graph | interestIdf | reciprocity | freshness | completeness |
|---|---|---|---|---|---|---|
| `FRIENDS` | 0.30 | 0.32 | 0.24 | — | 0.08 | 0.06 |
| `STUDY_BUDDY` | 0.40 | 0.24 | 0.22 | — | 0.08 | 0.06 |
| `NETWORKING` | 0.26 | 0.30 | 0.26 | — | 0.10 | 0.08 |
| `DATING` | 0.16 | 0.16 | 0.24 | 0.32 | 0.08 | 0.04 |

If a feature's input is unavailable (e.g. no communities on either side),
redistribute its weight across the remaining active features so scores stay
comparable — the web module already does this correctly; copy that approach.

---

## 5. Candidate selection pipeline

`backend/src/services/matching/rank.ts`

```
rankFeed(viewer, surface, intent, limit):
  pool     = eligible(viewer, surface, intent)     // §5.1 — hard filters
  scored   = pool.map(c => score(viewer, c, intent))
  boosted  = applyExposureFloor(scored)            // §5.2
  ranked   = mmrDiversity(boosted, lambda = 0.25)  // port from web module
  final    = injectExploration(ranked, pool)       // §5.3
  logImpressions(viewer, final, surface, intent)   // §7 — fire-and-forget
  return final.slice(0, limit)
```

### 5.1 `eligible()` — hard filters

**Both surfaces:**
- `candidate.id !== viewer.id`
- `candidate.isActive && candidate.isVerified`
- `candidate.privacy.discoverableBy !== 'NOBODY'`
- no `Block` row in either direction
- same `collegeName` (unless viewer `isPremium` and cross-campus is enabled)

**`ROMANTIC` surface additionally:**
- `candidate.openToDating === true` (or candidate is in an open Radar window)
- no existing `Match` with `status = ACCEPTED`
- no `RizzSession` between the pair with status `ACTIVE | WAITING | ACCEPTED`
- **no `RizzSession` with status `DECLINED`** where the candidate was the
  target — a decline is permanent (§6)
- `pendingInbound(candidate) < inboundPendingCap`, where
  `pendingInbound = count(RizzSession where targetId = candidate AND status IN (ACTIVE, WAITING))`

> The capacity filter is the mechanism that prevents flooding. It is not an
> optimisation and must not be removed for "more results".

### 5.2 Exposure floor

Every eligible profile is guaranteed a minimum weekly visibility, so nobody is
permanently invisible:

```
shown = count(DiscoveryImpression where candidateId = B, createdAt > now - 7d)
deficit = max(0, (exposureFloorWeekly - shown) / exposureFloorWeekly)
finalScore = score + 8 * deficit        // additive, bounded
```

### 5.3 Exploration

Replace `floor(limit * explorationRate)` of the lowest-ranked returned slots
with candidates sampled uniformly at random from `pool` (excluding those already
selected). **Mark them `wasExploration = true` in the impression log.**

This is the only source of unbiased training data. Logged outcomes are otherwise
biased by the ranker that produced them, and that bias is uncorrectable
retrospectively. Do not skip this because it looks like it lowers feed quality.

---

## 6. Allocation enforcement — `RizzService.startSession`

Current implementation has two defects that must be fixed together with the new
cap. Order of checks:

1. `initiatorId === targetId` → `CANNOT_RIZZ_SELF` *(exists)*
2. block in either direction → `BLOCKED` *(exists)*
3. existing session `ACTIVE | WAITING | ACCEPTED` → `SESSION_ALREADY_EXISTS` *(exists)*
4. **existing session `DECLINED` → `DECLINE_IS_FINAL`** *(new — currently the
   `upsert` at the end silently revives a declined session with counters reset,
   so a declined user can re-approach immediately and indefinitely)*
5. existing `Match` accepted → `ALREADY_MATCHED` *(exists)*
6. **`pendingInbound(target) >= inboundPendingCap` → `TARGET_AT_CAPACITY`** *(new)*
7. **outbound budget** *(fix)*: applies to **all** users. Non-premium
   `outboundDaily`, premium `outboundDailyPremium`. The current
   `if (!initiator?.isPremium)` guard exempts premium entirely — remove it.

Replace the terminal `upsert` with a `create`, since every revival path is now
either explicitly allowed or rejected above.

**Client-facing copy** for `TARGET_AT_CAPACITY` must not shame either party —
something like *"They've got a few conversations going. Try again in a bit."*
Never expose counts.

---

## 7. Logging

- **Impressions** — write in `rankFeed`, fire-and-forget (`void
  logImpressions(...)`, never block the response, never fail the request).
- **Outcomes** — write exactly one `RizzOutcome` wherever a session reaches a
  terminal state: `declineSession`, the reply path in `sendMessage`, the
  `rizzExpiry` job, and the block handler. Use `sessionId` uniqueness to make
  writes idempotent.
- `CHAT_SURVIVED` is upgraded from `CONVERTED_TO_CHAT` by a nightly job that
  counts ≥10 messages in the resulting conversation.

---

## 8. Build order

Ship in this order; each step is independently valuable and safe to deploy.

1. **§6 allocation enforcement** — decline-permanence, premium cap, inbound cap.
   *Pre-launch blocker; these are active harm vectors.*
2. **§1 schema** + persist branch/batch/hometown from the intro-card flow.
3. **§7 logging** — impressions + outcomes. Earlier is strictly better; this
   data cannot be backfilled.
4. **§3–5 server-side ranker**, replacing `discover.service.ts`. Remove the
   `take: 100 orderBy lastSeen` pre-filter — it silently excludes most of the
   pool from scoring regardless of compatibility.
5. **Romantic surface gating** on `openToDating` (0004).
6. *Later:* Radar events as a first-class model, with a stable-matching
   assignment computed at window close.

---

## 9. Verification

- Unit-test each feature function against hand-computed values, including the
  empty/missing-data cases (these are the common path at cold start).
- Integration-test §6 rejections explicitly: **a declined session cannot be
  revived**, a capped target is unreachable, premium is capped.
- Seed ~500 synthetic users with a 75:25 gender split, simulate a week of
  activity, and assert the **concentration metric**: the top 10% of recipients
  must receive well under 50% of total inbound. This is the property the whole
  design exists to guarantee — test it, don't assume it.
