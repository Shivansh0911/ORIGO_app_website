# Origo — Data & Privacy Strategy

Answers three questions: **what** data we collect, **where it should live**, and
how we stay **privacy-compliant** while collecting the rich data our models need.

---

## 1. Principles

1. **Opt-in analytics.** Nothing beyond strictly-essential data is collected until
   the user accepts (see the consent flow in the web app). This is stricter than
   most apps and it's deliberate — trust is Origo's whole positioning.
2. **Collect for a purpose.** Every event we log should map to a decision:
   improving matching, improving retention, or safety. If it doesn't, don't log it.
3. **Separate operational data from analytical data.** The database that runs the
   app and the store you analyse/train on have different shapes and access rules.
4. **De-identify where possible.** Analytical events don't need names; a stable
   pseudonymous user id is enough for modelling.

---

## 2. What we collect (and why)

### Behavioural events — the model fuel
Emitted client-side by the telemetry layer (`origo-web/src/lib/telemetry.ts`),
opt-in only. The important ones for matching:

| Event | Why it matters |
|---|---|
| `discover_impression` | What was shown, at what rank/score — the denominator for CTR-style learning |
| `discover_like` / `_pass` / `_rizz_start` | The **decision** signal — did the user act on this candidate |
| `discover_intent_change` | Which mode the user is actually in |
| `rizz_started`, `rizz_message_sent` | Leading indicators of a real conversation |

### Rizz outcomes — the ground-truth labels (⭐ most valuable)
Logged **server-side** (can't be trusted to the client), per session:
`declined | expired_unopened | converted_to_chat | chat_survived_N | blocked_after`.
These are the labels a learned ranker trains against. **This is the single most
important dataset Origo owns.** Start logging it as early as possible even if no
model consumes it yet — you can't train on data you didn't collect.

### Profile & graph data — already in the app DB
Interests, communities, matches, ships, events. Used as model features (interest
overlap, mutual communities) and for the friendship graph.

### What we deliberately **don't** collect
Message *content* for analytics, precise location, contacts, or anything from
outside the app. Safety systems may scan content, but that's not analytics.

---

## 3. Where should this data be stored?

Short answer, staged by milestone (see ROADMAP):

> **Now (M0–M2):** keep everything in **Postgres** — you already run it. Add two
> append-only tables: `analytics_event` and `rizz_outcome`. That's enough to
> collect all the training data and run early analysis. **Don't add a warehouse
> yet.**
>
> **Soon (optional):** add **PostHog** (free cloud tier) for out-of-the-box
> funnels, retention curves and dashboards, so you're not hand-writing SQL for
> every product question. Send the same events there. It complements — doesn't
> replace — your own event table.
>
> **At scale (M4):** move event/analytical data to a **columnar store** —
> ClickHouse (self-hosted, cheap, very fast for events) or BigQuery (managed) —
> and keep Postgres for transactional/operational data. Media (avatars, student
> IDs) always lives in **object storage** (S3 / Cloudflare R2), never the DB.

Why this order: a dedicated warehouse solves a problem (billions of rows, complex
analytical queries) you won't have for a while. Postgres comfortably handles
millions of event rows; premature warehousing is cost + complexity with no payoff.

### Suggested schema (Postgres, now)

```sql
-- Raw behavioural events (append-only). Written by POST /v1/events.
CREATE TABLE analytics_event (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID REFERENCES "User"(id),   -- pseudonymous is fine
  name         TEXT NOT NULL,
  props        JSONB,
  session_id   TEXT,
  ts           TIMESTAMPTZ NOT NULL,
  received_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON analytics_event (name, ts);
CREATE INDEX ON analytics_event (user_id, ts);

-- The training-label table. One row per Rizz session, updated as it resolves.
CREATE TABLE rizz_outcome (
  session_id       UUID PRIMARY KEY REFERENCES "RizzSession"(id),
  initiator_id     UUID,
  receiver_id      UUID,
  intent           TEXT,
  outcome          TEXT,           -- declined | expired_unopened | converted_to_chat | ...
  messages_sent    INT,
  chat_msgs_after  INT,            -- how long the resulting chat survived
  blocked_after    BOOLEAN DEFAULT false,
  score_at_match   INT,            -- what the ranker predicted, for eval
  created_at       TIMESTAMPTZ DEFAULT now(),
  resolved_at      TIMESTAMPTZ
);

-- Auditable consent decisions (DPDP/GDPR).
CREATE TABLE consent_log (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID,
  analytics   BOOLEAN,
  version     INT,
  decided_at  TIMESTAMPTZ,
  ip_hash     TEXT
);
```

---

## 4. The data → model loop (how models improve over time)

```
users interact  →  events + Rizz outcomes logged  →  features + labels
       ↑                                                     ↓
   better ranking  ←  A/B test winner  ←  train ranker  ←  offline eval
```

- Every ranking decision logs the **score it predicted** (`score_at_match`) next
  to the **outcome that happened**. That pairing is what lets you measure whether
  the model is actually good, and retrain it to be better.
- Retrain on a cadence (weekly/monthly) as data accumulates. The heuristic stays
  as the A/B control until a model reliably beats it.
- This is why telemetry + outcome logging are P0: **the flywheel can't spin
  without the data, and the data can only be collected forward from today.**

---

## 5. Privacy & compliance obligations

Origo processes personal data of (mostly young) students in India — so India's
**DPDP Act 2023** applies, and GDPR-style practices are a good baseline.

- [x] **Opt-in consent** for analytics — shipped (web).
- [x] **Privacy Policy** stating what/why/rights — shipped draft (`/privacy`).
- [ ] **Consent log** stored server-side (schema above) — dev P0.
- [ ] **Right to access / export** — user can download their data — dev P1.
- [ ] **Right to erasure** — delete account + data (keep only what law requires,
      de-identified) — dev P1.
- [ ] **Right to withdraw consent** — web already flips analytics off + clears the
      local buffer; back it with the server consent log.
- [ ] **Data minimisation & retention** — define and enforce a retention window;
      auto-purge raw events past it (aggregates can persist).
- [ ] **Security** — encrypt sensitive fields (already in backend per SETUP),
      restrict access to the analytics store, hash IPs in the consent log.
- [ ] **Grievance Officer + contact** — publish per DPDP; wire `privacy@origo.app`.
- [ ] **Legal review** of the Privacy Policy + a Terms of Service by a DPDP-aware
      lawyer before real users. The shipped page is a strong draft, not advice.

### A note on the student/minor angle
Origo is 18+ and college-verified, which sidesteps most minor-specific rules — but
keep the age gate real (verification), because "social app used by teenagers"
attracts scrutiny (see the Saturn app's safety backlash). Conservative defaults
for freshers (batch-visible, not campus-wide) are part of this.
