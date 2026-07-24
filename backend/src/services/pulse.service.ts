import crypto from 'crypto';
import { PulseCategory } from '@prisma/client';
import { prisma } from '../utils/prisma';

const PULSE_TTL_HOURS = 3;

export const PulseService = {
  async createPulse(authorId: string, data: {
    category: PulseCategory;
    text: string;
    vibe?: string;
  }) {
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

    const now = new Date();
    const pulses = await prisma.pulse.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { gt: now },
        collegeName: viewer?.collegeName ?? undefined,
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

    const response = await prisma.pulseResponse.create({
      data: { id: crypto.randomUUID(), pulseId, responderId },
    });

    // Notify pulse author
    const responder = await prisma.user.findUnique({ where: { id: responderId }, select: { name: true } });
    await prisma.notification.create({
      data: {
        userId: pulse.authorId,
        type: 'NEW_PULSE_RESPONSE',
        title: 'Someone responded to your Pulse!',
        body: `${responder?.name ?? 'A student'} is in for: ${pulse.text}`,
        data: { pulseId },
      },
    }).catch(() => {});

    return response;
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

  async getMyPulse(userId: string) {
    return prisma.pulse.findFirst({
      where: { authorId: userId, status: 'ACTIVE', expiresAt: { gt: new Date() } },
      include: { responses: { select: { id: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },
};
