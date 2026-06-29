import { MatchType, MatchStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';

export const MatchService = {
  async sendMatch(senderId: string, receiverId: string, matchType: MatchType = 'FRIEND') {
    if (senderId === receiverId) throw new Error('CANNOT_MATCH_SELF');

    const block = await prisma.block.findFirst({
      where: { OR: [{ blockerId: senderId, blockedId: receiverId }, { blockerId: receiverId, blockedId: senderId }] },
    });
    if (block) throw new Error('BLOCKED');

    const existing = await prisma.match.findFirst({
      where: { OR: [{ senderId, receiverId }, { senderId: receiverId, receiverId: senderId }] },
    });
    if (existing) throw new Error('ALREADY_EXISTS');

    const sender = await prisma.user.findUnique({ where: { id: senderId }, select: { name: true } });

    const match = await prisma.match.create({ data: { senderId, receiverId, matchType } });

    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'MATCH_REQUEST',
        title: '💫 New connection request',
        body: `${sender?.name ?? 'Someone'} wants to connect with you!`,
        data: { matchId: match.id },
      },
    });

    return match;
  },

  async respondMatch(matchId: string, userId: string, accept: boolean) {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new Error('NOT_FOUND');
    if (match.receiverId !== userId) throw new Error('FORBIDDEN');
    if (match.status !== 'PENDING') throw new Error('ALREADY_RESPONDED');

    if (accept) {
      const [updated] = await prisma.$transaction([
        prisma.match.update({ where: { id: matchId }, data: { status: 'ACCEPTED' } }),
        prisma.notification.create({
          data: {
            userId: match.senderId,
            type: 'MATCH_ACCEPTED',
            title: '🎉 Connection accepted!',
            body: 'Your connection request was accepted.',
            data: { matchId },
          },
        }),
      ]);

      const convExists = await prisma.conversationParticipant.findFirst({
        where: { userId: match.senderId, conversation: { participants: { some: { userId: match.receiverId } } } },
      });
      if (!convExists) {
        await prisma.conversation.create({
          data: {
            type: 'DIRECT',
            participants: { create: [{ userId: match.senderId }, { userId: match.receiverId }] },
          },
        });
      }
      return updated;
    } else {
      return prisma.match.update({ where: { id: matchId }, data: { status: 'REJECTED' } });
    }
  },

  async getMatches(userId: string, status?: string) {
    return prisma.match.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        ...(status ? { status: status as MatchStatus } : {}),
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true, collegeName: true, isVerified: true } },
        receiver: { select: { id: true, name: true, avatarUrl: true, collegeName: true, isVerified: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async unmatch(matchId: string, userId: string) {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new Error('NOT_FOUND');
    if (match.senderId !== userId && match.receiverId !== userId) throw new Error('FORBIDDEN');
    await prisma.match.delete({ where: { id: matchId } });
    return { message: 'Unmatched' };
  },
};
