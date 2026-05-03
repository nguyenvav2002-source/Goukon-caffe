import { create } from 'zustand';
import { storage } from '../services/storage';
import api from '../services/api';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: 'USER' | 'STAFF' | 'MC' | 'ADMIN';
  avatarUrl?: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  phone?: string;
  gender?: string;
  birthYear?: number;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  loadSession: async () => {
    try {
      const token = await storage.getItemAsync('accessToken');
      if (!token) {
        set({ user: null, isLoading: false });
        return;
      }
      const res = await api.get('/api/users/me');
      set({ user: res.data, isLoading: false });
    } catch {
      try { await storage.deleteItemAsync('accessToken'); } catch {}
      try { await storage.deleteItemAsync('refreshToken'); } catch {}
      set({ user: null, isLoading: false });
    }
  },

  login: async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    const { user, accessToken, refreshToken } = res.data;

    await storage.setItemAsync('accessToken', accessToken);
    await storage.setItemAsync('refreshToken', refreshToken);
    set({ user });
  },

  register: async (data) => {
    const res = await api.post('/api/auth/register', data);
    const { user, accessToken, refreshToken } = res.data;

    await storage.setItemAsync('accessToken', accessToken);
    await storage.setItemAsync('refreshToken', refreshToken);
    set({ user });
  },

  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      await storage.deleteItemAsync('accessToken');
      await storage.deleteItemAsync('refreshToken');
      set({ user: null });
    }
  },
}));
