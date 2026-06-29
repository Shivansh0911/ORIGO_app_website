import { RizzStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { redis } from '../utils/redis';

export const RizzService = {
  async startSession(initiatorId: string, targetId: string) {
    if (initiatorId === targetId) throw new Error('CANNOT_RIZZ_SELF');

    const block = await prisma.block.findFirst({
      where: { OR: [{ blockerId: initiatorId, blockedId: targetId }, { blockerId: targetId, blockedId: initiatorId }] },
    });
    if (block) throw new Error('BLOCKED');

    const existing = await prisma.rizzSession.findUnique({
      where: { initiatorId_targetId: { initiatorId, targetId } },
    });
    if (existing && ['ACTIVE', 'WAITING', 'ACCEPTED'].includes(existing.status)) throw new Error('SESSION_ALREADY_EXISTS');

    const match = await prisma.match.findFirst({
      where: { OR: [{ senderId: initiatorId, receiverId: targetId }, { senderId: targetId, receiverId: initiatorId }], status: 'ACCEPTED' },
    });
    if (match) throw new Error('ALREADY_MATCHED');

    const initiator = await prisma.user.findUnique({ where: { id: initiatorId } });
    if (!initiator?.isPremium) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const count = await prisma.rizzSession.count({
        where: { initiatorId, createdAt: { gte: today } },
      });
      if (count >= 5) throw new Error('DAILY_LIMIT_REACHED');
    }

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const session = await prisma.rizzSession.upsert({
      where: { initiatorId_targetId: { initiatorId, targetId } },
      create: { initiatorId, targetId, expiresAt, status: 'ACTIVE' },
      update: { status: 'ACTIVE', expiresAt, initiatorMsgCount: 0, targetReplied: false, unlocked: false },
    });

    await prisma.notification.create({
      data: {
        userId: targetId,
        type: 'RIZZ_MESSAGE',
        title: '💬 New Rizz!',
        body: `${initiator?.name ?? 'Someone'} wants to Rizz you!`,
        data: { sessionId: session.id },
      },
    });

    return session;
  },

  async sendMessage(sessionId: string, senderId: string, content: string, socketServer?: unknown) {
    const session = await prisma.rizzSession.findUnique({
      where: { id: sessionId },
      include: { initiator: true, target: true },
    });
    if (!session) throw new Error('SESSION_NOT_FOUND');

    const isInitiator = session.initiatorId === senderId;
    const isTarget = session.targetId === senderId;
    if (!isInitiator && !isTarget) throw new Error('NOT_IN_SESSION');

    let conversationId: string | undefined;

    if (isInitiator) {
      if (session.status === 'WAITING') throw new Error('WAITING_FOR_REPLY');
      if (session.status !== 'ACTIVE') throw new Error('SESSION_NOT_ACTIVE');
      if (session.initiatorMsgCount >= 5) throw new Error('MESSAGE_LIMIT_REACHED');
      const newCount = session.initiatorMsgCount + 1;
      const isLast = newCount >= 5;
      await prisma.$transaction([
        prisma.rizzMessage.create({
          data: { sessionId, senderId, content, initiatorMsgNumber: newCount },
        }),
        prisma.rizzSession.update({
          where: { id: sessionId },
          data: {
            initiatorMsgCount: newCount,
            ...(isLast ? { status: 'WAITING', expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } : {}),
          },
        }),
      ]);
      await prisma.notification.create({
        data: {
          userId: session.targetId,
          type: 'RIZZ_MESSAGE',
          title: isLast ? '⚡ Last Rizz message!' : '💬 New Rizz message',
          body: isLast ? `${session.initiator.name} sent their final message!` : `${session.initiator.name} sent you a Rizz message`,
          data: { sessionId },
        },
      });
    } else {
      if (!['ACTIVE', 'WAITING'].includes(session.status)) throw new Error('SESSION_NOT_ACTIVE');
      await prisma.$transaction(async (tx) => {
        await tx.rizzMessage.create({ data: { sessionId, senderId, content } });
        if (!session.targetReplied) {
          await tx.rizzSession.update({
            where: { id: sessionId },
            data: { targetReplied: true, status: 'ACCEPTED', unlocked: true },
          });
          const conv = await tx.conversation.create({
            data: {
              type: 'DIRECT',
              participants: {
                create: [{ userId: session.initiatorId }, { userId: session.targetId }],
              },
            },
          });
          conversationId = conv.id;
          await tx.match.upsert({
            where: { senderId_receiverId: { senderId: session.initiatorId, receiverId: session.targetId } },
            create: { senderId: session.initiatorId, receiverId: session.targetId, status: 'ACCEPTED', matchType: 'FRIEND' },
            update: { status: 'ACCEPTED' },
          });
          await tx.notification.create({
            data: {
              userId: session.initiatorId,
              type: 'RIZZ_UNLOCKED',
              title: '🎉 Rizz Unlocked!',
              body: `${session.target.name} replied! You're connected.`,
              data: { sessionId, conversationId: conv.id },
            },
          });
        }
      });
    }

    const messages = await prisma.rizzMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
    const updated = await prisma.rizzSession.findUnique({ where: { id: sessionId } });
    return { messages, session: updated, conversationId };
  },

  async declineSession(sessionId: string, targetId: string) {
    const session = await prisma.rizzSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new Error('SESSION_NOT_FOUND');
    if (session.targetId !== targetId) throw new Error('NOT_YOUR_SESSION');
    if (!['ACTIVE', 'WAITING'].includes(session.status)) throw new Error('SESSION_NOT_ACTIVE');
    await prisma.rizzSession.update({ where: { id: sessionId }, data: { status: 'DECLINED' } });
    return { message: 'Session declined' };
  },

  async generateIcebreakerPrompt(initiatorId: string, targetId: string) {
    const [initiatorInterests, targetInterests] = await Promise.all([
      prisma.userInterest.findMany({ where: { userId: initiatorId }, include: { interest: true } }),
      prisma.userInterest.findMany({ where: { userId: targetId }, include: { interest: true } }),
    ]);
    const initiatorNames = new Set(initiatorInterests.map((i) => i.interest.name));
    const shared = targetInterests.filter((i) => initiatorNames.has(i.interest.name));
    if (shared.length > 0) {
      const pick = shared[Math.floor(Math.random() * shared.length)];
      return { prompt: `You both like ${pick.interest.emoji} ${pick.interest.name}! Ask them something specific about it.` };
    }
    if (targetInterests.length > 0) {
      const pick = targetInterests[Math.floor(Math.random() * Math.min(3, targetInterests.length))];
      return { prompt: `${pick.interest.name} is on their profile — curious about their take?` };
    }
    const fallbacks = [
      "What's been the highlight of your week on campus?",
      "If you could swap majors tomorrow, what would you pick?",
      "Best local food spot near your college?",
    ];
    return { prompt: fallbacks[Math.floor(Math.random() * fallbacks.length)] };
  },

  async getSessions(userId: string, type: 'incoming' | 'outgoing') {
    const where = type === 'incoming' ? { targetId: userId } : { initiatorId: userId };
    return prisma.rizzSession.findMany({
      where,
      include: {
        initiator: { select: { id: true, name: true, avatarUrl: true, collegeName: true, isOnline: true } },
        target: { select: { id: true, name: true, avatarUrl: true, collegeName: true, isOnline: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async getSession(sessionId: string, userId: string) {
    const session = await prisma.rizzSession.findUnique({
      where: { id: sessionId },
      include: {
        initiator: { select: { id: true, name: true, avatarUrl: true, collegeName: true, isOnline: true } },
        target: { select: { id: true, name: true, avatarUrl: true, collegeName: true, isOnline: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!session) throw new Error('NOT_FOUND');
    if (session.initiatorId !== userId && session.targetId !== userId) throw new Error('FORBIDDEN');
    return session;
  },
};
