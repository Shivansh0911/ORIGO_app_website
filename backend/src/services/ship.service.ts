import { prisma } from '../utils/prisma';
import { NotificationService } from './notification.service';
import { MATCHING } from '../config/matching';

export const ShipService = {
  // SHIP FREE FOR V1 LAUNCH — no payment required. When re-enabled, require a
  // verified, not-yet-consumed IapPurchase (item: 'SHIP') for the given orderId
  // and consume it atomically with ship creation (see payment.service.ts /
  // IapPurchase — the plumbing already exists, just isn't wired in here).
  async createShip(initiatorId: string, targetOneId: string, targetTwoId: string, message?: string) {
    if (targetOneId === targetTwoId) throw new Error('SAME_TARGET');
    if (initiatorId === targetOneId || initiatorId === targetTwoId) throw new Error('CANNOT_SHIP_SELF');

    // Eligibility is campus-wide, not matches-only.
    //
    // Requiring an ACCEPTED match with *both* targets made Ship unusable at
    // launch: matches only come from Rizz conversions, so on day one nobody
    // has any, and a new user needs two before they can ship anyone at all.
    // That killed the feature exactly when it is most useful — third-party
    // matchmaking removes the ego risk that stops shy people, and it is
    // inherently viral, since both targets get told and will talk about it.
    const [initiator, targetOne, targetTwo] = await Promise.all([
      prisma.user.findUnique({ where: { id: initiatorId }, select: { name: true, collegeName: true } }),
      prisma.user.findUnique({
        where: { id: targetOneId },
        select: { name: true, collegeName: true, isActive: true, privacy: { select: { allowShipsFrom: true } } },
      }),
      prisma.user.findUnique({
        where: { id: targetTwoId },
        select: { name: true, collegeName: true, isActive: true, privacy: { select: { allowShipsFrom: true } } },
      }),
    ]);

    if (!targetOne?.isActive || !targetTwo?.isActive) throw new Error('TARGET_UNAVAILABLE');

    // Same campus for all three. Cross-campus shipping is a cold intro between
    // people with no shared context at all, which is spam rather than matchmaking.
    if (
      !initiator?.collegeName ||
      targetOne.collegeName !== initiator.collegeName ||
      targetTwo.collegeName !== initiator.collegeName
    ) {
      throw new Error('DIFFERENT_CAMPUS');
    }

    // B4: honour UserPrivacy.allowShipsFrom. This field has existed in the
    // schema since the beginning and was checked in exactly zero places — the
    // toggle was decorative, and users who had explicitly opted out were still
    // being shipped and notified.
    if (targetOne.privacy && !targetOne.privacy.allowShipsFrom) throw new Error('TARGET_ONE_OPTED_OUT');
    if (targetTwo.privacy && !targetTwo.privacy.allowShipsFrom) throw new Error('TARGET_TWO_OPTED_OUT');

    // Blocks apply in every direction — never introduce people who have
    // blocked each other, or either of whom has blocked the shipper.
    const ids = [initiatorId, targetOneId, targetTwoId];
    const block = await prisma.block.findFirst({
      where: { blockerId: { in: ids }, blockedId: { in: ids } },
    });
    if (block) throw new Error('BLOCKED');

    // Daily cap. Each ship notifies two people who didn't ask for it, so an
    // uncapped version is a spam vector wearing a friendly hat.
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const sentToday = await prisma.ship.count({
      where: { initiatorId, createdAt: { gte: today } },
    });
    if (sentToday >= MATCHING.shipsPerDay) throw new Error('DAILY_SHIP_LIMIT_REACHED');

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

    // Names already fetched during eligibility checks above — no need to
    // re-query. (The shipper's name is deliberately never used in either
    // notification: ships are anonymous to the people being shipped.)
    const t1 = targetOne;
    const t2 = targetTwo;

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

  /**
   * Candidates for the ship picker: anyone on your campus who hasn't opted out.
   *
   * Previously this returned only your accepted matches, which mirrored the old
   * eligibility rule and made the picker empty for every new user. Now it
   * matches what createShip actually allows.
   */
  async getEligibleTargets(userId: string) {
    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { collegeName: true },
    });
    if (!me?.collegeName) return [];

    const blocks = await prisma.block.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    });
    const blockedIds = blocks
      .flatMap((b) => [b.blockerId, b.blockedId])
      .filter((id) => id !== userId);

    return prisma.user.findMany({
      where: {
        id: { notIn: [userId, ...blockedIds] },
        collegeName: me.collegeName,
        isActive: true,
        isVerified: true,
        // Respect the opt-out. Users with no privacy row default to allowed,
        // matching the schema default.
        OR: [{ privacy: { is: null } }, { privacy: { allowShipsFrom: true } }],
      },
      select: { id: true, name: true, username: true, avatarUrl: true },
      // Recently active first — more likely to be someone the shipper actually
      // knows. The picker needs client-side search at campus scale.
      orderBy: { lastSeen: 'desc' },
      take: 200,
    });
  },
};
