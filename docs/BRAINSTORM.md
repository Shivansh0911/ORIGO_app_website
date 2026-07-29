# Brainstorm — Every Surface, Red-Teamed

**Written:** 2026-07-28 overnight · **For review before Jul 30 deploy**

Each section is: **Proposal → Red team → What survives.** The red team is the
point. Where I attacked an idea and it didn't survive, I've said so rather than
quietly softening it.

Assumptions I worked from (from your answers): PWA distribution · domain being
bought · Intro Card as the onboarding front door · biggest fear is that it feels
broken, boring, or unconsidered.

Decisions needing your sign-off are marked **⚠️ NEEDS CALL**.

---

## 1. Onboarding — the first 90 seconds

### Proposal
Google sign-in (auto-verifies via Workspace `hd`) → DOB → **make your Intro
Card** → share prompt → you're in. The card collects branch, hometown, joining
year and an icebreaker answer — exactly the data matching needs — while feeling
like customisation rather than a form.

### Red team

**The card needs a photo, and freshers at a stall won't have a good one.** The
whole loop rests on people being *proud enough to post it*. A card with a grey
initial-circle where a face should be is not postable. If the default state
looks bad, the growth loop dies at step one and we've also front-loaded friction
for nothing.

**"Write an icebreaker answer" is a blank-page problem.** Standing in a queue,
asked to be witty on demand, most people freeze or type "hi". Bad answers make
bad cards, which don't get posted.

**Canvas render + QR generation on patchy campus wifi.** The render is local so
it's fine, but the Google avatar fetch is a network call and `loadImage`
resolves `null` on failure — so a slow connection silently produces the
no-photo card. Worst case at exactly the wrong moment.

**It's 3–4 minutes with a queue behind them.** That's a real cost at a stall.

### What survives

The idea survives, but only with the friction genuinely designed out:

- **Icebreaker must be tappable presets, not a text box.** Offer 6–8 prompts
  with 3 suggested answers each, editable. "Hot take: pineapple belongs on
  pizza" pre-written and tweakable beats a blank field every time.
- **The card must look excellent with no photo.** Treat the initial-avatar state
  as a first-class design, not a fallback — big monogram on the holographic
  foil actually looks good if designed deliberately.
- **Two-stage:** at the stall, sign-in → DOB → interests (~45s, they're in and
  can browse). Card creation prompted immediately after, and again on next open.
  This respects the queue while keeping the card as the first *creative* act.
- **Pre-fetch the Google avatar during DOB entry** so it's cached by card time.

⚠️ **NEEDS CALL:** two-stage (sign-in first, card immediately after) vs. card
strictly inside the signup flow. I lean two-stage — a stall queue is a real
constraint and a user who's *in* can be re-prompted; a user who abandoned
signup can't.

---

## 2. Profile composition

### Proposal
Name · username · avatar · **joining year + degree** (derived from email) ·
branch · hometown · interests · **icebreaker prompt answers** · Senior badge.

### Red team

**Bios are worthless at cold start.** Every fresher writes "chill guy, love
music and travelling 🎧✈️". It carries no information, differentiates nobody,
and takes the longest to write of any field. We're spending our scarcest
resource (attention during onboarding) on our least useful data.

**Interests barely discriminate either.** Everyone picks Music, Movies, Gaming,
Travel. This is precisely why the matching spec uses IDF weighting — but a
signal that needs statistical rescuing to be useful is a weak signal to build
onboarding around.

**More fields = more drop-off**, and every field we add at signup is one we're
choosing over getting the user to value faster.

### What survives

**Replace the bio with prompt answers.** This is the single highest-leverage
profile change available and it's already half-built (the Intro Card collects
one). "Hot take: ___" produces something specific, memorable, and *directly
conversation-starting* — it hands a Rizz initiator their opener. A bio does
none of that.

Required at signup: name, username, DOB, interests (fast tap grid).
Derived free: joining year, degree type, campus, verified status.
Collected via the card: branch, hometown, one prompt answer.
Progressive later: more prompts, avatar upgrade, additional interests.

**Drop the bio field from onboarding entirely.** Keep it editable in profile
settings for people who want it, but never ask for it up front.

---

## 3. Day-1 empty states — where I was wrong

### What I claimed earlier
That context clusters "solve cold start because they populate by derivation."

