/**
 * Authentication Service
 *
 * セキュリティ強化: JWTトークンはHttpOnly Cookieで管理
 * - トークンはサーバーがSet-Cookieで設定
 * - JavaScriptからトークンにアクセス不可（XSS対策）
 */
import { api } from './api';
import type { User } from '../types';

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

interface GoogleAuthRequest {
  id_token: string;
}

export const authService = {
  /**
   * Google OAuth login
   * トークンはサーバーがHttpOnly Cookieで設定
   */
  async loginWithGoogle(credential: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/v1/auth/google', {
      id_token: credential,
    } as GoogleAuthRequest);

    // トークンはHttpOnly Cookieで自動設定されるため、手動保存不要
    return response;
  },

  /**
   * Refresh access token
   * リフレッシュトークンはCookieから自動送信
   */
  async refreshToken(): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/v1/auth/refresh');
    // 新しいトークンはHttpOnly Cookieで自動設定
    return response;
  },

  /**
   * Logout
   * サーバーがCookieを削除
   */
  async logout(): Promise<void> {
    await api.post('/api/v1/auth/logout');
    // Cookieはサーバーが削除するため、クライアント側の処理は不要
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User> {
    return api.get<User>('/api/v1/auth/me');
  },

  /**
   * Check if authenticated
   * サーバーに問い合わせて認証状態を確認
   */
  async isAuthenticated(): Promise<boolean> {
    return api.checkAuth();
  },
};
