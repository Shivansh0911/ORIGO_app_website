import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { verifyAccessToken } from '../utils/jwt';

/**
 * Product telemetry sink.
 *
 * The web client has always emitted batched, consent-gated events to this path
 * (origo-web/src/lib/telemetry.ts) — but the endpoint did not exist, so every
 * event was buffered in localStorage, retried forever, and eventually dropped.
 *
 * Two design rules, both deliberate:
 *
 *  1. **It never fails.** Always 202, even on malformed input. Telemetry is
 *     fire-and-forget from the client's perspective; a rejected batch would
 *     make it retry forever and could surface as a user-visible error. Losing
 *     an event is acceptable — breaking a session to record one is not.
 *
 *  2. **Auth is optional.** Events fire before sign-in (page views, the signup
 *     funnel itself) which is exactly the part of the funnel we most need. If a
 *     valid token is present we attribute the event; otherwise it's anonymous.
 */

const router = Router();

const EventSchema = z.object({
  name: z.string().min(1).max(64),
  props: z.record(z.unknown()).optional(),
  ts: z.string(),
  sessionId: z.string().min(1).max(128),
});

const BatchSchema = z.object({
  // Matches the client's MAX_BUFFER; anything larger is a bug or an abuse
  // attempt, and we'd rather drop the tail than accept an unbounded write.
  events: z.array(EventSchema).max(200),
});

function userIdFromHeader(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    return verifyAccessToken(header.slice(7)).userId;
  } catch {
    return null; // expired or invalid — record anonymously rather than reject
  }
}

router.post('/', async (req: Request, res: Response) => {
  const parsed = BatchSchema.safeParse(req.body);
  if (!parsed.success || parsed.data.events.length === 0) {
    res.status(202).json({ accepted: 0 });
    return;
  }

  const userId = userIdFromHeader(req);

  try {
    await prisma.analyticsEvent.createMany({
      data: parsed.data.events.map((e) => ({
        name: e.name,
        props: (e.props ?? undefined) as Prisma.InputJsonValue | undefined,
        userId,
        sessionId: e.sessionId,
        // Trust the client clock only as far as parsing; fall back to now()
        // rather than dropping an event over a malformed timestamp.
        ts: Number.isNaN(Date.parse(e.ts)) ? new Date() : new Date(e.ts),
      })),
    });
  } catch (err) {
    // Swallow: a telemetry write must never surface to the user.
    console.error('[events] write failed', err);
  }

  res.status(202).json({ accepted: parsed.data.events.length });
});

export default router;
