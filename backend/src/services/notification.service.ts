import { NotifType } from '@prisma/client';
import { prisma } from '../utils/prisma';

interface PushPayload {
  userId: string;
  type: NotifType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export const NotificationService = {
  async create(payload: PushPayload) {
    return prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: payload.data as Record<string, string> | undefined,
      },
    });
  },

  async sendPush(payload: PushPayload) {
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { pushToken: true } });
    if (!user?.pushToken) return;

    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          to: user.pushToken,
          title: payload.title,
          body: payload.body,
          data: payload.data ?? {},
          sound: 'default',
          priority: 'high',
        }),
      });
    } catch (err) {
      console.error('Push notification failed:', err);
    }
  },

  async getForUser(userId: string, cursor?: string) {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(cursor ? { createdAt: { lt: await getCursorDate(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 21,
    });
    const hasMore = notifications.length > 20;
    return { notifications: notifications.slice(0, 20), nextCursor: hasMore ? notifications[19]?.id : null };
  },

  async markRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  },

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },

  async getUnreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  },
};

async function getCursorDate(id: string): Promise<Date> {
  const n = await prisma.notification.findUnique({ where: { id }, select: { createdAt: true } });
  return n?.createdAt ?? new Date();
}
