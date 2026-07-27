# Decision Records

One file per significant decision. These exist so that six months from now —
or in an interview, or when a new contributor asks "why is it built this way" —
the *reasoning* is recoverable, not just the code.

A decision earns a record if it meets any of:

- It changes a data model, an API contract, or a security boundary.
- We picked one approach over a credible alternative and the choice isn't obvious.
- It's a deliberate limitation ("we are NOT doing X yet, because…").
- It came out of a bug that was expensive to find.

Routine work (styling, copy, dependency bumps, straightforward fixes) does not
need one. Ceremony for its own sake makes the log worthless.

## Naming

`NNNN-short-kebab-title.md`, numbered sequentially. Never renumber or delete a
record — if a decision is reversed, write a **new** record that supersedes it
and add a `Superseded by:` line to the old one. The log is append-only; being
able to see that we changed our minds, and why, is the point.

## Template

```markdown
# NNNN — Title

- **Date:** YYYY-MM-DD
- **Status:** Accepted | Superseded by NNNN | Reversed
- **Area:** backend / web / matching / infra / product

## Context
What was true that forced a decision. Include the constraint that actually
mattered (scale, timeline, data we don't have yet, a bug we hit).

## Decision
What we're doing, stated plainly.

## Alternatives considered
Each with the honest reason it lost. If an alternative is *better later but not
now*, say what would trigger revisiting it.

## Consequences
What this makes easy, what it makes hard, and what we've deliberately deferred.

## Verification
How we know it works — the test, the manual check, the measurement.
```

## Why this matters beyond the code

The hard part of engineering is rarely the syntax; it's the judgement calls
under incomplete information. Those calls are invisible in a diff. Writing them
down is how the work stays legible — to teammates now, and to anyone evaluating
the project later.
