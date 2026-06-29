import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';

import { apiLimiter } from './middleware/rateLimiter';
import { initSocket } from './socket';
import { startRizzExpiryJob } from './jobs/rizzExpiry.job';

import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import rizzRoutes from './routes/rizz.routes';
import discoverRoutes from './routes/discover.routes';
import chatRoutes from './routes/chat.routes';
import matchesRoutes from './routes/matches.routes';
import communitiesRoutes from './routes/communities.routes';
import notificationsRoutes from './routes/notifications.routes';
import paymentsRoutes from './routes/payments.routes';

const app = express();
const httpServer = createServer(app);

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString(), version: '1.0.0' }));

app.use('/v1/auth', authRoutes);
app.use('/v1/users', usersRoutes);
app.use('/v1/rizz', rizzRoutes);
app.use('/v1/discover', discoverRoutes);
app.use('/v1/conversations', chatRoutes);
app.use('/v1/matches', matchesRoutes);
app.use('/v1/communities', communitiesRoutes);
app.use('/v1/notifications', notificationsRoutes);
app.use('/v1/payments', paymentsRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error]', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);

initSocket(httpServer);
startRizzExpiryJob();

httpServer.listen(PORT, () => {
  console.log(`\n🚀 Origo backend → http://localhost:${PORT}`);
  console.log(`📊 Health → http://localhost:${PORT}/health\n`);
});

export { app, httpServer };
