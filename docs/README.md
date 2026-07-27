# Origo — Engineering & Product Docs

Shared docs for the team. Start here.

| Doc | What it's for |
|---|---|
| [BUILD_PLAN.md](./BUILD_PLAN.md) | **Start here if you're building.** The sequenced backlog — what to build, in what order, and what's deliberately out of scope. |
| [THESIS.md](./THESIS.md) | **Start here if you're new.** What Origo is, what it deliberately isn't, and the one sentence everything ladders to. Shareable. |
| [decisions/](./decisions/) | **Decision records.** Why the system is built the way it is — read before changing an architectural choice. |
| [matching-spec.md](./matching-spec.md) | Implementation contract for discovery/matching. Says *what* to build; decisions 0003/0004 say *why*. |
| [CHECKLIST.md](./CHECKLIST.md) | **Living task board.** What's done, what's next for the dev, and what's next for the founder. Update it as things ship. |
| [ROADMAP.md](./ROADMAP.md) | The phased plan for matching + product, with the **milestone that triggers each phase** (so we don't build things before they can work). |
| [DATA_AND_PRIVACY.md](./DATA_AND_PRIVACY.md) | What data we collect, **where it should be stored**, how models improve over time, and the privacy/consent obligations. |

Also see [`origo-web/IMPLEMENTATION.md`](../origo-web/IMPLEMENTATION.md) for the
file-level status of the web app specifically, and [`../CLAUDE.md`](../CLAUDE.md)
for the current-scope reference that any Claude Code session in this repo
loads automatically (monetization state, campus allowlist, what's off-limits).

## The one-paragraph context

Origo is a verified campus social app (friends + dating + communities), launching
campus-by-campus starting at BITS Hyderabad, timed to freshers season. The web
app now has a real client-side matching engine (a Phase-0 reference
implementation), a full set of freshers-season features (Intro Cards, Prom Radar,
Batch Space, Senior Connect, We Met, Quests, Happening Around You), and an opt-in
telemetry pipeline that collects the behavioural data our matching models will
learn from. The big remaining work is **backend**: outcome logging, the
`/events` sink, and eventually a learned ranker. See ROADMAP + CHECKLIST.

## How to keep these docs useful

- When you finish a task, tick it in CHECKLIST.md **in the same PR**.
- When a milestone is hit (e.g. "1,000 logged Rizz outcomes"), check ROADMAP for
  what that unlocks.
- Keep founder tasks and dev tasks separate — they have different owners.
