import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyAccessToken } from '../utils/jwt';
import { redis } from '../utils/redis';
import { prisma } from '../utils/prisma';

let io: SocketServer;

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: { origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*', methods: ['GET', 'POST'] },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth['token'] as string;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = verifyAccessToken(token);
      (socket as unknown as Record<string, unknown>)['userId'] = decoded.userId;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = (socket as unknown as Record<string, unknown>)['userId'] as string;
    socket.join(`user:${userId}`);

    await redis.set(`online:${userId}`, '1', 'EX', 3600);
    await prisma.user.update({ where: { id: userId }, data: { isOnline: true } }).catch(() => {});

    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('send_message', async (data: { conversationId: string; content: string }) => {
      io.to(`conversation:${data.conversationId}`).emit('new_message', {
        conversationId: data.conversationId,
        content: data.content,
        senderId: userId,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on('typing_start', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', { userId, conversationId });
    });

    socket.on('typing_stop', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', { userId, conversationId });
    });

    socket.on('mark_read', async (conversationId: string) => {
      await prisma.conversationParticipant.update({
        where: { conversationId_userId: { conversationId, userId } },
        data: { lastReadAt: new Date() },
      }).catch(() => {});
      socket.to(`conversation:${conversationId}`).emit('message_read', { userId, conversationId });
    });

    socket.on('disconnect', async () => {
      await redis.del(`online:${userId}`);
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: false, lastSeen: new Date() },
      }).catch(() => {});
    });
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
