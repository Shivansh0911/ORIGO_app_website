import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Resend } from 'resend';
import { OAuth2Client } from 'google-auth-library';
import type { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { redis } from '../utils/redis';
import { encrypt, decrypt } from '../utils/encryption';
import { hashForIndex } from '../utils/blindIndex';
import { findCollegeByEmail } from '../config/collegeDomains';
import { issueTokenPair, invalidateAllSessions } from '../utils/jwt';
import { resolveCollegeFromWorkspaceDomain } from '../utils/collegeDomains';

// PSEUDO: Set GOOGLE_CLIENT_ID in Railway env vars
// → Get it from console.cloud.google.com → APIs & Services → Credentials → OAuth 2.0 Client ID
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const resend = new Resend(process.env.RESEND_API_KEY);

// Matches RegisterSchema's username rule (3-20 chars, lowercase/digits/underscore)
// so a Google-derived username can't slip past constraints normal signup enforces.
function sanitizeUsername(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 16);
  return cleaned.length >= 3 ? cleaned : `${cleaned}${crypto.randomBytes(3).toString('hex')}`.slice(0, 16);
}

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
            dateOfBirth: encrypt(data.dateOfBirth),
          },
        });
        return issueTokenPair(user.id, crypto.randomUUID());
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
          dateOfBirth: encrypt(data.dateOfBirth),
        },
      });
      await tx.userPrivacy.create({ data: { userId: u.id } });
      await tx.consentLog.create({
        data: { userId: u.id, version: '1.0', ipAddress: data.ip, userAgent: data.userAgent },
      });
      return u;
    });
    return issueTokenPair(user.id, crypto.randomUUID());
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) throw new Error('INVALID_CREDENTIALS');
    if (!user.passwordHash) throw new Error('GOOGLE_ACCOUNT'); // signed up via Google — no password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error('INVALID_CREDENTIALS');
    if (!user.isActive) throw new Error('ACCOUNT_DISABLED');
    return { tokens: await issueTokenPair(user.id, crypto.randomUUID()), user };
  },

  async googleAuth(idToken: string, ip: string, userAgent: string) {
    // 1. Verify the ID token against Google's public keys
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub) throw new Error('INVALID_GOOGLE_TOKEN');

    const { sub: googleId, email, email_verified: emailVerified, name, picture, hd } = payload;
    if (!email) throw new Error('GOOGLE_NO_EMAIL');
    // Google's own guidance: don't trust the email claim unless this is
    // explicitly true. We use `email` both to link/create accounts and (via
    // `hd` below) to auto-verify college status, so an unverified claim here
    // would let someone skip both the password *and* the OTP check.
    if (emailVerified === false) throw new Error('GOOGLE_EMAIL_NOT_VERIFIED');

    // `hd` (hosted domain) is only present for Google Workspace / G Suite
    // accounts — i.e. issued and controlled by the institution itself. A
    // personal Gmail address never carries it. Resolving it here is what lets
    // a real college Google account skip the manual OTP step; a personal
    // account still has to go through /verify-college like everyone else.
    const campus = resolveCollegeFromWorkspaceDomain(hd);

    // 2. Find existing user by googleId, then fall back to email match (link accounts)
    let user = await prisma.user.findUnique({ where: { googleId } })
      ?? await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (user) {
      // Link googleId to existing account if not already linked
      const updates: Prisma.UserUpdateInput = {};
      if (!user.googleId) updates.googleId = googleId;
      // Upgrade to verified if they signed in with a resolvable college
      // Workspace account and hadn't already verified another way.
      if (campus && !user.isVerified) {
        updates.isVerified = true;
        updates.verifiedAt = new Date();
        if (!user.collegeName) updates.collegeName = campus.collegeName;
        if (!user.collegeEmail) {
          updates.collegeEmail = encrypt(email);
          updates.collegeEmailHash = hashForIndex(email);
        }
      }
      if (Object.keys(updates).length > 0) {
        user = await prisma.user.update({ where: { id: user.id }, data: updates });
      }
      if (!user.isActive) throw new Error('ACCOUNT_DISABLED');
    } else {
      // 3. Create new user from Google profile
      const base = sanitizeUsername(name ?? email.split('@')[0]);
      let username = base;
      let attempt = 0;
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${base}${++attempt}`;
      }
      user = await prisma.$transaction(async (tx) => {
        const u = await tx.user.create({
          data: {
            name: name ?? username,
            username,
            email: email.toLowerCase(),
            passwordHash: null,
            googleId,
            avatarUrl: picture ?? null,
            ...(campus
              ? {
                  isVerified: true,
                  verifiedAt: new Date(),
                  collegeName: campus.collegeName,
                  collegeEmail: encrypt(email),
                  collegeEmailHash: hashForIndex(email),
                }
              : {}),
          },
        });
        await tx.userPrivacy.create({ data: { userId: u.id } });
        await tx.consentLog.create({
          data: { userId: u.id, version: '1.0', ipAddress: ip, userAgent },
        });
        return u;
      });
    }

    const tokens = await issueTokenPair(user.id, crypto.randomUUID());
    return { tokens, user };
  },

  async refresh(userId: string, deviceId: string, oldToken: string) {
    const { rotateRefreshToken } = await import('../utils/jwt');
    return rotateRefreshToken(userId, deviceId, oldToken);
  },

  async logout(userId: string, deviceId: string) {
    await redis.del(`refresh:${userId}:${deviceId}`);
  },

  async verifyCollegeEmail(userId: string, collegeEmail: string) {
    // SEC-04: reject domains not on the campus allowlist
    const college = findCollegeByEmail(collegeEmail);
    if (!college) throw new Error('UNRECOGNISED_COLLEGE_DOMAIN');

    // SEC-03: use blind index for dedup — encrypt() uses random IV so direct lookup never matches
    const emailHash = hashForIndex(collegeEmail);
    const existing = await prisma.user.findUnique({ where: { collegeEmailHash: emailHash } });
    if (existing && existing.id !== userId) throw new Error('COLLEGE_EMAIL_TAKEN');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redis.set(`otp:${userId}`, otp, 'EX', 300);
    await redis.set(`otp_email:${userId}`, collegeEmail.toLowerCase().trim(), 'EX', 300);
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

    // Retrieve the college email stored in the temp key so we can persist hash + collegeName
    const collegeEmail = await redis.get(`otp_email:${userId}`);
    await redis.del(`otp_email:${userId}`);

    const updates: Record<string, unknown> = { isVerified: true, verifiedAt: new Date() };
    if (collegeEmail) {
      updates.collegeEmail = encrypt(collegeEmail);
      updates.collegeEmailHash = hashForIndex(collegeEmail);
      const college = findCollegeByEmail(collegeEmail);
      if (college) updates.collegeName = college.collegeName;
    }

    await prisma.user.update({ where: { id: userId }, data: updates as Parameters<typeof prisma.user.update>[0]['data'] });
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
      // SEC-13: pulse data must be removed on DPDP deletion
      prisma.pulseResponse.deleteMany({ where: { responderId: userId } }),
      prisma.pulse.deleteMany({ where: { authorId: userId } }),
      prisma.user.update({ where: { id: userId }, data: { isActive: false, email: `deleted_${userId}@deleted.origo` } }),
    ]);
    await invalidateAllSessions(userId);
    await prisma.deletionAuditLog.create({ data: { userId, reason: 'user_request' } });
  },
};
