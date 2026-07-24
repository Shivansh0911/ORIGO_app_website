import { api } from './client';
import type {
  User, PublicUser, Interest, RizzSession, RizzMessage,
  Conversation, Message, Community, Post, Comment,
  CommunityEvent, Notification, Ship, LoginResponse,
} from '../types';

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (body: { name: string; username: string; email: string; dateOfBirth: string; password: string; phone?: string }) =>
    api.post<LoginResponse>('/auth/register', body),

  login: (body: { email: string; password: string }) =>
    api.post<LoginResponse>('/auth/login', body),

  sendCollegeOtp: (body: { collegeEmail: string }) =>
    api.post<{ message: string }>('/auth/verify-college-email', body),

  verifyCollegeOtp: (body: { collegeEmail: string; otp: string }) =>
    api.post<{ message: string }>('/auth/confirm-college-otp', { otp: body.otp }),

  logout: () => api.post('/auth/logout'),

  googleAuth: (idToken: string) =>
    api.post<LoginResponse>('/auth/google', { idToken }),

  deleteAccount: () => api.delete('/auth/account'),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  getMe: () => api.get<User>('/users/me'),

  updateMe: (body: Partial<Pick<User, 'name' | 'bio' | 'gender' | 'lookingFor'>>) =>
    api.patch<User>('/users/me', body),

  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append('avatar', file);
    return api.post<{ avatarUrl: string }>('/users/me/avatar', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  setInterests: (interestIds: string[]) =>
    api.put('/users/me/interests', { interestIds }),

  getInterests: () => api.get<Interest[]>('/users/interests'),

  getProfile: (userId: string) => api.get<PublicUser>(`/users/${userId}`),

  blockUser: (userId: string) => api.post(`/users/block/${userId}`),

  reportUser: (userId: string, reason: string) =>
    api.post(`/users/report/${userId}`, { reason }),

  updatePushToken: (token: string) => api.post('/users/push-token', { token }),
};

// ── Discover ──────────────────────────────────────────────────────────────────
export const discoverApi = {
  getPeople: (params?: { gender?: string; lookingFor?: string; page?: number }) =>
    api.get<PublicUser[]>('/discover/people', { params }),
};

// ── Matches ───────────────────────────────────────────────────────────────────
export const matchesApi = {
  sendMatch: (receiverId: string) =>
    api.post<{ id: string; status: string }>('/matches', { receiverId }),

  respondMatch: (matchId: string, accept: boolean) =>
    api.post(`/matches/${matchId}/respond`, { accept }),

  getMatches: () => api.get('/matches'),

  unmatch: (matchId: string) => api.delete(`/matches/${matchId}`),
};

// ── Rizz ──────────────────────────────────────────────────────────────────────
export const rizzApi = {
  getSessions: () => api.get<RizzSession[]>('/rizz/sessions'),

  getSession: (id: string) => api.get<RizzSession>(`/rizz/sessions/${id}`),

  startSession: (targetId: string) =>
    api.post<RizzSession>('/rizz/sessions', { targetId }),

  sendMessage: (sessionId: string, content: string) =>
    api.post<RizzMessage>(`/rizz/sessions/${sessionId}/messages`, { content }),

  getIcebreaker: (sessionId: string) =>
    api.get<{ tip: string }>(`/rizz/sessions/${sessionId}/icebreaker`),

  decline: (sessionId: string) =>
    api.patch(`/rizz/sessions/${sessionId}/decline`),
};

// ── Conversations / Chat ──────────────────────────────────────────────────────
export const conversationsApi = {
  getAll: () => api.get<Conversation[]>('/conversations'),

  getMessages: (convId: string, cursor?: string) =>
    api.get<Message[]>(`/conversations/${convId}/messages`, { params: { cursor } }),

  sendMessage: (convId: string, content: string, type = 'TEXT') =>
    api.post<Message>(`/conversations/${convId}/messages`, { content, type }),

  markRead: (convId: string) => api.patch(`/conversations/${convId}/read`),
};

// ── Communities ───────────────────────────────────────────────────────────────
export const communitiesApi = {
  getAll: (params?: { page?: number }) =>
    api.get<Community[]>('/communities', { params }),

  getOne: (id: string) => api.get<Community>(`/communities/${id}`),

  join: (id: string) => api.post(`/communities/${id}/join`),

  leave: (id: string) => api.delete(`/communities/${id}/leave`),

  getPosts: (id: string, params?: { page?: number }) =>
    api.get<Post[]>(`/communities/${id}/posts`, { params }),

  createPost: (id: string, body: { content: string; mediaUrls?: string[] }) =>
    api.post<Post>(`/communities/${id}/posts`, body),

  likePost: (postId: string) => api.post(`/posts/${postId}/like`),

  unlikePost: (postId: string) => api.delete(`/posts/${postId}/like`),

  getComments: (postId: string) => api.get<Comment[]>(`/posts/${postId}/comments`),

  addComment: (postId: string, content: string) =>
    api.post<Comment>(`/posts/${postId}/comments`, { content }),

  getEvents: (id: string) => api.get<CommunityEvent[]>(`/communities/${id}/events`),

  rsvpEvent: (eventId: string) => api.post(`/events/${eventId}/rsvp`),

  unrsvpEvent: (eventId: string) => api.delete(`/events/${eventId}/rsvp`),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: () => api.get<Notification[]>('/notifications'),
  getUnreadCount: () => api.get<{ count: number }>('/notifications/count'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentsApi = {
  createSubscriptionOrder: (plan: string) =>
    api.post<{ orderId: string; amount: number; currency: string; keyId: string }>(
      '/payments/subscription/order',
      { plan },
    ),

  createShipOrder: () =>
    api.post<{ orderId: string; amount: number; currency: string; keyId: string }>(
      '/payments/ship/order',
    ),

  verifySubscription: (body: { plan: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    api.post('/payments/subscription/verify', body),

  verifyIap: (body: { orderId: string; paymentId: string; signature: string }) =>
    api.post('/payments/iap/verify', body),
};

// ── Ships ─────────────────────────────────────────────────────────────────────
export const shipsApi = {
  create: (body: { targetOneId: string; targetTwoId: string; message?: string }) =>
    api.post<Ship>('/ships', body),

  getMyShips: () => api.get<{ initiated: Ship[]; received: Ship[] }>('/ships'),

  getEligibleTargets: () => api.get<PublicUser[]>('/ships/eligible-targets'),
};
