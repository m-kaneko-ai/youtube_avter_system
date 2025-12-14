import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthState } from '../types';
import { authService } from '../services';

/**
 * 認証ストア
 *
 * セキュリティ強化: JWTトークンはHttpOnly Cookieで管理
 * - トークンはサーバーが管理、クライアントからアクセス不可
 * - 認証状態はサーバーへの問い合わせで確認
 */
interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // Legacy email/password login (for development)
      login: async (email: string, password: string): Promise<boolean> => {
        set({ isLoading: true });

        // Development mode: allow demo login
        if (import.meta.env.DEV) {
          const DEMO_USERS: Record<string, { password: string; user: User }> = {
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
          };

          await new Promise((resolve) => setTimeout(resolve, 300));
          const mockUser = DEMO_USERS[email];
          if (mockUser && mockUser.password === password) {
            set({
              user: mockUser.user,
              isAuthenticated: true,
              isLoading: false,
            });
            return true;
          }
        }

        set({ isLoading: false });
        return false;
      },

      // Google OAuth login
      loginWithGoogle: async (credential: string): Promise<boolean> => {
        set({ isLoading: true });

        try {
          const response = await authService.loginWithGoogle(credential);
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        } catch (error) {
          // エラーログは開発時のみ
          if (import.meta.env.DEV) {
            console.error('Google login failed:', error);
          }
          set({ isLoading: false });
          return false;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          // ログアウトエラーは開発時のみ
          if (import.meta.env.DEV) {
            console.error('Logout error:', error);
          }
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
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

      // Check if user is still authenticated
      // HttpOnly Cookieによりトークンはサーバーが管理
      checkAuth: async () => {
        // ローカルストレージにユーザー情報があれば、サーバーで検証
        const currentState = get();

        // 既に認証済みの状態がある場合、サーバーで確認
        if (currentState.user || currentState.isAuthenticated) {
          try {
            set({ isLoading: true });
            const user = await authService.getCurrentUser();
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch {
            // 認証失敗（Cookieが無効または期限切れ）
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } else {
          // ローカル状態がない場合でも、Cookieがあればサーバーで確認
          try {
            set({ isLoading: true });
            const user = await authService.getCurrentUser();
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch {
            // 認証なし
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        }
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
