import { create } from 'zustand';

interface NotificationState {
  unreadCount: number;
  setUnreadCount: (n: number) => void;
  decrement: () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (n) => set({ unreadCount: n }),
  decrement: () => set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
  reset: () => set({ unreadCount: 0 }),
}));
