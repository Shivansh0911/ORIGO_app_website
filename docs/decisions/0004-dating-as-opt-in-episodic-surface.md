# 0004 — Romantic discovery is an opt-in, episodic surface — not a mode or a filter

- **Date:** 2026-07-28
- **Status:** Accepted
- **Area:** matching / product
- **Builds on:** [0003](0003-matching-strategy.md)

## Context

0003 established that Origo is a socialising platform where romance is one
outcome, and that the gender-ratio failure mode is specific to 1:1 romantic
cold contact. That leaves an open question: **how does a user enter romantic
discovery at all?**

Three candidate designs:

1. **A filter/chip on the main Discover feed** (roughly what exists today —
   intent chips on a ranked stack of people).
2. **A permanent "dating mode" toggle** in settings or navigation.
3. **Opt-in, time-boxed Radar events**, plus a quiet persistent option.

## Decision

**Option 3.** Romantic discovery is entered deliberately, and the primary way
in is a *time-boxed Radar window* anchored to a real campus moment (Prom Radar
first; the pattern generalises to fests, inductions, farewells). A low-key
persistent setting — "open to meeting someone" — exists for continuity between
windows, but it is a quiet profile preference, not a mode in the navigation.

The main Discover surface is **social**: people surfaced through shared context
(communities, batch, events, hometown), not a ranked stack of strangers.

## Why — the three properties that decide it

The right lens is matching-market design (Roth), not recommender systems. A
market works when it has **thickness**, manages **congestion**, and is **safe**
to participate in honestly. Each maps to a concrete design choice:

### Thickness — enough participants present at the same time

A market with participants spread thinly across time is thin at every moment,
even if the annual total looks healthy. At our scale the romantic pool is
already small (~150 women, of whom some fraction opt in); spreading those
opt-ins across months makes every individual moment nearly empty, which reads
as "this app is dead" and causes churn on its own.

Time-boxed Radar windows **concentrate opt-ins deliberately**, converting a
permanently thin market into a periodically thick one. This is the single
strongest technical argument for episodic over persistent, and it is not
intuitive — the instinct is that "always on" means more liquidity. The opposite
is true.

### Congestion — participants can't evaluate everything they receive

Congestion is what the inbound capacity cap in 0003 solves: a bounded queue of
pending approaches keeps each one evaluable. A known window end also bounds
congestion naturally — a Radar event cannot generate unbounded backlog because
it terminates.

### Safety — participants can reveal true preferences without penalty

The decisive property, and where opt-in earns its place:

- **Opt-in makes approaches solicited.** Everyone visible has said they're open.
  This is categorically different from cold-contacting someone who never asked.
- **Time-boxing removes the social signalling cost.** On a campus where everyone
  knows everyone, a permanent "I am looking to date" flag is a public statement
  to your actual peers. "I joined Prom Radar" is not — the event provides cover,
  because *everyone* is doing it that week. A permanent toggle will be
  systematically under-adopted by exactly the users we most need, and they will
  not tell us that's why.
- **Decline must be terminal** (see 0003 Layer 0) or opting in is unsafe.

## Alternatives considered

- **Intent chip on the main feed** (status quo). Rejected: it makes the main
  discovery surface a stack of rankable strangers with dating as one lens — the
  dating-app shape. It also means everyone is permanently in the romantic pool
  whether or not they want to be, which is the consent problem restated.
- **Permanent dating-mode toggle.** Rejected as the *primary* mechanism for the
  signalling reason above, but retained as a quiet secondary option, because
  some users genuinely want continuity and forcing everyone to wait for an event
  is its own failure.
- **Separate app / separate brand for dating.** Rejected: destroys the actual
  differentiation, which is that romance emerges from real social context rather
  than a stranger marketplace.

## Honest risks

- **The opt-in pool will skew worse than the platform.** Men will opt in at
  higher rates than women; a 75:25 platform could produce an 85:15 romantic
  pool. Time-boxing and event framing are the mitigations, plus capacity caps
  that make the skew survivable rather than fatal. **This must be measured from
  the first Radar window**, per-gender opt-in rate, and reported honestly even
  if it's bad.
- **Thin windows.** If a Radar event draws too few participants it feels
  embarrassing for those who joined. Mitigation: don't open a window without a
  minimum participation threshold, and frame group/table mode as a first-class
  outcome so "no date" isn't failure.
- **Radar could still code us as a dating app** if marketed as the headline
  feature. It should be one moment in a campus calendar, not the product.

## Consequences

- Discover becomes context-first. This is a real UI change, not just a
  reordering, and it should land before the ranker work in 0003 Layer 3 —
  otherwise we tune a ranker for a surface we're about to replace.
- Gale–Shapley now has a genuine home: a Radar window is a closed, two-sided,
  simultaneous market, which is exactly the setting stable matching was designed
  for. Compute the assignment at window close. (0003 correctly rejects it for
  the continuous feed.)
- Capacity caps apply to the romantic pool; social discovery stays abundant.
