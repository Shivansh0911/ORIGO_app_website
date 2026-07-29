import { prisma } from '../utils/prisma';
import { getIO } from '../socket';
import { moderateText } from '../utils/moderateText';

export const ChatService = {
  async getConversations(userId: string) {
    const participants = await prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true, name: true, username: true, avatarUrl: true,
                    bio: true, collegeName: true, gender: true, lookingFor: true,
                    isVerified: true, isPremium: true, lastSeen: true,
                    interests: { include: { interest: true } },
                  },
                },
              },
            },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    return participants.map((p) => {
      const lastMessage = p.conversation.messages[0] ?? null;
      const isUnread = !!(lastMessage && lastMessage.senderId !== userId &&
        (!p.lastReadAt || lastMessage.createdAt > p.lastReadAt));
      return {
        id: p.conversation.id,
        participants: p.conversation.participants.map((cp) => cp.user),
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              conversationId: p.conversation.id,
              senderId: lastMessage.senderId,
              content: lastMessage.content ?? '',
              type: lastMessage.messageType as 'TEXT' | 'STICKER' | 'IMAGE',
              readAt: null,
              createdAt: lastMessage.createdAt.toISOString(),
            }
          : null,
        unreadCount: isUnread ? 1 : 0,
        updatedAt: p.conversation.updatedAt.toISOString(),
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
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    return messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      content: m.content ?? '',
      type: m.messageType as 'TEXT' | 'STICKER' | 'IMAGE',
      readAt: null,
      createdAt: m.createdAt.toISOString(),
      sender: m.sender,
    }));
  },

  async sendMessage(conversationId: string, senderId: string, content: string, mediaUrl?: string, messageType: 'TEXT' | 'IMAGE' | 'STICKER' = 'TEXT') {
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: senderId } },
    });
    if (!participant) throw new Error('FORBIDDEN');
    if (messageType === 'TEXT') moderateText(content);

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
