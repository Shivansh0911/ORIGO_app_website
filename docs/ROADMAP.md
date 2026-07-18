# Origo — Phased Roadmap (with milestone triggers)

The core discipline: **match the sophistication of the system to the data and
scale you actually have.** Building a learned model on a few hundred data points
loses to a good heuristic. Each phase below has a **trigger** — don't start it
until the trigger is met, and don't delay it once it is.

Milestones are about *data and liquidity*, not calendar dates.

---

## Milestones at a glance

| ID | Trigger (when you've reached it) | Unlocks |
|----|----------------------------------|---------|
| **M0** | Today | Client-side heuristic ranking + telemetry + freshers features (done) |
| **M1** | Backend `/events` + Rizz outcome logging live | Real data collection; graph/reciprocity signals activated |
| **M2** | ~1,000–2,000 labelled Rizz outcomes | First *learned* ranker beats the heuristic |
| **M3** | ~2–3 campuses each with healthy standalone density | Intercommunity (cross-campus) discovery; stable-matching pass |
| **M4** | ~100k+ users / candidate pools too big for SQL | Retrieval-scale infra (two-tower, graph embeddings, warehouse) |

---

## Matching / recommendation track

### Phase 0 — Heuristic + instrumentation  · `M0` (done)
- Intent-aware client-side ranking (shipped in `origo-web/src/lib/matching.ts`).
- Opt-in telemetry collecting discovery decisions + (soon) Rizz outcomes.
- **This is the best you can do without outcome data** — and it's genuinely
  decent. Don't over-invest in tuning the weights; the point of the next phase is
  to *learn* them.

### Phase 1 — Turn on the real signals  · trigger `M1`
- Backend receives events and logs Rizz outcomes (the label set).
- `/discover` returns candidate `communities` + `responseRate` → the
  already-written **Adamic–Adar graph term and reciprocity term activate** with no
  further web changes.
- Port `matching.ts` server-side so ranking is authoritative + shared with mobile.
- *Why gated on M1:* the graph/reciprocity terms are inert without this data;
  turning them on earlier would just add noise.

### Phase 2 — First learned ranker  · trigger `M2` (~1–2k outcomes)
- Train a binary classifier — **logistic regression first, LightGBM/XGBoost once
  you have >5–10k labels** — predicting P(Rizz session → sustained chat).
- Features: interest overlap, mutual-community count, campus match, per-user
  response-rate history, activity-time overlap, profile completeness.
- Separate models (or at least separate weights) for **dating vs friendship**.
- Ship behind an **A/B test** vs the heuristic; keep the heuristic as the control.
- *Why gated on M2:* below ~1k labels a learned model overfits and loses to the
  heuristic. This is the single most common mistake at this stage — don't make it.

### Phase 3 — Two-sided ranking + exploration  · trigger `M3`
- A lightweight **Gale–Shapley** stable-matching pass over each user's shortlist
  (prevents "everyone sees the same top 1%").
- A proper **exploration slice** (epsilon-greedy / Thompson sampling) so newer
  users and communities keep surfacing.
- **Graph embeddings** (node2vec → small GNN) over the Community + Ship + Match
  graph — powers both friendship ranking and the **paid intercommunity feature**.

### Phase 4 — Retrieval-scale  · trigger `M4`
- Two-tower embedding retrieval (YouTube/Airbnb-style), real-time feature store,
  continuous online learning. **Do not build before M4** — it's wasted effort at
  smaller scale.

---

## Product / community track

Origo grows community-by-community. The GTM sequencing (from the memos):

1. **BITS Hyderabad** — win one campus to real density first (define the density
   bar — see CHECKLIST). Freshers features are the wedge.
2. **BITS cross-campus** (Pilani/Goa/Hyd) — free, zero new verification (same
   identity domain), and the **safe pilot for intercommunity discovery** before it
   becomes a paid cross-college feature.
3. **Adjacent colleges** (IIT Hyd, etc.) — ordered by real social overlap, not just
   prestige. Only after ≥1 campus clears its density bar.
4. **Intercommunity discovery (premium)** — opens only at `M3`, once 2–3 campuses
   have standalone density. Launch narrow/high-confidence first.
5. **PGs / gated communities** — a **separate GTM + verification track**, not
   "college #6". Needs a different trust mechanism (RWA rosters / address+phone /
   referral gating) and a different founding wedge.

### Feature milestones
- **Freshers season (now):** Intro Cards, Batch Space, Prom Radar, Senior Connect,
  Quests, Happening — capture the one annual moment when cold-start is easy.
- **Post-freshers retention:** generalise Prom Radar into reusable **"Radar"
  moments** tied to the campus calendar (fests, inductions). Retention KPI:
  *did the user get ≥1 real connection in their first 2 weeks* — instrument it.
- **Monetisation:** Premium (cross-campus, boosts) + hyperlocal sponsored cards in
  Happening. Ads stay ≤1 per 5 cards; revenue is secondary to the discovery utility.

---

## What to remember

- **Don't skip a phase.** Each trigger exists because the phase genuinely can't
  work before it.
- **Rizz In 5 is the moat, not the scorer.** Research shows pre-interaction
  compatibility scores have a low ceiling; the value is in learning from what
  actually happens after people interact. That's why outcome logging (M1) is the
  highest-priority backend task.
