import { create } from 'zustand';
import { User } from '../types/user.types';
import { apiClient } from '../api/client';
import { Storage } from '../utils/storage';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  clearAuth: () => void;
  refreshUser: () => Promise<void>;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),
  clearAuth: () => {
    Storage.clearAll();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
  setLoading: (v) => set({ isLoading: v }),
  refreshUser: async () => {
    try {
      const res = await apiClient.get<User>('/users/me');
      set({ user: res.data, isAuthenticated: true });
    } catch {
      Storage.clearAll();
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));
