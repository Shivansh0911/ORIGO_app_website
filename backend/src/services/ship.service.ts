import { prisma } from '../utils/prisma';
import { NotificationService } from './notification.service';

export const ShipService = {
  async createShip(initiatorId: string, targetOneId: string, targetTwoId: string, message?: string) {
    if (targetOneId === targetTwoId) throw new Error('SAME_TARGET');
    if (initiatorId === targetOneId || initiatorId === targetTwoId) throw new Error('CANNOT_SHIP_SELF');

    // Verify initiator has accepted matches with BOTH targets
    const matchOne = await prisma.match.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderId: initiatorId, receiverId: targetOneId },
          { senderId: targetOneId, receiverId: initiatorId },
        ],
      },
    });
    if (!matchOne) throw new Error('NOT_MATCHED_WITH_TARGET_ONE');

    const matchTwo = await prisma.match.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderId: initiatorId, receiverId: targetTwoId },
          { senderId: targetTwoId, receiverId: initiatorId },
        ],
      },
    });
    if (!matchTwo) throw new Error('NOT_MATCHED_WITH_TARGET_TWO');

    // Check not already shipped this pair
    const existing = await prisma.ship.findFirst({
      where: {
        initiatorId,
        OR: [
          { targetOneId, targetTwoId },
          { targetOneId: targetTwoId, targetTwoId: targetOneId },
        ],
      },
    });
    if (existing) throw new Error('ALREADY_SHIPPED');

    const ship = await prisma.ship.create({
      data: {
        initiatorId,
        targetOneId,
        targetTwoId,
        message: message?.trim().slice(0, 200),
        status: 'PENDING',
      },
    });

    const initiator = await prisma.user.findUnique({ where: { id: initiatorId }, select: { name: true } });
    const t1 = await prisma.user.findUnique({ where: { id: targetOneId }, select: { name: true } });
    const t2 = await prisma.user.findUnique({ where: { id: targetTwoId }, select: { name: true } });

    const shipperName = initiator?.name ?? 'Someone';

    // Notify both targets anonymously
    await Promise.all([
      NotificationService.create({
        userId: targetOneId,
        type: 'SHIP_RECEIVED',
        title: '💕 Someone shipped you!',
        body: `A friend thinks you and ${t2?.name ?? 'someone'} would vibe. Check it out!`,
        data: { shipId: ship.id },
      }),
      NotificationService.create({
        userId: targetTwoId,
        type: 'SHIP_RECEIVED',
        title: '💕 Someone shipped you!',
        body: `A friend thinks you and ${t1?.name ?? 'someone'} would vibe. Check it out!`,
        data: { shipId: ship.id },
      }),
    ]);

    return ship;
  },

  async getMyShips(userId: string) {
    const initiated = await prisma.ship.findMany({
      where: { initiatorId: userId },
      include: {
        targetOne: { select: { id: true, name: true, username: true, avatarUrl: true } },
        targetTwo: { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const received = await prisma.ship.findMany({
      where: { OR: [{ targetOneId: userId }, { targetTwoId: userId }] },
      select: {
        id: true, message: true, status: true, createdAt: true,
        targetOne: { select: { id: true, name: true, username: true, avatarUrl: true } },
        targetTwo: { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { initiated, received };
  },

  async getMatches(userId: string) {
    // Return users the requester has accepted matches with (for the target picker)
    const matches = await prisma.match.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: { select: { id: true, name: true, username: true, avatarUrl: true } },
        receiver: { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
    });

    return matches.map((m) => (m.senderId === userId ? m.receiver : m.sender));
  },
};
