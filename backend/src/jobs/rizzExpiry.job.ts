import cron from 'node-cron';
import { prisma } from '../utils/prisma';

export function startRizzExpiryJob(): void {
  cron.schedule('*/15 * * * *', async () => {
    try {
      await prisma.rizzSession.updateMany({
        where: { status: { in: ['ACTIVE', 'WAITING'] }, expiresAt: { lt: new Date() } },
        data: { status: 'EXPIRED' },
      });

      const sixHoursLater = new Date(Date.now() + 6 * 60 * 60 * 1000);
      const expiringSoon = await prisma.rizzSession.findMany({
        where: {
          status: 'WAITING',
          expiresAt: { gt: new Date(), lt: sixHoursLater },
        },
        include: { initiator: true },
      });

      for (const session of expiringSoon) {
        await prisma.notification.create({
          data: {
            userId: session.targetId,
            type: 'RIZZ_EXPIRING',
            title: '⚡ Rizz expires soon!',
            body: `${session.initiator.name}'s Rizz expires in under 6 hours. Reply now!`,
            data: { sessionId: session.id },
          },
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Rizz expiry job error:', err);
    }
  });
}
