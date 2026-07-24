import cron from 'node-cron';
import { prisma } from '../utils/prisma';

export function startPulseExpiryJob(): void {
  cron.schedule('*/15 * * * *', async () => {
    try {
      await prisma.pulse.updateMany({
        where: { status: 'ACTIVE', expiresAt: { lt: new Date() } },
        data: { status: 'EXPIRED' },
      });

      const thirtyMinLater = new Date(Date.now() + 30 * 60 * 1000);
      const expiringSoon = await prisma.pulse.findMany({
        where: {
          status: 'ACTIVE',
          expiresAt: { gt: new Date(), lt: thirtyMinLater },
        },
        select: { id: true, authorId: true, text: true },
      });

      for (const pulse of expiringSoon) {
        await prisma.notification.create({
          data: {
            userId: pulse.authorId,
            type: 'PULSE_EXPIRING',
            title: 'Your Pulse expires soon!',
            body: `"${pulse.text}" expires in 30 minutes.`,
            data: { pulseId: pulse.id },
          },
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Pulse expiry job error:', err);
    }
  });
}
