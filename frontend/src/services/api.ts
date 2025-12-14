/**
 * API Client
 *
 * Base configuration for all API calls
 * セキュリティ強化: JWTトークンはHttpOnly Cookieで管理（XSS対策）
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

interface ApiError {
  message: string;
  detail?: string;
  status: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * 認証状態をチェック（Cookie経由でサーバーに確認）
   * @returns 認証済みかどうか
   */
  async checkAuth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = {
        message: 'API Error',
        status: response.status,
      };

      try {
        const data = await response.json();
        error.message = data.detail || data.message || data.error?.message || 'An error occurred';
        error.detail = data.detail;
      } catch {
        error.message = response.statusText;
      }

      // Handle 401 Unauthorized
      // デモログイン中はリダイレクトせず、エラーを投げてフォールバック処理を許可
      // 各ページはエラー時にモックデータを表示するよう実装済み

      throw error;
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text);
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include', // Cookieを送信
      ...options,
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(path: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include', // Cookieを送信
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(path: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      credentials: 'include', // Cookieを送信
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    return this.handleResponse<T>(response);
  }

  async patch<T>(path: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      credentials: 'include', // Cookieを送信
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include', // Cookieを送信
      ...options,
    });
    return this.handleResponse<T>(response);
  }
}

export const api = new ApiClient(API_BASE_URL);
export type { ApiError };
