import { prisma } from '../utils/prisma';
import { encrypt, decrypt } from '../utils/encryption';
import { moderateText } from '../utils/moderateText';

export const UserService = {
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { interests: { include: { interest: true } }, privacy: true, subscription: true },
    });
    if (!user) throw new Error('USER_NOT_FOUND');
    return {
      ...user,
      dateOfBirth: user.dateOfBirth ? (() => { try { return decrypt(user.dateOfBirth!); } catch { return null; } })() : null,
      passwordHash: undefined,
    };
  },

  async updateMe(userId: string, data: {
    name?: string; bio?: string; gender?: string; lookingFor?: string[]; avatarUrl?: string; pushToken?: string;
  }) {
    // SEC-16: explicitly pick — never spread req.body directly into a Prisma write
    moderateText(data.bio, data.name);
    const safe: Record<string, unknown> = {};
    if (data.name      !== undefined) safe['name']       = data.name;
    if (data.bio       !== undefined) safe['bio']        = data.bio;
    if (data.gender    !== undefined) safe['gender']     = data.gender;
    if (data.lookingFor !== undefined) safe['lookingFor'] = data.lookingFor;
    if (data.avatarUrl !== undefined) safe['avatarUrl']  = data.avatarUrl;
    if (data.pushToken !== undefined) safe['pushToken']  = data.pushToken;
    return prisma.user.update({
      where: { id: userId },
      data: safe as Parameters<typeof prisma.user.update>[0]['data'],
    });
  },

  async updateInterests(userId: string, interestIds: string[]) {
    await prisma.$transaction([
      prisma.userInterest.deleteMany({ where: { userId } }),
      prisma.userInterest.createMany({
        data: interestIds.slice(0, 10).map((interestId) => ({ userId, interestId })),
        skipDuplicates: true,
      }),
    ]);
    return { message: 'Interests updated' };
  },

  async getPublicProfile(userId: string, requesterId: string) {
    const block = await prisma.block.findFirst({
      where: { OR: [{ blockerId: requesterId, blockedId: userId }, { blockerId: userId, blockedId: requesterId }] },
    });
    if (block) throw new Error('BLOCKED');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { interests: { include: { interest: true } }, privacy: true },
    });
    if (!user || !user.isActive) throw new Error('NOT_FOUND');
    if (user.privacy?.discoverableBy === 'NOBODY') throw new Error('FORBIDDEN');
    const { passwordHash, dateOfBirth, phone, collegeEmail, firebaseUid, pushToken, ...safe } = user;
    return safe;
  },

  async blockUser(blockerId: string, blockedId: string) {
    await prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    });
    return { message: 'Blocked' };
  },

  async unblockUser(blockerId: string, blockedId: string) {
    await prisma.block.delete({ where: { blockerId_blockedId: { blockerId, blockedId } } });
    return { message: 'Unblocked' };
  },

  async reportUser(reporterId: string, targetId: string, reason: string) {
    await prisma.report.create({ data: { reporterId, targetId, targetType: 'USER', reason } });
    return { message: 'Report submitted' };
  },

  async registerPushToken(userId: string, token: string) {
    await prisma.user.update({ where: { id: userId }, data: { pushToken: token } });
    return { message: 'Token registered' };
  },

  async getAllInterests() {
    return prisma.interest.findMany({ orderBy: { category: 'asc' } });
  },
};
