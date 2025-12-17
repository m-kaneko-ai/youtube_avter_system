import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from './api';

describe('ApiClient', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET requests', () => {
    it('should make GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(mockData),
      });

      const result = await api.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should include query parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({}),
      });

      await api.get('/test', { params: { page: 1, limit: 10 } });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1'),
        expect.anything()
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=10'),
        expect.anything()
      );
    });

    it('should handle empty response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => '',
      });

      const result = await api.get('/test');

      expect(result).toEqual({});
    });
  });

  describe('POST requests', () => {
    it('should make POST request with data', async () => {
      const mockData = { id: 1, name: 'Created' };
      const postData = { name: 'New Item' };

      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(mockData),
      });

      const result = await api.post('/test', postData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify(postData),
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should make POST request without data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({}),
      });

      await api.post('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          method: 'POST',
          body: undefined,
        })
      );
    });
  });

  describe('PUT requests', () => {
    it('should make PUT request with data', async () => {
      const mockData = { id: 1, name: 'Updated' };
      const putData = { name: 'Updated Item' };

      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(mockData),
      });

      const result = await api.put('/test/1', putData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'PUT',
          credentials: 'include',
          body: JSON.stringify(putData),
        })
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('PATCH requests', () => {
    it('should make PATCH request with data', async () => {
      const mockData = { id: 1, name: 'Patched' };
      const patchData = { name: 'Patched Item' };

      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(mockData),
      });

      const result = await api.patch('/test/1', patchData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'PATCH',
          credentials: 'include',
          body: JSON.stringify(patchData),
        })
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('DELETE requests', () => {
    it('should make DELETE request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({}),
      });

      await api.delete('/test/1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'DELETE',
          credentials: 'include',
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should throw error on 404', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ detail: 'Resource not found' }),
      });

      await expect(api.get('/test')).rejects.toMatchObject({
        status: 404,
        message: 'Resource not found',
      });
    });

    it('should throw error on 500', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Server error' }),
      });

      await expect(api.get('/test')).rejects.toMatchObject({
        status: 500,
        message: 'Server error',
      });
    });

    it('should handle JSON parse error in error response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(api.get('/test')).rejects.toMatchObject({
        status: 400,
        message: 'Bad Request',
      });
    });

    it('should handle 401 Unauthorized', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ detail: 'Authentication required' }),
      });

      await expect(api.get('/test')).rejects.toMatchObject({
        status: 401,
        message: 'Authentication required',
      });
    });
  });

  describe('checkAuth', () => {
    it('should return true when authenticated', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
      });

      const isAuth = await api.checkAuth();

      expect(isAuth).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/me'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      );
    });

    it('should return false when not authenticated', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
      });

      const isAuth = await api.checkAuth();

      expect(isAuth).toBe(false);
    });

    it('should return false on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const isAuth = await api.checkAuth();

      expect(isAuth).toBe(false);
    });
  });

  describe('Headers', () => {
    it('should include Content-Type header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({}),
      });

      await api.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should include credentials for cookie support', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({}),
      });

      await api.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          credentials: 'include',
        })
      );
    });
  });
});
