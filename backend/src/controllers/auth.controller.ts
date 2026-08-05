import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { prisma } from '../utils/prisma';

export const AuthController = {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const tokens = await AuthService.register({
        ...req.body,
        ip: req.ip ?? 'unknown',
        userAgent: req.headers['user-agent'] ?? 'unknown',
      });
      
      const fullUser = await prisma.user.findUnique({
        where: { email: req.body.email.toLowerCase() },
        include: {
          interests: {
            include: {
              interest: true,
            },
          },
          prompts: { orderBy: { position: 'asc' } },
        },
      });
      const { passwordHash, dateOfBirth, phone, collegeEmail, collegeEmailHash, firebaseUid, pushToken, ...safeUser } = fullUser!;

      res.status(201).json({
        ...tokens,
        user: safeUser,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      const status = ['EMAIL_TAKEN', 'USERNAME_TAKEN'].includes(msg) ? 409 : 400;
      res.status(status).json({ error: msg });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { tokens, user } = await AuthService.login(req.body.email, req.body.password);
      
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          interests: {
            include: {
              interest: true,
            },
          },
          prompts: { orderBy: { position: 'asc' } },
        },
      });
      const { passwordHash, dateOfBirth, phone, collegeEmail, collegeEmailHash, firebaseUid, pushToken, ...safeUser } = fullUser!;

      res.json({
        ...tokens,
        user: safeUser,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      res.status(401).json({ error: msg });
    }
  },

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken, deviceId, userId } = req.body as { refreshToken: string; deviceId: string; userId: string };
      const tokens = await AuthService.refresh(userId, deviceId, refreshToken);
      res.json(tokens);
    } catch (err: unknown) {
      res.status(401).json({ error: 'Token refresh failed' });
    }
  },

  async logout(req: Request, res: Response): Promise<void> {
    try {
      await AuthService.logout(req.user!.userId, req.user!.deviceId);
      res.json({ message: 'Logged out' });
    } catch {
      res.status(500).json({ error: 'Logout failed' });
    }
  },

  async verifyCollegeEmail(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.verifyCollegeEmail(req.user!.userId, req.body.collegeEmail);
      res.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      res.status(400).json({ error: msg });
    }
  },

  async confirmOtp(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.confirmOtp(req.user!.userId, req.body.otp);
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({ error: 'Invalid OTP' });
    }
  },

  async googleAuth(req: Request, res: Response): Promise<void> {
    try {
      const { idToken } = req.body as { idToken: string };
      if (!idToken) { res.status(400).json({ error: 'idToken required' }); return; }
      const { tokens, user: rawUser } = await AuthService.googleAuth(
        idToken,
        req.ip ?? 'unknown',
        req.headers['user-agent'] ?? 'unknown',
      );
      const fullUser = await prisma.user.findUnique({
        where: { id: rawUser.id },
        include: {
          interests: { include: { interest: true } },
          prompts: { orderBy: { position: 'asc' } },
        },
      });
      const { passwordHash, dateOfBirth, phone, collegeEmail, collegeEmailHash, firebaseUid, pushToken, ...safeUser } = fullUser!;
      res.json({ ...tokens, user: { ...safeUser, needsDob: !dateOfBirth } });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google auth failed';
      const status = msg === 'ACCOUNT_DISABLED' ? 403 : msg.startsWith('INVALID') ? 401 : 400;
      res.status(status).json({ error: msg });
    }
  },

  async setDob(req: Request, res: Response): Promise<void> {
    try {
      const { dateOfBirth } = req.body as { dateOfBirth: string };
      if (!dateOfBirth) { res.status(400).json({ error: 'dateOfBirth required' }); return; }
      const dob = new Date(dateOfBirth);
      const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (age < 18) { res.status(400).json({ error: 'Must be 18 or older' }); return; }
      const { encrypt } = await import('../utils/encryption');
      await prisma.user.update({
        where: { id: req.user!.userId },
        data: { dateOfBirth: encrypt(dateOfBirth) },
      });
      res.json({ message: 'Date of birth saved' });
    } catch {
      res.status(500).json({ error: 'Failed to save date of birth' });
    }
  },

  async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      await AuthService.deleteAccount(req.user!.userId);
      res.json({ message: 'Account deleted' });
    } catch {
      res.status(500).json({ error: 'Deletion failed' });
    }
  },
};
