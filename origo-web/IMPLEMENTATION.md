> ⚠️ **Superseded for the current launch.** Written before the launch-scope
> brainstorm — describes features since cut (Batch Space, Prom Radar as
> described here, We Met live scanning) and an ML-phased matching plan since
> replaced. Active reference: [docs/BUILD_PLAN.md](../docs/BUILD_PLAN.md) and
> [docs/decisions/0003](../docs/decisions/0003-matching-strategy.md). The
> client-side matching engine (`src/lib/matching.ts`) described below is still
> accurate and in active use — only the roadmap/feature framing is stale.

# Origo Web — Matching & Freshers Implementation

This documents what was built into `origo-web` in this pass, how it maps to the
two strategy memos (the **Matching & GTM** memo and the **Freshers Playbook**),
and — importantly — **what was deliberately left for the backend** because it
needs data or infrastructure the browser doesn't have.

Everything here is scoped to `origo-web` only. No backend or `origo-app` files
were touched.

---

## 1. What shipped (working in the web app)

### A. Client-side matching engine — `src/lib/matching.ts`

Replaces the single symmetric Jaccard formula with a proper re-ranking layer
that runs in the browser on the `/discover` payload. Implements the parts of the
matching memo that are computable client-side:

| Concept (from memo) | Status | Notes |
|---|---|---|
| Intent-aware weighting | ✅ Done | Separate weight profiles for `DATING` / `FRIENDS` / `NETWORKING` / `STUDY_BUDDY`. Friendship is graph-dominated, dating is reciprocity-dominated. |
| Weighted interest overlap | ✅ Done | Exact-interest matches count full, same-category-different-interest counts partial (stand-in for IDF/rarity weighting). |
| Graph overlap (Adamic–Adar) | ⚠️ Wired, dormant | Code is complete and used, but the candidate's community memberships aren't in the `/discover` payload yet — so it currently contributes 0 and its weight redistributes. Lights up automatically once the backend includes candidate communities (see §3). |
| Reciprocity (asymmetric) | ✅ Proxy | Directional estimate from "are they open to this intent" × interest overlap. **True reciprocity needs per-user response history** — deferred (§3). |
| Recency + completeness | ✅ Done | Soft freshness / profile-quality boosts. |
| Diversity re-rank (MMR) | ✅ Done | Greedy MMR pass so the feed doesn't collapse onto near-identical profiles (the Tinder-Elo failure mode). |
| Exploration jitter | ✅ Done (light) | Bounded random jitter so newer/less-active profiles still surface. The client-side stand-in for the Phase-2 bandit. |
| Transparent score breakdown | ✅ Done | `scoreCandidate` returns per-component points + human reasons, surfaced in the Discover "Why this match" UI. |

Wired into **`src/pages/app/DiscoverPage.tsx`**: intent selector chips, client-side
re-ranking, and an expandable "Why this match" breakdown with reason chips.

> The whole module is pure functions and is written to be **portable to the
> backend** — the same logic should move server-side once outcome logging exists.

### B. Freshers-season features

| Feature | Route | File(s) | Backend needed? |
|---|---|---|---|
| **Freshers HQ** (hub: quests, happening, quick links) | `/app/freshers` | `pages/app/FreshersPage.tsx` | Partially (§3) |
| **Intro Cards** (canvas render, download/share, QR) | `/app/intro-card` | `pages/app/IntroCardPage.tsx`, `lib/introCard.ts` | ❌ Fully client-side |
| **Happening Around You** (carousel + sponsored cards) | in hub | `components/happening/HappeningCarousel.tsx` | Content is seed (§3) |
| **Prom Radar** (opt-in, date/group mode, ranked candidates) | `/app/prom` | `pages/app/PromRadarPage.tsx` | Opt-in state local (§3) |
| **Batch Space** (pre-arrival batch) | `/app/batch` | `pages/app/BatchSpacePage.tsx` | Content is seed (§3) |
| **Senior Connect** (verified seniors, AMA) | `/app/seniors` | `pages/app/SeniorConnectPage.tsx` | Content is seed (§3) |
| **We Met** (your scannable QR + met list) | `/app/met` | `pages/app/WeMetPage.tsx` | Camera scan native (§3) |
| **Freshers Quests** (gamified onboarding) | in hub | `store/freshersStore.ts` | Completion state local (§3) |

Supporting files:
- `src/lib/freshers/content.ts` — seed data (quests, happening feed, seniors, batch, prom).
- `src/store/freshersStore.ts` — persisted client state (quest completion, prom opt-in, met list).

The **Intro Card generator is the one genuinely complete, no-backend-required
growth feature** — it renders a story/square PNG entirely on a `<canvas>`, embeds
a QR to the user's profile, and exports via download or the Web Share API.

### C. Navigation
- `AppLayout.tsx` — added **Freshers HQ** as the first nav item (accent-highlighted, "NEW").
- `App.tsx` — six new routes registered under `/app/*`.

