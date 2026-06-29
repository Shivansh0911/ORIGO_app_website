export type RizzStatus = 'ACTIVE' | 'WAITING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';

export interface RizzMessage {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  initiatorMsgNumber?: number;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface RizzSession {
  id: string;
  initiatorId: string;
  targetId: string;
  initiatorMsgCount: number;
  targetReplied: boolean;
  status: RizzStatus;
  unlocked: boolean;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  initiator: {
    id: string;
    name: string;
    avatarUrl?: string;
    collegeName?: string;
    isOnline: boolean;
  };
  target: {
    id: string;
    name: string;
    avatarUrl?: string;
    collegeName?: string;
    isOnline: boolean;
  };
  messages: RizzMessage[];
}

export type RizzViewState =
  | { role: 'INITIATOR'; phase: 'COMPOSING'; msgSent: number }
  | { role: 'INITIATOR'; phase: 'LAST_MESSAGE'; msgSent: 4 }
  | { role: 'INITIATOR'; phase: 'WAITING'; msgSent: 5 }
  | { role: 'INITIATOR'; phase: 'UNLOCKED'; conversationId: string }
  | { role: 'INITIATOR'; phase: 'DECLINED' }
  | { role: 'INITIATOR'; phase: 'EXPIRED' }
  | { role: 'TARGET'; phase: 'READING'; msgCount: number }
  | { role: 'TARGET'; phase: 'REPLYING' }
  | { role: 'TARGET'; phase: 'UNLOCKED'; conversationId: string }
  | { role: 'TARGET'; phase: 'DECLINED' };

export function deriveViewState(session: RizzSession, myId: string): RizzViewState {
  const isInitiator = session.initiatorId === myId;

  if (isInitiator) {
    if (session.status === 'ACCEPTED' || session.unlocked) {
      return { role: 'INITIATOR', phase: 'UNLOCKED', conversationId: '' };
    }
    if (session.status === 'DECLINED') return { role: 'INITIATOR', phase: 'DECLINED' };
    if (session.status === 'EXPIRED') return { role: 'INITIATOR', phase: 'EXPIRED' };
    if (session.status === 'WAITING') return { role: 'INITIATOR', phase: 'WAITING', msgSent: 5 };
    if (session.initiatorMsgCount === 4) return { role: 'INITIATOR', phase: 'LAST_MESSAGE', msgSent: 4 };
    return { role: 'INITIATOR', phase: 'COMPOSING', msgSent: session.initiatorMsgCount };
  }

  if (session.status === 'ACCEPTED' || session.unlocked) {
    return { role: 'TARGET', phase: 'UNLOCKED', conversationId: '' };
  }
  if (session.status === 'DECLINED') return { role: 'TARGET', phase: 'DECLINED' };
  if (session.targetReplied) return { role: 'TARGET', phase: 'REPLYING' };
  return { role: 'TARGET', phase: 'READING', msgCount: session.initiatorMsgCount };
}
