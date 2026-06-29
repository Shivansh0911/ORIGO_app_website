import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Resend } from 'resend';
import { prisma } from '../utils/prisma';
import { redis } from '../utils/redis';
import { encrypt, decrypt } from '../utils/encryption';
import { issueTokenPair, invalidateAllSessions } from '../utils/jwt';

const resend = new Resend(process.env.RESEND_API_KEY);
const DEVICE_ID_DEFAULT = 'web';

export const AuthService = {
  async register(data: {
    name: string;
    username: string;
    email: string;
    password: string;
    dateOfBirth: string;
    ip: string;
    userAgent: string;
  }) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    });
    if (existing) {
      throw new Error(existing.email === data.email ? 'EMAIL_TAKEN' : 'USERNAME_TAKEN');
    }
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          name: data.name,
          username: data.username.toLowerCase(),
          email: data.email.toLowerCase(),
          passwordHash,
          dateOfBirth: encrypt(data.dateOfBirth),
        },
      });
      await tx.userPrivacy.create({ data: { userId: u.id } });
      await tx.consentLog.create({
        data: { userId: u.id, version: '1.0', ipAddress: data.ip, userAgent: data.userAgent },
      });
      return u;
    });
    return issueTokenPair(user.id, DEVICE_ID_DEFAULT);
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) throw new Error('INVALID_CREDENTIALS');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error('INVALID_CREDENTIALS');
    if (!user.isActive) throw new Error('ACCOUNT_DISABLED');
    return { tokens: await issueTokenPair(user.id, DEVICE_ID_DEFAULT), user };
  },

  async refresh(userId: string, deviceId: string, oldToken: string) {
    const { rotateRefreshToken } = await import('../utils/jwt');
    return rotateRefreshToken(userId, deviceId, oldToken);
  },

  async logout(userId: string, deviceId: string) {
    await redis.del(`refresh:${userId}:${deviceId}`);
  },

  async verifyCollegeEmail(userId: string, collegeEmail: string) {
    const existing = await prisma.user.findFirst({ where: { collegeEmail: encrypt(collegeEmail) } });
    if (existing && existing.id !== userId) throw new Error('COLLEGE_EMAIL_TAKEN');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redis.set(`otp:${userId}`, otp, 'EX', 300);
    try {
      await resend.emails.send({
        from: 'Origo <verify@origo.app>',
        to: [collegeEmail],
        subject: 'Your Origo verification code',
        html: `<h2>Your OTP is: <strong>${otp}</strong></h2><p>Expires in 5 minutes.</p>`,
      });
    } catch {
      // Log but don't throw — for dev
      console.error('Email send failed');
    }
    return { message: 'OTP sent' };
  },

  async confirmOtp(userId: string, otp: string) {
    const stored = await redis.get(`otp:${userId}`);
    if (!stored || stored !== otp) throw new Error('INVALID_OTP');
    await redis.del(`otp:${userId}`);
    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true, verifiedAt: new Date() },
    });
    return { message: 'Email verified' };
  },

  async uploadStudentId(userId: string, s3Key: string) {
    await prisma.user.update({ where: { id: userId }, data: { studentIdUrl: s3Key } });
    return { message: 'Student ID uploaded, under review' };
  },

  async deleteAccount(userId: string) {
    await prisma.$transaction([
      prisma.rizzMessage.deleteMany({ where: { senderId: userId } }),
      prisma.message.deleteMany({ where: { senderId: userId } }),
      prisma.postLike.deleteMany({ where: { userId } }),
      prisma.comment.deleteMany({ where: { authorId: userId } }),
      prisma.post.deleteMany({ where: { authorId: userId } }),
      prisma.notification.deleteMany({ where: { userId } }),
      prisma.consentLog.deleteMany({ where: { userId } }),
      prisma.block.deleteMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] } }),
      prisma.report.deleteMany({ where: { OR: [{ reporterId: userId }, { targetId: userId }] } }),
      prisma.match.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } }),
      prisma.userInterest.deleteMany({ where: { userId } }),
      prisma.communityMember.deleteMany({ where: { userId } }),
      prisma.subscription.deleteMany({ where: { userId } }),
      prisma.profileBoost.deleteMany({ where: { userId } }),
      prisma.userPrivacy.deleteMany({ where: { userId } }),
      prisma.user.update({ where: { id: userId }, data: { isActive: false, email: `deleted_${userId}@deleted.origo` } }),
    ]);
    await invalidateAllSessions(userId);
    await prisma.deletionAuditLog.create({ data: { userId, reason: 'user_request' } });
  },
};
