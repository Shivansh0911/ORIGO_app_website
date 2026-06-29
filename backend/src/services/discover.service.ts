import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

interface DiscoverFilters {
  gender?: string;
  lookingFor?: string;
  collegeName?: string;
}

export const DiscoverService = {
  async getPeople(userId: string, filters: DiscoverFilters, page = 1) {
    const me = await prisma.user.findUnique({
      where: { id: userId },
      include: { interests: true, privacy: true },
    });
    if (!me) throw new Error('USER_NOT_FOUND');

    const blocked = await prisma.block.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    });
    const blockedIds = new Set(blocked.flatMap((b) => [b.blockerId, b.blockedId]));
    blockedIds.delete(userId);

    const existingMatches = await prisma.match.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      select: { senderId: true, receiverId: true },
    });
    const matchedIds = new Set(existingMatches.flatMap((m) => [m.senderId, m.receiverId]));
    matchedIds.delete(userId);

    const excludeIds = Array.from(new Set([...blockedIds, ...matchedIds, userId]));

    const where: Prisma.UserWhereInput = {
      id: { notIn: excludeIds },
      isActive: true,
      privacy: { discoverableBy: { not: 'NOBODY' } },
    };

    if (!me.isPremium) {
      where.collegeName = me.collegeName ?? undefined;
    } else if (filters.collegeName) {
      where.collegeName = filters.collegeName;
    }

    if (filters.gender) {
      where.gender = filters.gender as 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY';
    }

    if (filters.lookingFor) {
      where.lookingFor = { has: filters.lookingFor as 'FRIENDS' | 'DATING' | 'NETWORKING' | 'STUDY_BUDDY' };
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        interests: { include: { interest: true } },
        privacy: true,
      },
      skip: (page - 1) * 20,
      take: 20,
      orderBy: { lastSeen: 'desc' },
    });

    const myInterestIds = new Set(me.interests.map((i) => i.interestId));

    const scored = users.map((u) => {
      const sharedInterests = u.interests.filter((i) => myInterestIds.has(i.interestId)).length;
      const totalInterests = Math.max(me.interests.length, u.interests.length, 1);
      const interestScore = (sharedInterests / totalInterests) * 60;
      const campusScore = u.collegeName === me.collegeName ? 25 : 0;
      const lookingForScore = me.lookingFor.some((lf) => u.lookingFor.includes(lf)) ? 15 : 0;
      const compatibilityScore = Math.round(interestScore + campusScore + lookingForScore);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, dateOfBirth, phone, collegeEmail, firebaseUid, pushToken, ...safe } = u;
      return { ...safe, compatibilityScore };
    });

    return scored.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  },

  async getCampusPeople(userId: string) {
    const me = await prisma.user.findUnique({ where: { id: userId } });
    if (!me?.collegeName) return [];
    return DiscoverService.getPeople(userId, { collegeName: me.collegeName });
  },
};
