# Origo — Project Context for Claude Code

Read this before making product or scope decisions in this repo. It's the
current-state reference so work here doesn't drift out of sync with the
founder's plan. For deeper docs see `docs/README.md`.

## What Origo is, right now

A verified campus social app (friends + dating + communities), launching
**campus-by-campus, starting with BITS Pilani — Hyderabad Campus only.**
Do not widen the verified-campus allowlist (`backend/src/config/collegeDomains.ts`)
without checking with Aryan first — it's a deliberate pilot-scope decision, not
an oversight.

## Current monetization state — don't change without asking

| Feature | Status |
|---|---|
| Premium subscription | **Live** — Razorpay checkout (real or pseudo-mode, see `payment.service.ts`) |
| Profile Boost | **Live** — paid |
| Ship a Friend | **Free for v1** — deliberately not gated on payment right now. The payment plumbing (`IapPurchase` model, `createShipOrder`/`verifyShipOrder`) exists and is ready, just not wired into `ShipService.createShip`. Don't re-enable it without checking — this was an explicit launch-scoping call. |
| Sticker Pack / Rizz Pack / See Who Shipped You | Order + verify endpoints exist, purchases are tracked, but **no feature currently consumes the entitlement** — these are unfinished, not fully live. |

If you're touching payments, know that `payment.service.ts` has a pseudo-mode
(mock Razorpay orders when `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` aren't set)
for local dev — real credentials switch it to live mode automatically.

## Shipped features (current scope)

Freshers HQ hub, Intro Cards (canvas-rendered shareable card + QR), Prom
Radar, Batch Space, Senior Connect, We Met (QR-based), Freshers Quests,
Happening Around You (event carousel + sponsored cards, ≤1 sponsored per 5
items), Pulse (ephemeral "what are you up to" posts → Rizz session), Ship a
Friend, Premium, opt-in consent + telemetry, Google OAuth sign-in.

**No anonymous posting anywhere** — every feature is identity-attached. This
is an intentional product boundary, not a gap.

## Matching / discovery algorithm — out of scope here

The matching/ranking algorithm (client-side engine in `origo-web/src/lib/matching.ts`,
and any future backend ranking work) has its own strategy and roadmap that is
**intentionally not documented in this repo**. Treat it as a black box:

- Don't redesign the scoring logic, weights, or backend `/discover` ranking
  approach without checking with Aryan first.
- Bug fixes and structural fixes (e.g. a query that silently excludes users)
  are fine and welcome — this is about not freelancing new *strategy*, not
  about avoiding bug fixes.

## Commit and documentation standards — required, not optional

This repo's history is treated as a durable engineering record. Both
contributors follow this; it is not per-author preference.

**Every commit message must explain *why*, not just *what*.** The diff already
shows what changed. A message that only restates the diff is a failed commit
message.

Format:

```
<type>(<scope>): <imperative summary, ≤72 chars>

<Why this change was needed — the problem, bug, or constraint.>
<What was actually done, at a level the diff doesn't convey.>
<Tradeoffs: what else was considered and why it lost, if non-obvious.>
<Verification: how this was checked (typecheck, manual run, screenshot).>

Refs: docs/decisions/NNNN-....md    (when a decision record applies)
```

`type` ∈ `feat` · `fix` · `security` · `perf` · `refactor` · `docs` · `test` ·
`chore`. Keep the existing `SEC-NN` / `VAL-NN` / `CFG-NN` audit labels in the
body when a commit closes an audit item.

Rules:

- **One logical change per commit.** Don't bundle a bug fix, a refactor, and a
  feature — they can't be reviewed, reverted, or explained independently.
- **No `wip`, `fix stuff`, `update`, `asdf`.** If a commit is genuinely
  incremental, say what increment.
- **Never commit secrets.** `.env` is gitignored; check `git status` after any
  broad `git add`.
- **Write a decision record** (`docs/decisions/`, see its README) when a change
  alters a data model, an API contract, or a security boundary; when a credible
  alternative was rejected; or when it came out of an expensive bug. Reference
  it from the commit.

Also capture, as you go rather than retroactively: notable tradeoffs, the
toughest bugs and *how* they were found, performance or scale decisions, and
anything that was deliberately deferred. These are the details that are
impossible to reconstruct later and are the most valuable part of the record.

## Engineering conventions already established

- **Security fixes ship as `SEC-NN` / `VAL-NN` / `CFG-NN` labeled commits** —
  keep that convention, it makes the audit trail traceable.
- **Startup requires real env vars** — `JWT_SECRET`, `JWT_REFRESH_SECRET`,
  `FIELD_ENCRYPTION_KEY`, `BLIND_INDEX_KEY`, `DATABASE_URL`. The server throws
  at boot if any are missing or malformed — this is deliberate (SEC-01/SEC-03),
  don't add fallback defaults back in.
- **Schema changes need a migration file** — hand-write it matching the style
  of existing files in `backend/prisma/migrations/` if `prisma migrate dev`
  isn't available (e.g. no local Postgres running), and regenerate the client
  with `prisma generate`.
- **Before wiring up a new client↔backend contract** (new endpoint, new field),
  double-check the field names and enum values match on both sides — this
  repo has had several silent mismatches (e.g. `plan` vs `planId`) that only
  surface at runtime, not in either side's own type-checking.
