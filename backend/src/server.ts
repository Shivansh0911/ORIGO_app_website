import 'dotenv/config';

function checkEnv(): void {
  const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'FIELD_ENCRYPTION_KEY', 'BLIND_INDEX_KEY', 'DATABASE_URL'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) throw new Error(`[startup] Missing required env vars: ${missing.join(', ')}`);
  if (!/^[0-9a-fA-F]{64}$/.test(process.env['FIELD_ENCRYPTION_KEY']!)) {
    throw new Error('[startup] FIELD_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)');
  }
  if (!/^[0-9a-fA-F]{64}$/.test(process.env['BLIND_INDEX_KEY']!)) {
    throw new Error('[startup] BLIND_INDEX_KEY must be exactly 64 hex characters (32 bytes)');
  }
}
checkEnv();

import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';

import { apiLimiter } from './middleware/rateLimiter';
import { authMiddleware, requireVerified } from './middleware/auth';
import { initSocket } from './socket';
import { startRizzExpiryJob } from './jobs/rizzExpiry.job';
import { startPulseExpiryJob } from './jobs/pulseExpiry.job';

import { ModerationError } from './utils/moderateText';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import rizzRoutes from './routes/rizz.routes';
import discoverRoutes from './routes/discover.routes';
import chatRoutes from './routes/chat.routes';
import matchesRoutes from './routes/matches.routes';
import communitiesRoutes from './routes/communities.routes';
import postsRoutes from './routes/posts.routes';
import notificationsRoutes from './routes/notifications.routes';
// PSEUDO: Payments use mock Razorpay orders until RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET are set in env.
// SEC-02 TODO: Add PaymentOrder table + webhook verification before going live with real keys.
import paymentsRoutes from './routes/payments.routes';
import shipsRoutes from './routes/ships.routes';
import pulseRoutes from './routes/pulse.routes';

const app = express();
const httpServer = createServer(app);

app.use(helmet());

// SEC-11: never fall back to '*' with credentials — browsers reject that combo
// Set ALLOWED_ORIGINS=https://your-domain.com,https://app.yourdomain.com in production
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim())
  ?? (process.env.NODE_ENV === 'production'
      ? [] // will 403 unrecognised origins in prod if env not set — correct, not a silent bug
      : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4173']);

app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server / curl (no Origin header)
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString(), version: '1.0.0' }));

app.use(apiLimiter);

app.use('/v1/auth', authRoutes);
app.use('/v1/users', usersRoutes);
app.use('/v1/rizz', authMiddleware, requireVerified, rizzRoutes);
app.use('/v1/discover', authMiddleware, requireVerified, discoverRoutes);
app.use('/v1/conversations', chatRoutes);
app.use('/v1/matches', authMiddleware, requireVerified, matchesRoutes);
app.use('/v1/communities', authMiddleware, requireVerified, communitiesRoutes);
app.use('/v1/posts', postsRoutes);
app.use('/v1/notifications', notificationsRoutes);
app.use('/v1/payments', paymentsRoutes);
app.use('/v1/ships', shipsRoutes);
app.use('/v1/pulse', authMiddleware, requireVerified, pulseRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ModerationError) {
    return res.status(422).json({ error: 'CONTENT_MODERATION_FAILED' });
  }
  console.error('[Error]', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);

initSocket(httpServer);
startRizzExpiryJob();
startPulseExpiryJob();

httpServer.listen(PORT, () => {
  console.log(`\n🚀 Origo backend → http://localhost:${PORT}`);
  console.log(`📊 Health → http://localhost:${PORT}/health\n`);
});

export { app, httpServer };
