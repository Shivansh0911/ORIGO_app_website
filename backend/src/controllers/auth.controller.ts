import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export const AuthController = {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const tokens = await AuthService.register({
        ...req.body,
        ip: req.ip ?? 'unknown',
        userAgent: req.headers['user-agent'] ?? 'unknown',
      });
      res.status(201).json(tokens);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      const status = ['EMAIL_TAKEN', 'USERNAME_TAKEN'].includes(msg) ? 409 : 400;
      res.status(status).json({ error: msg });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { tokens, user } = await AuthService.login(req.body.email, req.body.password);
      res.json({ ...tokens, userId: user.id });
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

  async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      await AuthService.deleteAccount(req.user!.userId);
      res.json({ message: 'Account deleted' });
    } catch {
      res.status(500).json({ error: 'Deletion failed' });
    }
  },
};