### Red team — this was wrong

With 20 users, **there are no clusters.** "From Jaipur (1)" is worse than
showing nothing — it's a public advertisement that the app is empty, delivered
at the exact moment a user is deciding whether to come back. I was reasoning
about steady state and presenting it as a cold-start solution.

The honest position: nothing about the *algorithm* solves day one. Only content
you control does.

### What survives

**Explicit density tiers.** The app should behave differently at different
population levels, and this needs to be built deliberately rather than emerging
by accident:

| Users | Discover shows | Emphasis |
|---|---|---|
| **< 40** | Everyone, single list, no cluster headers, no counts | Happening · Intro Card · "12 joined today" |
| **40–150** | Clusters appear **only at ≥5 members**; others fall into "Others on campus" | Clusters + Pulse |
| **150+** | Full clustered experience | Everything |

**Rules that follow:**
- **Never render a count below 5.** Suppress the row instead.
- **Never show a zero state that reads as failure.** "No one from your city yet"
  is a dead end; "You're the first from Jaipur — your card will find them"
  is an invitation.
- **Happening is the day-1 hero and must be full before launch.** It's the only
  surface whose content you fully control. If it has 15 real orientation events
  on Aug 1, the app is never empty — regardless of user count. This is why
  cutting it earlier was my worst call of the session.

---

## 4. Discover — do context clusters actually change perception?

### Proposal
Rows grouped by derived context: "From Jaipur (12)", "In CSE (34)".

### Red team

**A horizontal row of faces is still a row of faces.** Netflix-style carousels
of *people* arguably read as *more* product-like, not less — you're literally
browsing humans in a shelf layout. I may have solved the wrong half of the
problem: I changed the *organisation* while leaving the *unit* (a person's photo
as a browsable tile) untouched.

**Multi-row membership could feel stalker-ish.** Seeing the same person in three
rows might read as the app pushing someone at you.

**It's a bigger build than I implied** — new endpoint shape, new components,
new empty states per row, two days out.

### What survives

Grouping helps but isn't sufficient. The stronger version: **lead with the
context as the object, not the person.**

> **Jaipur · 12 people** → tap → the list of people
> **CSE · 34 people** → tap → the list

You browse *contexts* first, people second. That's meaningfully different from
browsing faces — it's "find your people" rather than "rate these humans," and
it reads as a directory, which is the honest description of what it is.

It's also **less work**, not more: a list of chips/cards with counts, and the
existing list view behind each one. No carousel components, no per-row empty
states.

⚠️ **NEEDS CALL:** context-first entry (my recommendation) vs. face rows.

---

## 5. Rizz — red-teaming the core loop

Nobody has questioned this and it's the mechanic everything depends on.

### How it works today
Initiator can send **up to 5 messages before any reply**. Target replies →
unlocks, creates a Match + Conversation. 48h expiry, 24h after the 5th message.

### Red team — I think there's a real problem here

**Five unanswered messages to a stranger is harassment-shaped.** Read it from
the receiving side: someone you've never met sends five messages into your inbox
with no reply from you. That isn't charming, it's a wall of text from a stranger
— and at 75:25 the women receiving these get it repeatedly.

The stated philosophy — *"you only have 5 messages, make them count"* — is
genuinely good. But the implementation permits the opposite behaviour:
**burst all five immediately**, which is what an anxious 18-year-old will
actually do at 1am. The mechanic's intent and its incentives point in opposite
directions.

**Second problem: does the initiator learn they were declined?** Status
`DECLINED` exists. If surfaced, you've handed someone an explicit rejection from
a person they will physically see in the mess tomorrow. Campus is not an
anonymous city-wide app; rejection has a face and a timetable.

### What survives

**Keep the 5-message brand, add a consecutive-message limit.** Maximum **2
consecutive messages without a reply**; the remaining budget unlocks once they
respond. This preserves "Rizz In 5" *and* finally makes the incentives match the
philosophy — your opener has to actually work.

**Never surface "declined" to the initiator.** Show it as expired/no-response.
Softer, socially safer, and it removes the incentive to confront someone about
it. The decline still works exactly as designed internally (permanent, per B1).

⚠️ **NEEDS CALL:** both of these change your signature mechanic. High
confidence on the decline-opacity; medium-high on the 2-consecutive cap.

