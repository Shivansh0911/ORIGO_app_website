import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

interface DiscoverFilters {
  gender?: string;
  lookingFor?: string;
  collegeName?: string;
}

// Jaccard similarity coefficient: |A ∩ B| / |A ∪ B|
// Treats interest lists as binary feature vectors — proper set-based similarity
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const item of a) if (b.has(item)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// Rewards profiles active within the last 72 hours (max 10 pts)
function recencyBonus(lastSeen: Date | null): number {
  if (!lastSeen) return 0;
  const hoursAgo = (Date.now() - new Date(lastSeen).getTime()) / 3_600_000;
  if (hoursAgo < 1) return 10;
  if (hoursAgo < 24) return 6;
  if (hoursAgo < 72) return 3;
  return 0;
}

// Rewards completed profiles so users see filled-in cards first (max 5 pts)
function completenessBonus(u: { bio: string | null; avatarUrl: string | null }): number {
  return (u.avatarUrl ? 3 : 0) + (u.bio ? 2 : 0);
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

    // Fetch a wider pool (100) ordered by recency, then rank by vector score
    const users = await prisma.user.findMany({
      where,
      include: {
        interests: { include: { interest: true } },
        privacy: true,
      },
      skip: 0,
      take: 100,
      orderBy: { lastSeen: 'desc' },
    });

    // Build my feature vectors once
    const myInterestVec = new Set(me.interests.map((i) => i.interestId));
    const myGoalVec = new Set(me.lookingFor as string[]);

    const scored = users.map((u) => {
      const theirInterestVec = new Set(u.interests.map((i) => i.interestId));
      const theirGoalVec = new Set(u.lookingFor as string[]);

      // Weighted composite (max 100):
      //   Interest Jaccard → 55 pts  (primary compatibility)
      //   Goal Jaccard     → 20 pts  (lookingFor alignment)
      //   Same campus      → 15 pts  (proximity)
      //   Recency bonus    → 10 pts  (activity freshness)
      //   Completeness     →  5 pts  (profile quality, soft boost)
      const interestScore = jaccard(myInterestVec, theirInterestVec) * 55;
      const goalScore = jaccard(myGoalVec, theirGoalVec) * 20;
      const campusScore = u.collegeName === me.collegeName ? 15 : 0;
      const recency = recencyBonus(u.lastSeen);
      const completeness = completenessBonus(u);

      const compatibilityScore = Math.min(
        100,
        Math.round(interestScore + goalScore + campusScore + recency + completeness),
      );

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, dateOfBirth, phone, collegeEmail, firebaseUid, pushToken, ...safe } = u;
      return { ...safe, compatibilityScore };
    });

    // Sort by score descending, then paginate the ranked list
    scored.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    return scored.slice((page - 1) * 20, page * 20);
  },

  async getCampusPeople(userId: string) {
    const me = await prisma.user.findUnique({ where: { id: userId } });
    if (!me?.collegeName) return [];
    return DiscoverService.getPeople(userId, { collegeName: me.collegeName });
  },
};
