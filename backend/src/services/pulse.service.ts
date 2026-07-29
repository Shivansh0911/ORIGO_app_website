import crypto from 'crypto';
import { PulseCategory } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { moderateText } from '../utils/moderateText';
import { MATCHING } from '../config/matching';

const PULSE_TTL_HOURS = 3;

export const PulseService = {
  async createPulse(authorId: string, data: {
    category: PulseCategory;
    text: string;
    vibe?: string;
    maxResponses?: number;
  }) {
    // PULSE-02: one active Pulse per user at a time
    const activePulse = await prisma.pulse.findFirst({
      where: { authorId, status: 'ACTIVE', expiresAt: { gt: new Date() } },
    });
    if (activePulse) throw new Error('ACTIVE_PULSE_EXISTS');
    moderateText(data.text, data.vibe);

    // The author decides how many people they want. This is consent by their
    // own choice rather than a limit we impose — and it closes the flooding
    // hole, since every response opens a Rizz session with them. Clamped so a
    // careless (or deliberate) large number can't reopen it.
    const maxResponses = Math.min(
      Math.max(data.maxResponses ?? MATCHING.pulseDefaultResponses, 1),
      MATCHING.pulseMaxResponses,
    );

    const author = await prisma.user.findUnique({
      where: { id: authorId },
      select: { collegeName: true },
    });

    const expiresAt = new Date(Date.now() + PULSE_TTL_HOURS * 60 * 60 * 1000);

    return prisma.pulse.create({
      data: {
        id: crypto.randomUUID(),
        authorId,
        category: data.category,
        text: data.text,
        vibe: data.vibe,
        maxResponses,
        collegeName: author?.collegeName ?? null,
        expiresAt,
      },
      include: { author: { select: { id: true, name: true, username: true, avatarUrl: true, isVerified: true } } },
    });
  },

  async getFeed(userId: string) {
    const viewer = await prisma.user.findUnique({
      where: { id: userId },
      select: { collegeName: true },
    });

    // PULSE-03: exclude blocked users (both directions)
    const blocks = await prisma.block.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    });
    const blockedIds = new Set(
      blocks.flatMap((b) => [b.blockerId, b.blockedId]).filter((id) => id !== userId),
    );

    const now = new Date();
    const pulses = await prisma.pulse.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { gt: now },
        collegeName: viewer?.collegeName ?? undefined,
        authorId: { notIn: [userId, ...blockedIds] }, // exclude own + blocked
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        author: { select: { id: true, name: true, username: true, avatarUrl: true, isVerified: true } },
        responses: { where: { responderId: userId }, select: { id: true } },
      },
    });

    return pulses.map((p) => ({ ...p, hasResponded: p.responses.length > 0 }));
  },

  async respondToPulse(pulseId: string, responderId: string) {
    const pulse = await prisma.pulse.findUnique({ where: { id: pulseId } });
    if (!pulse) throw new Error('PULSE_NOT_FOUND');
    if (pulse.status !== 'ACTIVE' || pulse.expiresAt < new Date()) throw new Error('PULSE_EXPIRED');
    if (pulse.authorId === responderId) throw new Error('CANNOT_RESPOND_OWN_PULSE');

    const existing = await prisma.pulseResponse.findUnique({
      where: { pulseId_responderId: { pulseId, responderId } },
    });
    if (existing) throw new Error('ALREADY_RESPONDED');

    // Enforce the author's chosen cap. Every response spawns a Rizz session
    // with them, so an uncapped popular Pulse is an inbound flood.
    const responseCount = await prisma.pulseResponse.count({ where: { pulseId } });
    if (responseCount >= pulse.maxResponses) throw new Error('PULSE_FULL');

    // PULSE-01: spawn a Rizz session so responder and author can actually talk
    let rizzSessionId: string | null = null;
    try {
      const { RizzService } = await import('./rizz.service');
      const session = await RizzService.startSession(responderId, pulse.authorId);
      rizzSessionId = session.id;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'SESSION_ALREADY_EXISTS' || msg === 'ALREADY_MATCHED') {
        // Resolve to existing session so the client can navigate straight in
        const existingSession = await prisma.rizzSession.findFirst({
          where: {
            OR: [
              { initiatorId: responderId, targetId: pulse.authorId },
              { initiatorId: pulse.authorId, targetId: responderId },
            ],
          },
          orderBy: { createdAt: 'desc' },
        });
        rizzSessionId = existingSession?.id ?? null;
      }
      // BLOCKED, DAILY_LIMIT_REACHED → rizzSessionId stays null; response still created
    }

    const response = await prisma.pulseResponse.create({
      data: { id: crypto.randomUUID(), pulseId, responderId, rizzSessionId },
    });

    // Close the Pulse once the author has the number of people they asked for.
    if (responseCount + 1 >= pulse.maxResponses) {
      await prisma.pulse.update({
        where: { id: pulseId },
        data: { status: 'FULFILLED' },
      }).catch(() => { /* non-fatal: the count check above is the real guard */ });
    }

    const responder = await prisma.user.findUnique({ where: { id: responderId }, select: { name: true } });
    await prisma.notification.create({
      data: {
        userId: pulse.authorId,
        type: 'NEW_PULSE_RESPONSE',
        title: 'Someone responded to your Pulse!',
        body: `${responder?.name ?? 'A student'} is in for: ${pulse.text}`,
        data: { pulseId, ...(rizzSessionId ? { rizzSessionId } : {}) },
      },
    }).catch(() => {});

    return { ...response, rizzSessionId };
  },

  async cancelPulse(pulseId: string, userId: string) {
    const pulse = await prisma.pulse.findUnique({ where: { id: pulseId } });
    if (!pulse) throw new Error('PULSE_NOT_FOUND');
    if (pulse.authorId !== userId) throw new Error('NOT_PULSE_AUTHOR');

    return prisma.pulse.update({
      where: { id: pulseId },
      data: { status: 'CANCELLED' },
    });
  },

  // PULSE-04: include responder profiles + rizzSessionId so the author can see who's in and jump to chat
  async getMyPulse(userId: string) {
    return prisma.pulse.findFirst({
      where: { authorId: userId, status: 'ACTIVE', expiresAt: { gt: new Date() } },
      include: {
        responses: {
          select: {
            id: true,
            responderId: true,
            rizzSessionId: true,
            responder: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};