### Verification
- `npx tsc --noEmit` → clean.
- `npx vite build` → succeeds (2230 modules). Added dependency: `qrcode` (+ `@types/qrcode`).

---

## 2. Design decisions worth knowing

- **Why re-rank client-side at all?** The task was scoped to `origo-web`, and the
  backend still ships the old formula. Client-side re-ranking is a legitimate
  Phase-0 move: it improves the actual UX today and doubles as a **reference
  implementation** for the eventual server-side ranker. It is not the final home
  for this logic.
- **Graph & reciprocity are wired but honest.** Rather than fake these signals,
  the code degrades gracefully (weight redistribution) and the dormant parts are
  documented so nobody mistakes the proxy for the real thing.
- **Seed data is isolated and shaped like the API.** Every seed constant in
  `content.ts` has a comment naming the endpoint it stands in for, so the swap is
  mechanical.
- **No anonymous features.** Per the Playbook's hard "no" on anonymous campus
  content (the YikYak failure mode), nothing here allows anonymous posting.

---

## 3. Deferred to backend (build these next)

Ordered by leverage. The first item is the single most important thing for the
whole matching roadmap.

### 3.1 ⭐ Rizz outcome logging (highest priority)
Nothing learns without labels. Add an events table capturing every Rizz session
outcome: `declined | expired_unopened | converted_to_chat | chat_survived_N | blocked_after`.
This is pure plumbing and unblocks every learned model later. Until it exists,
"ML-powered matching" has nothing to train on.

### 3.2 Include candidate signals in `/discover`
To activate the already-written graph & reciprocity terms, the discover payload
needs, per candidate:
- `communities: { id, memberCount, category }[]` → activates Adamic–Adar graph scoring.
- `responseRate` (0..1, from logged outcomes) → upgrades the reciprocity proxy to real.

The client already consumes these via `MatchContext` — no client change needed
beyond passing them in.

### 3.3 Move the ranker server-side (Phase 1)
Port `lib/matching.ts` to the backend, then replace the hand-set intent weights
with a model (logistic regression → LightGBM) trained on 3.1's labels. See the
Matching memo's phase plan.

### 3.4 Freshers endpoints (replace seed data)
| Client seed | Endpoint to build |
|---|---|
| `QUESTS` + completion | `GET /v1/freshers/quests`, `POST /v1/freshers/quests/:id/complete` |
| `HAPPENING_*` | `GET /v1/happening?campus=`, `GET /v1/happening/sponsored?campus=` |
| `SENIORS` | `GET /v1/seniors?campus=` (+ senior opt-in flag on User) |
| `BATCH_INFO` | `GET /v1/batch/:campus/:year` (packaged Community) |
| Prom opt-in | `POST /v1/prom/opt-in`, `GET /v1/prom/status`, `GET /v1/prom/candidates` |
| We Met | `POST /v1/met` (from a scanned QR token) |

### 3.5 ⚠️ Pre-arrival verification (the likely silent killer)
The entire pre-arrival play assumes admits can sign in, but college email OTP
doesn't exist until registration. Needs a **parallel verification path** —
admission-letter upload or senior-invite gating — decided before launch. This is
a backend + product dependency, flagged in both memos.

### 3.6 Native / device capabilities
- **We Met live scanning** needs the device camera (native app, or `BarcodeDetector`
  on supported browsers). The web build ships the user's own QR + a manual list.
- **Ads infrastructure**: sponsored-card inventory, flat-rate slot booking, and
  reporting are backend. The client renders the format correctly with the ad-load
  discipline (≤1 sponsored per 5 items) already enforced in `happeningFeed()`.

### 3.7 Bigger algorithm phases (from the Matching memo)
Two-tower retrieval, real Gale–Shapley stable-matching pass, graph embeddings
(node2vec / GNN) for the paid intercommunity feature, and an offline/online eval
harness. All Phase 2–3, all backend, none appropriate at current data volume.

---

## 4. File map

```
origo-web/src/
├── lib/
│   ├── matching.ts               ← client-side matching engine (portable to backend)
│   ├── introCard.ts              ← canvas Intro Card renderer + share/download
│   └── freshers/content.ts       ← seed data (maps 1:1 to future endpoints)
├── store/
│   └── freshersStore.ts          ← persisted freshers client state
├── components/
│   ├── happening/HappeningCarousel.tsx
│   └── layout/AppLayout.tsx      ← + Freshers HQ nav
└── pages/app/
    ├── DiscoverPage.tsx          ← rewired to matching engine + intent + "why"
    ├── FreshersPage.tsx          ← hub
    ├── IntroCardPage.tsx
    ├── PromRadarPage.tsx
    ├── BatchSpacePage.tsx
    ├── SeniorConnectPage.tsx
    └── WeMetPage.tsx
```
