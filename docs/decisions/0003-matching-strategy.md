# 0003 — Matching is an allocation problem before it is a prediction problem

- **Date:** 2026-07-28
- **Status:** Accepted
- **Area:** matching / product

## Product frame — this constrains everything below

**Origo is a community-scoped socialising platform, not a dating app.** Finding
romantic interest is one outcome the platform supports; it is not the product.
The differentiation depends on this: a dating app competes with Tinder U and
Bumble on their terms and loses, and — more importantly — the majority of
students who would never install a dating app are the network. Lose them and
there is no product.

This is not positioning language. It is a technical constraint with three
consequences that shape the whole design:

1. **Most interaction should be group-shaped, not 1:1.** Communities, Pulse,
   events, Batch Space and Happening are **non-rivalrous** — one Pulse can be
   seen by fifty people and answered by three with nobody overwhelmed. They
   scale without an allocation problem at all.
2. **The gender-ratio problem is largely a 1:1-romantic-contact problem.** It
   binds hard there and barely at all on friendship, study, communities or
   events. Two people forming a friendship do not compete for a scarce
   resource. So the correct response is not only to *ration* 1:1 contact but to
   **route most connection through shared context instead**, where the
   constraint doesn't apply.
3. **The default surface determines the perceived category.** If a user's main
   experience is receiving or sending cold 1:1 approaches, Origo is a dating
   app to them regardless of copy. Positioning is enacted by which surface
   opens first and what the discovery UI is shaped like — a ranked stack of
   strangers reads as a dating app; people surfaced *through* a shared
   community or event reads as a social platform.

Romance should be an **emergent outcome of socialising** — you meet through a
club, a Pulse, a batch thread — rather than a mode you enter. That is also how
campus social life actually works, which is why it is defensible.

## Context — the actual constraints

Design decisions here follow from four facts about the launch, not from what is
fashionable in recommender systems:

| Fact | Consequence |
|---|---|
| **~75:25 male:female** expected at BITS Hyderabad | Attention of the minority side is the scarce resource. Ranking purely by compatibility concentrates it catastrophically. |
| **300–1,000 users in the first 6–8 weeks** | A full scan of the candidate pool costs single-digit milliseconds. Retrieval is a non-problem. Learned models have nothing to learn from. |
| **Rizz In 5 is the only cold-contact path** | There is exactly one chokepoint to govern. This is a large architectural advantage — most social products have several. |
| **Freshers arrive with no interaction history** | Behavioural signals are unavailable precisely when the product must work best. Cold start is the default state, not an edge case. |

### The failure mode this is designed to prevent

Scoped precisely: this is a failure mode of **1:1 romantic cold contact**, not
of the platform as a whole.

With a 75:25 split and compatibility-ranked 1:1 discovery, inbound Rizz
concentrates on a small fraction of the minority side. At ~600 users
(~450M / ~150F): if a third of the men send their daily allowance, the top ~15
women absorb the majority of several hundred weekly approaches — tens of
unsolicited messages each — while most of the pool receives almost none.

Both sides then churn, for opposite reasons: the flooded side because the
product feels like harassment, the ignored side because it feels like a void.
And **no improvement in scoring accuracy prevents it** — a better ranker
concentrates attention *more* efficiently, not less.

There are therefore two responses, and the first matters more:

1. **Reduce how much connection has to flow through the 1:1 channel at all**,
   by making group and context surfaces the primary way people meet. This is
   the socialising-platform thesis paying off technically, not just
   strategically.
2. **Ration what remains.** For the 1:1 path that survives, the system's job is
   to allocate a scarce resource sustainably, not to predict compatibility
   precisely.

## Decision

Build the matching system in layers, in this order. Each layer is useful alone
and none depends on data we don't have.

### Layer 0 — Close the harm vectors (before launch, non-negotiable)

Two existing behaviours actively amplify the ratio problem:

1. **Declining a Rizz does not stick.** `RizzService.startSession` rejects only
   `ACTIVE`/`WAITING`/`ACCEPTED` sessions, then `upsert`s — so a `DECLINED`
   session is *revived* with counters reset. The same person can re-approach
   immediately, indefinitely. Decline must be terminal, with a long cooldown
   before any re-approach is possible (if ever).
2. **Premium bypasses the send limit entirely** (`if (!initiator?.isPremium)`),
   so a paying user can cold-contact unlimited people. On a skewed campus this
   is, functionally, selling the ability to flood the minority side. Premium
   may receive a modest uplift; it must not be uncapped.
3. **The default intent was `DATING`.** `primaryIntent()` in
   `origo-web/src/lib/matching.ts` ordered `['DATING', 'FRIENDS', …]` and
   returned the first match, so any user selecting both landed in dating mode
   by default. A one-line array that quietly made Origo a dating app for a
   large share of users. Reordered so `FRIENDS` leads and dating is an explicit
   choice. *This is the clearest example of why the product frame above is a
   technical constraint and not marketing: positioning drift shows up in
   defaults, and defaults live in code.*

### Layer 1 — Score the whole pool

`discover.service.ts` currently takes the 100 most-recently-active users and
ranks *within* that set, so a highly compatible but less-active person is
unreachable regardless of score. At n ≤ 1,000 this optimisation buys nothing
and costs correctness. Remove the pre-filter; keep recency as a scoring
*feature*, never a gate.

### Layer 2 — Two-sided budgets (the core mechanism)

Treat cold contact as admission control:

- **Inbound capacity.** A user may hold at most `K` pending unanswered cold
  Rizz (start `K = 3`). At capacity they are withheld from *cold-contact
  discovery* — still fully visible in communities, search, and existing
  conversations. Replying, declining, or letting a session expire frees a slot.
