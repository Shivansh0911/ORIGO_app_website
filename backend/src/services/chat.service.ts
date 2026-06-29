import { prisma } from '../utils/prisma';
import { getIO } from '../socket';

export const ChatService = {
  async getConversations(userId: string) {
    const participants = await prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: { user: { select: { id: true, name: true, avatarUrl: true, isOnline: true, lastSeen: true } } },
            },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    return participants.map((p) => {
      const other = p.conversation.participants.find((cp) => cp.userId !== userId);
      const lastMessage = p.conversation.messages[0];
      return {
        id: p.conversation.id,
        otherUser: other?.user,
        lastMessage: lastMessage ? { content: lastMessage.content, type: lastMessage.messageType, createdAt: lastMessage.createdAt } : null,
        lastReadAt: p.lastReadAt,
        updatedAt: p.conversation.updatedAt,
        unread: lastMessage && p.lastReadAt ? lastMessage.createdAt > p.lastReadAt && lastMessage.senderId !== userId : false,
      };
    });
  },

  async getMessages(conversationId: string, userId: string, cursor?: string) {
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) throw new Error('FORBIDDEN');

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        isDeleted: false,
        ...(cursor ? { createdAt: { lt: await getCursorDate(cursor) } } : {}),
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 21,
    });

    const hasMore = messages.length > 20;
    const result = messages.slice(0, 20);
    return {
      messages: result.reverse(),
      nextCursor: hasMore ? result[0]?.id : null,
    };
  },

  async sendMessage(conversationId: string, senderId: string, content: string, mediaUrl?: string, messageType: 'TEXT' | 'IMAGE' | 'STICKER' = 'TEXT') {
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: senderId } },
    });
    if (!participant) throw new Error('FORBIDDEN');

    const message = await prisma.message.create({
      data: { conversationId, senderId, content, mediaUrl, messageType },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    try {
      getIO().to(`conversation:${conversationId}`).emit('new_message', message);
    } catch {}

    return message;
  },

  async markRead(conversationId: string, userId: string) {
    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
    try {
      getIO().to(`conversation:${conversationId}`).emit('message_read', { userId, conversationId });
    } catch {}
  },

  async deleteMessage(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.senderId !== userId) throw new Error('FORBIDDEN');
    await prisma.message.update({ where: { id: messageId }, data: { isDeleted: true, content: null } });
  },
};

async function getCursorDate(messageId: string): Promise<Date> {
  const msg = await prisma.message.findUnique({ where: { id: messageId }, select: { createdAt: true } });
  return msg?.createdAt ?? new Date();
}
