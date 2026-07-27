# 0001 — Track in-app purchases as consumable entitlements, not bare signature checks

- **Date:** 2026-07-28
- **Status:** Accepted
- **Area:** backend / payments

## Context

The in-app purchase endpoints (Ship a Friend, Sticker Pack, Rizz Pack, See Who
Shipped You) verified a Razorpay signature and returned `{ verified: true }`.
Nothing was persisted. The consequence was structural, not cosmetic:

- `POST /ships` had **no link to any payment**. Verifying a signature and
  creating a ship were two unrelated facts, so the create-ship endpoint could
  be called directly and succeed for free.
- A valid signature proves *a* payment happened. It does not prove *which*
  user paid, *what* they paid for, or that the entitlement hasn't already been
  redeemed. Replay was unbounded.

Two independent audits of this file (one by each contributor) had left a
`SEC-02 TODO` comment noting order-ownership wasn't validated — the gap was
known but the fix kept being deferred because there was no schema to hang it on.

## Decision

Introduce an `IapPurchase` model that records a purchase across its whole
lifecycle, with **two separate timestamps**:

- `verifiedAt` — the Razorpay signature checked out.
- `consumedAt` — the thing it paid for was actually granted.

Order creation opens the row. Verification stamps `verifiedAt` after
confirming the row belongs to the authenticated user and matches the expected
item. Redemption stamps `consumedAt` inside the same transaction that creates
the purchased artifact, guarded by `consumedAt: null` in the `WHERE` clause so
two concurrent requests cannot both redeem one order.

## Alternatives considered

- **Keep signature-only verification, add a `userId` check.** Cheaper, and
  fixes ownership — but not replay. One paid order could still be redeemed
  repeatedly, because nothing records that it was already used.
- **Grant the entitlement at verification time (single timestamp).** Simpler,
  and it is what we do for Sticker/Rizz Pack/View Ships, because no feature
  consumes those yet — verification is the only gate that will ever run for
  them today. It is wrong for Ship, where "paid" and "used" are genuinely
  different moments and the gap between them is where double-spend lives.
- **Razorpay webhooks as the source of truth.** The correct long-term answer
  and it closes cases client callbacks miss (user closes the tab mid-payment).
  Deferred: it needs a public callback URL and idempotent handler work that
  isn't justified before real keys are live. **Revisit when going live with
  production Razorpay credentials.**

## Consequences

- Ship a Friend is currently **free for v1** (see `CLAUDE.md`), so this
  plumbing is built and tested but deliberately not wired into
  `ShipService.createShip`. Re-enabling is a small, well-marked change rather
  than a redesign.
- Premium and Boost still validate signature-only, without order-ownership.
  Lower risk while `RAZORPAY_KEY_SECRET` stays private, but the same class of
  gap. Marked with a `SEC-02 TODO` in `payment.service.ts`; must close before
  real keys go live.
- Every non-subscription purchase is now auditable — who bought what, when it
  was verified, whether it was redeemed.

## Verification

`prisma generate` + `tsc --noEmit` clean on backend and web. Migration
hand-written to match existing migration style (local Postgres was not running,
so `prisma migrate dev` could not generate it) — **still needs
`prisma migrate deploy` against a live database.**
