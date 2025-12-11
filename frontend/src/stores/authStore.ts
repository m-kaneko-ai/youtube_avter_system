import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthState } from '../types';

// モックユーザーデータ
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'demo@example.com': {
    password: 'demo123',
    user: {
      id: '1',
      email: 'demo@example.com',
      name: 'Demo User',
      role: 'team',
      avatarUrl: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  'admin@example.com': {
    password: 'admin123',
    user: {
      id: '2',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'owner',
      avatarUrl: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  'client@example.com': {
    password: 'client123',
    user: {
      id: '3',
      email: 'client@example.com',
      name: 'Client User',
      role: 'client_premium',
      avatarUrl: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
};

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string): Promise<boolean> => {
        set({ isLoading: true });

        // モック認証（実際のAPIに置き換え予定）
        await new Promise((resolve) => setTimeout(resolve, 500));

        const mockUser = MOCK_USERS[email];
        if (mockUser && mockUser.password === password) {
          set({
            user: mockUser.user,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        }

        set({ isLoading: false });
        return false;
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: !!user,
        });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