---

## 6. Pulse · Ship a Friend · Happening — second-order risks

### Pulse
**Risk: a Pulse with zero responses is public failure.** You broadcast "anyone
for chai?" and nobody comes — visible to you, and you assume visible to
everyone.
→ **Response counts visible only to the author.** Expiry quietly erases the
evidence, which is a genuine kindness of the 3-hour TTL.

**Risk: the `TALK` category.** "Need someone to vent to rn" from an 18-year-old
is a vulnerability broadcast, and it will attract exactly the wrong responders.
→ Keep it, but `TALK` pulses should be **capped lower by default (1–2)** and
carry a gentle safety note. ⚠️ **NEEDS CALL** — could also cut `TALK` for launch.

### Ship a Friend
**Risk: shipping two strangers.** With relaxed eligibility, you can ship people
who've never met — a cold intro neither asked for.
→ Require the shipper to have *some* connection to both (same batch/branch/
community), enforce `allowShipsFrom` (B4), rate-limit, and make the notification
low-key: an invitation, not a proclamation.

**Risk: anonymity enables mischief.** Anonymous shipping removes the shipper's
social risk — good — but also accountability. Ships are logged with initiator
identity, so abuse is traceable even if not user-visible. That's the right
balance; keep it.

### Happening
**Risk: it goes stale in week 2** and becomes visible evidence of abandonment.
→ It needs a **named owner** with a weekly update commitment. This is an ops
commitment, not a build task, and it should be assigned before launch. If nobody
will own it, don't ship it — a stale events list is worse than none.

---

## 7. Intro Card growth loop — and a flaw in my earlier reasoning

### Red team — I got this wrong earlier

I said the QR code carries the loop on Instagram stories. **It doesn't.** You
cannot scan a QR code displayed in a story you're viewing *on the same phone*.
The QR works for printed posters and phone-to-phone, not for the story flow that
is supposedly the whole point.

### What survives

The card needs a **human-readable handle**, prominently:

> **origo.app/u/ananya_s**

Big enough to read on a story, short enough to type. The QR stays for physical
and phone-to-phone use, but the *readable handle is the primary mechanism* for
the sharing loop.

