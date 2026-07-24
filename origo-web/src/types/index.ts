export interface User {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  collegeName: string | null;
  gender: string | null;
  lookingFor: string[];
  isVerified: boolean;
  isPremium: boolean;
  interests: UserInterest[];
  lastSeen: string | null;
  needsDob?: boolean;
}

export interface PublicUser {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  collegeName: string | null;
  gender: string | null;
  lookingFor: string[];
  isVerified: boolean;
  isPremium: boolean;
  interests: UserInterest[];
  lastSeen: string | null;
  compatibilityScore?: number;
}

export interface UserInterest {
  interestId: string;
  interest: Interest;
}

export interface Interest {
  id: string;
  name: string;
  emoji: string;
  category: string;
}

export interface RizzSession {
  id: string;
  initiatorId: string;
  receiverId: string;
  status: 'ACTIVE' | 'WAITING' | 'UNLOCKED' | 'DECLINED' | 'EXPIRED';
  messageCount: number;
  initiator: PublicUser;
  receiver: PublicUser;
  messages: RizzMessage[];
  createdAt: string;
  expiresAt: string | null;
}

export interface RizzMessage {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: PublicUser[];
  lastMessage: Message | null;
  unreadCount: number;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'TEXT' | 'STICKER' | 'IMAGE';
  readAt: string | null;
  createdAt: string;
}

export interface Community {
  id: string;
  name: string;
  description: string | null;
  bannerUrl: string | null;
  collegeName: string | null;
  category: string;
  memberCount: number;
  isJoined?: boolean;
  createdAt: string;
}

export interface Post {
  id: string;
  communityId: string;
  authorId: string;
  author: PublicUser;
  content: string;
  mediaUrls: string[];
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: PublicUser;
  content: string;
  createdAt: string;
}

export interface CommunityEvent {
  id: string;
  communityId: string;
  title: string;
  description: string | null;
  bannerUrl: string | null;
  location: string | null;
  startAt: string;
  endAt: string | null;
  rsvpCount: number;
  isRsvped?: boolean;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  meta: Record<string, string> | null;
}

export interface Ship {
  id: string;
  initiatorId: string;
  targetOneId: string;
  targetTwo: PublicUser;
  message: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export type PulseCategory = 'CHILL' | 'MOVE' | 'PLAY' | 'TALK' | 'GROW' | 'DATE_PRACTICE';
export type PulseStatus = 'ACTIVE' | 'EXPIRED' | 'FULFILLED' | 'CANCELLED';

export interface PulseResponderEntry {
  id: string;
  responderId: string;
  rizzSessionId: string | null;
  responder: Pick<PublicUser, 'id' | 'name' | 'avatarUrl'>;
}

export interface Pulse {
  id: string;
  authorId: string;
  author: Pick<PublicUser, 'id' | 'name' | 'username' | 'avatarUrl' | 'isVerified'>;
  category: PulseCategory;
  text: string;
  vibe: string | null;
  status: PulseStatus;
  collegeName: string | null;
  expiresAt: string;
  createdAt: string;
  hasResponded?: boolean;
  // Feed returns minimal { id }, getMyPulse returns full responder profiles
  responses?: ({ id: string } | PulseResponderEntry)[];
}

export interface PulseResponse {
  id: string;
  pulseId: string;
  responderId: string;
  rizzSessionId: string | null;
  createdAt: string;
}

export type OnboardingStep =
  | 'register'
  | 'login'
  | 'verify-otp'
  | 'verify-college'
  | 'interests'
  | 'looking-for'
  | 'profile-setup'
  | 'done';
