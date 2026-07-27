# 0002 — Pseudo-mode payment bypass must be gated on configuration, never on request content

- **Date:** 2026-07-28
- **Status:** Accepted
- **Area:** backend / security

## Context

To let the payment flow run end-to-end in local development without real
Razorpay credentials, `payment.service.ts` gained a "pseudo mode": when
`RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` are absent, order creation returns a
`mock_order_*` id and signature verification auto-approves.

The implementation was:

```ts
if (IS_PSEUDO || orderId.startsWith('mock_') || signature === 'mock_sig') return true;
```

The first clause is correct. The other two are **unconditional** — they are not
inside the `IS_PSEUDO` branch. In production, with real Razorpay keys
configured and pseudo mode off, any client could send:

```json
{ "orderId": "mock_anything", "paymentId": "x", "signature": "mock_sig" }
```

…and the HMAC check would be skipped entirely. Every paid feature becomes free
to anyone who reads the client bundle or guesses the string. The dev
convenience escaped into the production code path.

This is the most dangerous class of bug in the codebase to date, and it is
worth naming why it was easy to miss: it was introduced *by* a commit whose
stated purpose was making dev easier, it sat directly above a
`SEC-02 TODO` comment (so the area looked already-audited), and every type
checks — there is nothing a compiler or a passing test suite would flag.

## Decision

Pseudo mode is a **deployment configuration**, so it may only ever be decided
by configuration. Rewritten as:

```ts
if (IS_PSEUDO) return orderId.startsWith('mock_') && signature === 'mock_sig';
```

Mock credentials are now accepted *only* when the server is genuinely running
without real keys, and within pseudo mode we still require the mock shape
rather than blanket-approving — so a malformed request fails even in dev.

## Alternatives considered

- **Delete pseudo mode entirely.** Safest, and tempting. Rejected because it
  makes local development require live Razorpay credentials, which is a real
  tax on every contributor and invites worse workarounds (hardcoded bypasses
  in feature branches).
- **Keep the bypass but gate on `NODE_ENV !== 'production'`.** Better, but
  couples payment safety to an env var that is easy to get wrong in a new
  deployment and is often unset in containers. Keying off "are real
  credentials present" is self-evident and fails closed.

## Consequences

- Local dev keeps working with no credentials.
- A production deploy that forgets to set Razorpay keys now silently accepts
  mock payments. That is a real remaining risk. **Mitigation to build:** add
  `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` to the startup env validation
  (`checkEnv()` in `server.ts`) so production refuses to boot without them,
  matching how `JWT_SECRET` and `FIELD_ENCRYPTION_KEY` are already handled.

## General lesson worth carrying

Any code path that weakens a security check for developer convenience must be
gated on something the *operator* controls (config, env, build flag) — never on
something the *caller* sends. Request content is attacker-controlled by
definition. Grep for this pattern whenever reviewing a "make it work locally"
commit.

## Verification

Backend `tsc --noEmit` clean. Found by reading the diff of an incoming merge
(`git show`) rather than by any automated check — no test or type error would
have surfaced it, which is itself the argument for reading security-adjacent
diffs by hand.