Also needed:
- **A copy-paste caption** provided with the download ("first year @ BITS Hyd —
  find me on Origo ↓") so sharing is one tap, not a writing task.
- **`?src=introcard&by=<username>`** on the link for viral attribution — tells
  you which users actually drive installs, i.e. your viral coefficient measured
  directly rather than guessed.
- **The bar is genuinely high.** People post to their story things that make
  them look good. If the card is even slightly cringe, nobody posts and the
  entire acquisition strategy fails silently. This deserves real design
  attention and a test with 5 actual freshers before Aug 1.

---

## 8. Notifications & retention under PWA constraints

### Red team of my own earlier assumption
I've been implicitly assuming push notifications would carry retention.
**On iOS, web push only works for installed PWAs on 16.4+, after an explicit
Add to Home Screen.** A large share of your users will effectively have no push.
Retention planning that depends on it is planning on sand.

### What survives

**Assume roughly half your users are unreachable by push.** Design retention
around things that don't need it:

1. **The WhatsApp group is your notification channel.** Your volunteers post
   "12 new pulses today" or "Prom Radar opens Friday" into groups people already
   check. This is not a workaround — it's better reach than push.
2. **Time-anchored moments** people plan around (Prom Radar opening, orientation
   events) rather than ambient nudges.
3. **PWA install prompt at the right moment** — not on first load (dismissed),
   but right after the first genuinely good experience: card created, or first
   reply received.

**Notification policy when we do have it — only human events:**
someone replied to your Rizz · someone responded to your Pulse · someone shipped
you · your Rizz expires in 6h.
**Never:** "come back!", "5 new people!", streaks, or anything that isn't a real
person doing a real thing. One growth-hack blast burns a semester of trust with
this audience.

---

## 9. Safety & moderation ops — the genuinely unplanned one

There is no plan here, the tooling is a word filter, and the Playbook correctly
calls one incident existential. This is the highest risk-to-effort gap in the
launch.

### Minimum viable safety, all cheap

- **A rota.** Orientation week, 8am–1am, named person on call in 3-hour blocks
  across your 12 people. Written down, not assumed.
- **Reports go somewhere a human sees within minutes** — a Slack/WhatsApp
  webhook on report creation is a 20-minute build and turns an unread DB table
  into an actual alert.
- **A kill switch.** One admin endpoint to set `isActive = false`. Already
  supported by the schema; needs a route and one button.
- **A written escalation rule** for the serious cases (threats, sexual content,
  anything involving a minor): who is called, and when the campus authority gets
  involved. Decide this *before* it happens at 2am, not during.
- **Test block and report end-to-end before launch.** They exist and have
  probably never been exercised.

**A structural point:** your best safety feature is already built. Rizz means no
unsolicited DMs, the inbound cap bounds volume, and permanent decline (B1) stops
repeat approaches. Fixing B1 is a safety fix, not a bug fix — it should be
framed and prioritised that way.

---

## 10. Ground game — your highest-leverage asset

Twelve people is a lot for one campus. Almost nothing in the app matters as
much as what they do in week one.

### The single highest-value action
**Every volunteer posts their own Intro Card into every WhatsApp group they're
already in.** That's not marketing — it's a peer showing a thing they made.
Twelve people × several groups each reaches most of campus through channels
that already have 100% penetration, at zero cost, on day one.

### Stall playbook
- **One phone per volunteer running the signup flow**, so a fresher can be
  onboarded in under a minute without their own patchy connection.
- **Ask for one thing only: sign in and make a card.** Not a tour.
- **Print the cards.** A physical printout of the card someone just made is a
  genuinely memorable artifact and costs almost nothing.
- **Seed the seniors first.** 10 seniors with Senior badges before freshers
  arrive means the app isn't all-freshers-guessing on day one.

### QR posters
- Distinct `?src=` per location (`hostel-d`, `mess-a`, `admin-block`, `stall`).
- **Land on a public page, never a login wall.** A scan hitting a login screen
  converts terribly.
- The landing page should show something real — live event list, "142 students
  joined" — not a marketing splash.

---

## 11. Pre-mortem — it's Sept 1 and Origo failed. Why?

Ranked by my honest estimate of likelihood.

1. **Nobody got past signup on Aug 1** because of a deploy issue nobody caught —
   unseeded interests table, CORS misconfigured, OAuth origins wrong. *Boring,
   fatal, and entirely preventable by task 0.9: test the whole flow on a real
   phone on campus wifi before freshers arrive.*
2. **It felt empty.** Users arrived faster than content. Mitigation is entirely
   in §3 — density tiers and a full Happening on day one.
3. **The Intro Card wasn't good enough to post**, so the growth loop never
   started and it stayed at 80 users. Mitigation: test with 5 real freshers
   before launch. This is the load-bearing assumption of the whole strategy and
   it is currently untested.
4. **The women left in week one.** Flooding via Rizz, Pulse, or repeat approaches
   after decline. Mitigation: B1, B2, B3 + inbound caps — all identified, none
   built yet.
5. **It got labelled a dating app** in the first week and 70% of campus never
   installed it. Mitigation: default tab, no dating in onboarding, no dating in
   any poster copy.
6. **A safety incident** in orientation week. Mitigation: §9, which is currently
   the thinnest plan of everything here.
7. **It worked for two weeks then died** after prom. Real risk, but a good
   problem to have — and explicitly out of scope for launch.

---

## 12. Summary of calls needed from you

| # | Question | My lean |
|---|---|---|
| 1 | Intro Card inside signup, or immediately after? | **After** — protects against stall drop-off |
| 2 | Discover: context-first entry, or face rows? | **Context-first** — better positioning, less build |
| 3 | Rizz: cap at 2 consecutive messages without reply? | **Yes** — current design permits a wall of text |
| 4 | Hide "declined" from the initiator? | **Yes** — high confidence, campus rejection has a face |
| 5 | Keep the `TALK` Pulse category at launch? | **Keep, capped lower** — but I'd accept cutting it |
| 6 | Who owns Happening content weekly? | Needs a name, or don't ship it |
| 7 | Drop the bio field from onboarding? | **Yes** — replace with prompt answers |

## What I did not cover

Prom Radar detail (Phase 4 — needs its own session), post-prom retention,
cross-campus expansion, chat features beyond what exists, monetisation.
All correctly deferred; none are launch-blocking.
