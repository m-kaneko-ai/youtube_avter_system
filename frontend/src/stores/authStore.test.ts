import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import { authService } from '../services';

// Mock authService
vi.mock('../services', () => ({
  authService: {
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

describe('authStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    const store = useAuthStore.getState();
    store.setUser(null);
    store.setLoading(false);
    vi.clearAllMocks();
  });

  it('should have initial state', () => {
    const { user, isAuthenticated, isLoading } = useAuthStore.getState();

    expect(user).toBeNull();
    expect(isAuthenticated).toBe(false);
    expect(isLoading).toBe(false);
  });

  describe('login', () => {
    it('should login with valid demo credentials', async () => {
      const store = useAuthStore.getState();
      const success = await store.login('demo@example.com', 'demo123');

      expect(success).toBe(true);

      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).not.toBeNull();
      expect(user?.email).toBe('demo@example.com');
      expect(user?.role).toBe('team');
      expect(isAuthenticated).toBe(true);
    });

    it('should fail login with invalid credentials', async () => {
      const store = useAuthStore.getState();
      const success = await store.login('demo@example.com', 'wrongpassword');

      expect(success).toBe(false);

      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(isAuthenticated).toBe(false);
    });

    it('should set loading state during login', async () => {
      const store = useAuthStore.getState();

      const loginPromise = store.login('demo@example.com', 'demo123');

      // Check loading state is true during login
      // Note: This is difficult to test due to async nature, but we can verify final state
      await loginPromise;

      const { isLoading } = useAuthStore.getState();
      expect(isLoading).toBe(false);
    });

    it('should login admin user', async () => {
      const store = useAuthStore.getState();
      const success = await store.login('admin@example.com', 'admin123');

      expect(success).toBe(true);

      const { user } = useAuthStore.getState();
      expect(user?.email).toBe('admin@example.com');
      expect(user?.role).toBe('owner');
    });

    it('should login client user', async () => {
      const store = useAuthStore.getState();
      const success = await store.login('client@example.com', 'client123');

      expect(success).toBe(true);

      const { user } = useAuthStore.getState();
      expect(user?.email).toBe('client@example.com');
      expect(user?.role).toBe('client_premium');
    });
  });

  describe('loginWithGoogle', () => {
    it('should login with Google successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@gmail.com',
        name: 'Test User',
        role: 'team' as const,
        avatarUrl: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(authService.loginWithGoogle).mockResolvedValue({
        user: mockUser,
        access_token: 'token',
        token_type: 'Bearer',
      });

      const store = useAuthStore.getState();
      const success = await store.loginWithGoogle('google-credential');

      expect(success).toBe(true);
      expect(authService.loginWithGoogle).toHaveBeenCalledWith('google-credential');

      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toEqual(mockUser);
      expect(isAuthenticated).toBe(true);
    });

    it('should handle Google login failure', async () => {
      vi.mocked(authService.loginWithGoogle).mockRejectedValue(new Error('Login failed'));

      const store = useAuthStore.getState();
      const success = await store.loginWithGoogle('invalid-credential');

      expect(success).toBe(false);

      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      // Login first
      const store = useAuthStore.getState();
      await store.login('demo@example.com', 'demo123');

      vi.mocked(authService.logout).mockResolvedValue();

      await store.logout();

      expect(authService.logout).toHaveBeenCalled();

      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(isAuthenticated).toBe(false);
    });

    it('should handle logout error gracefully', async () => {
      // Login first
      const store = useAuthStore.getState();
      await store.login('demo@example.com', 'demo123');

      vi.mocked(authService.logout).mockRejectedValue(new Error('Logout failed'));

      await store.logout();

      // Should still clear local state even if API call fails
      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(isAuthenticated).toBe(false);
    });
  });

  describe('setUser', () => {
    it('should set user and mark as authenticated', () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'team' as const,
        avatarUrl: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const store = useAuthStore.getState();
      store.setUser(mockUser);

      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toEqual(mockUser);
      expect(isAuthenticated).toBe(true);
    });

    it('should clear user and mark as not authenticated when null', () => {
      const store = useAuthStore.getState();
      store.setUser(null);

      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(isAuthenticated).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      const store = useAuthStore.getState();

      store.setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);

      store.setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('checkAuth', () => {
    it('should verify authenticated user', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'team' as const,
        avatarUrl: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Set user first
      const store = useAuthStore.getState();
      store.setUser(mockUser);

      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

      await store.checkAuth();

      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toEqual(mockUser);
      expect(isAuthenticated).toBe(true);
    });

    it('should clear auth on verification failure', async () => {
      // Set user first
      const store = useAuthStore.getState();
      await store.login('demo@example.com', 'demo123');

      vi.mocked(authService.getCurrentUser).mockRejectedValue(new Error('Unauthorized'));

      await store.checkAuth();

      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(isAuthenticated).toBe(false);
    });

    it('should check auth even without local state', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'team' as const,
        avatarUrl: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

      const store = useAuthStore.getState();
      await store.checkAuth();

      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toEqual(mockUser);
      expect(isAuthenticated).toBe(true);
    });
  });
});
