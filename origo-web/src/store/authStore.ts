import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  onboardingEmail: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setOnboardingEmail: (email: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      onboardingEmail: null,

      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, accessToken, refreshToken });
      },

      setUser: (user) => set({ user }),

      setOnboardingEmail: (email) => set({ onboardingEmail: email }),

      clearAuth: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null });
      },

      isAuthenticated: () => {
        const { accessToken, user } = get();
        return !!(accessToken && user);
      },
    }),
    { name: 'origo-auth', partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken }) },
  ),
);
