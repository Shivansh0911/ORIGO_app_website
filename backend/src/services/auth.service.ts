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
    dateOfBirth?: string;
    ip: string;
    userAgent: string;
  }) {
    const emailLower = data.email.toLowerCase();
    const usernameLower = data.username.toLowerCase();

    // Check existing email
    const existingEmailUser = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (existingEmailUser) {
      if (!existingEmailUser.isVerified) {
        // Check if the requested username belongs to someone else
        const takenUsername = await prisma.user.findFirst({
          where: { username: usernameLower, id: { not: existingEmailUser.id } },
        });

        if (takenUsername) {
          if (!takenUsername.isVerified) {
            await prisma.user.delete({ where: { id: takenUsername.id } });
          } else {
            throw new Error('USERNAME_TAKEN');
          }
        }

        // Unverified draft account: update credentials and resume signup flow
        const passwordHash = await bcrypt.hash(data.password, 12);
        const user = await prisma.user.update({
          where: { id: existingEmailUser.id },
          data: {
            name: data.name,
            username: usernameLower,
            passwordHash,
            dateOfBirth: data.dateOfBirth ? encrypt(data.dateOfBirth) : null,
          },
        });
        return issueTokenPair(user.id, DEVICE_ID_DEFAULT);
      }
      throw new Error('EMAIL_TAKEN');
    }

    // Check existing username
    const existingUsernameUser = await prisma.user.findUnique({
      where: { username: usernameLower },
    });

    if (existingUsernameUser) {
      if (!existingUsernameUser.isVerified) {
        // Reclaim username from abandoned unverified account
        await prisma.user.delete({ where: { id: existingUsernameUser.id } });
      } else {
        throw new Error('USERNAME_TAKEN');
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          name: data.name,
          username: usernameLower,
          email: emailLower,
          passwordHash,
          dateOfBirth: data.dateOfBirth ? encrypt(data.dateOfBirth) : null,
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
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n🔑 [DEV ONLY] Verification OTP for user ${userId} (${collegeEmail}) is: ${otp}\n`);
      }
      await resend.emails.send({
        from: 'Origo <verify@origo.app>',
        to: [collegeEmail],
        subject: 'Your Origo verification code',
        html: `<h2>Your OTP is: <strong>${otp}</strong></h2><p>Expires in 5 minutes.</p>`,
      });
    } catch {
      // Log but don't throw — for dev
      if (process.env.NODE_ENV === 'development') {
        console.error('Email send failed. (See generated OTP in console above)');
      } else {
        console.error('Email send failed');
      }
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