- **Outbound budget.** Sized so aggregate demand roughly matches aggregate
  capacity. Current 5/day is likely too generous against ~150 receivable
  profiles; start lower and tune.
- **Exposure floor.** Every active, complete profile is guaranteed a minimum
  number of impressions per week, independent of score.

Why this is the right primitive:

- It solves flooding and invisibility with **one** mechanism.
- It **self-regulates by engagement** rather than by fiat — an enthusiastic
  user who clears their queue keeps receiving; only unmanaged backlog throttles.
- Senders benefit: you only ever spend a scarce Rizz on someone with room to
  reply, so reply rates rise for everyone.
- It requires **zero training data** and is fully explainable to a user.
- It reinforces the existing product philosophy — Rizz In 5 is already a
  scarcity mechanic; this extends scarcity to the receiving side.

`K`, the outbound budget, and the exposure floor must be **runtime-configurable**.
Correct values are empirical and will need tuning during freshers week without
a redeploy.

### Layer 3 — Graph-first heuristic scoring

For freshers, structural signals beat behavioural ones because behavioural ones
don't exist yet. Priority order:

1. **Declared structure** — batch, branch, hometown, school. Free, available at
   signup, genuinely predictive for freshers ("Delhi folks travelling together").
2. **Graph** — mutual communities (Adamic–Adar, already implemented but dormant
   pending backend payload), We Met QR edges, Ship-a-Friend nominations. A
   third party asserting compatibility is a strong signal.
3. **Interest overlap** — keep, but down-weight and add rarity (IDF) weighting.
   Everyone selects the same handful of popular interests, so raw overlap
   barely discriminates; sharing a *rare* interest is what carries information.
4. **Reciprocity** — directional, not symmetric:
   `score(A→B) ≈ P(A interested in B) × P(B responds to A)`, where the second
   term uses B's observed response rate and current capacity headroom.

Keep intents (`DATING` / `FRIENDS` / `NETWORKING` / `STUDY_BUDDY`) scored
separately. Friendship is graph-dominated and robust at cold start; dating is
reciprocity-dominated and fragile. Blending them into one score serves neither.

### Layer 4 — Log for a model we cannot yet train

Record now, model later. The schema matters more than any algorithm:

- Every Rizz outcome: `declined | expired_unopened | expired_after_read |
  converted_to_chat | chat_survived_N | blocked_after`.
- **Impressions, not just actions** — who was shown, at what rank, with what
  score, and *not* acted on. Without negatives there is no training set.
- **Exploration slots flagged explicitly.** Logged outcomes are biased by the
  ranker that produced them; a labelled random slice is the only way to correct
  for that later. This is cheap now and impossible to reconstruct
  retrospectively.

### Layer 5 — Learn, only when the data justifies it

Trigger: **~2,000+ labelled outcomes with exploration coverage.** Then logistic
regression (not gradient boosting — too few samples), A/B tested against the
heuristic, per intent.

Stated plainly: **it may not beat the heuristic**, and that is an acceptable
outcome. Research on pre-interaction attraction prediction (Joel, Eastwick &
Finkel 2017) found that machine learning over extensive self-reported traits
could not predict romantic desire better than chance before people interacted.
Rizz In 5 is the right response to that finding — it forces the interaction
that actually carries signal. The value of Layer 4 is *optionality*, not
guaranteed lift.

## Where classical matching algorithms actually fit

**Gale–Shapley stable matching is the wrong tool for the discovery feed** and
should not be built there. It requires both sides to submit preference
orderings over a known candidate set; Origo has one-sided asynchronous
browsing. Synthesising preference lists from our own heuristic scores would
launder the same heuristic through more impressive machinery, add a batch step
that breaks the real-time feel, and improve nothing.

It *is* the right tool for **Prom Radar**: a time-boxed event where both sides
opt in during a known window, and a stable assignment can be computed once at
close. Same for group/table mode, which is a clustering problem. That is a
genuinely differentiated feature and the correct home for this class of
algorithm.

## Success metrics

Not matches, not sessions started — those can all rise while the product dies.
Note that a dating app and a socialising platform are *measured differently*;
optimising the wrong number is how one becomes the other.

- **Primary:** share of active users with ≥1 *reciprocated* interaction within
  14 days, **tracked separately per gender.** Counts group interactions
  (community thread replies, Pulse responses, event co-attendance) alongside
  1:1 — because those are real connections and the platform's main product.
- **Category-drift guard:** share of all interactions that are 1:1 romantic
  cold contact. If this climbs, Origo is becoming a dating app regardless of
  intent. **Watch it as closely as any growth number.**
- **Concentration:** share of total inbound Rizz received by the top 10% of
  recipients. Rising concentration is the early warning; tighten `K`.
- **Sender health:** share of senders receiving ≥1 reply per week.
- **Guardrail:** blocks and reports per 100 sessions.

Deliberately *not* a headline metric: total Rizz sessions started. It is the
number most likely to rise while the product gets worse.

## Consequences

- Deliberately **no ML at launch**, and that is a considered position, not a
  gap. The infrastructure to earn it later is built now.
- Men will sometimes find fewer available profiles than they would like. This
  is the mechanism working, not a bug — and it pushes usage toward communities
  and friendship, which is the healthier and more defensible product anyway.
- Scoring moves server-side so ranking is authoritative and consistent across
  web and mobile. `origo-web/src/lib/matching.ts` stays as the reference
  implementation it was designed to be.

## Open questions to resolve with data

- Real intent mix. Instrument it: `lookingFor` distribution at signup, intent
  chip usage on Discover, first-surface-opened in week 1, Rizz sends bucketed
  by sender intent. Expect a dating spike around prom week specifically — plan
  capacity for it.
- Whether `K = 3` is right. Tune against the concentration metric.
