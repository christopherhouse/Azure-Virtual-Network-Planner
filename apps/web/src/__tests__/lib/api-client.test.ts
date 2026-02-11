import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  checkApiHealth,
  shouldUseApi,
  ApiError,
} from '@/lib/api-client';

// Mock the user-id module
vi.mock('@/lib/user-id', () => ({
  getUserId: vi.fn(() => '12345678-1234-4567-89ab-123456789abc'),
}));

// Mock fetch
const mockFetch = vi.fn() as Mock;
global.fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('listProjects', () => {
    it('should fetch projects with correct headers', async () => {
      const mockResponse = {
        projects: [
          {
            id: 'proj-1',
            name: 'Test Project',
            description: 'A test',
            vnetCount: 2,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          },
        ],
        totalCount: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await listProjects();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/2025-02-11/projects',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-User-ID': '12345678-1234-4567-89ab-123456789abc',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw ApiError on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ detail: 'Server error' }),
      });

      await expect(listProjects()).rejects.toThrow(ApiError);
    });
  });

  describe('getProject', () => {
    it('should fetch a specific project', async () => {
      const mockProject = {
        id: 'proj-1',
        name: 'Test Project',
        description: 'A test project',
        vnets: [],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockProject),
      });

      const result = await getProject('proj-1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/2025-02-11/projects/proj-1',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockProject);
    });

    it('should throw ApiError on 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ detail: 'Project not found' }),
      });

      await expect(getProject('nonexistent')).rejects.toThrow(ApiError);
    });
  });

  describe('createProject', () => {
    it('should create a project with name and description', async () => {
      const mockProject = {
        id: 'new-proj',
        name: 'New Project',
        description: 'A new project',
        vnets: [],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockProject),
      });

      const result = await createProject('New Project', 'A new project');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/2025-02-11/projects',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'New Project', description: 'A new project' }),
        })
      );
      expect(result).toEqual(mockProject);
    });

    it('should create a project with default empty description', async () => {
      const mockProject = {
        id: 'new-proj',
        name: 'New Project',
        description: '',
        vnets: [],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockProject),
      });

      await createProject('New Project');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ name: 'New Project', description: '' }),
        })
      );
    });
  });

  describe('updateProject', () => {
    it('should send partial update', async () => {
      const mockProject = {
        id: 'proj-1',
        name: 'Updated Name',
        description: 'A test project',
        vnets: [],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockProject),
      });

      const result = await updateProject('proj-1', { name: 'Updated Name' });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/2025-02-11/projects/proj-1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'Updated Name' }),
        })
      );
      expect(result).toEqual(mockProject);
    });
  });

  describe('deleteProject', () => {
    it('should delete a project and handle 204 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: () => Promise.reject(new Error('No content')),
      });

      await expect(deleteProject('proj-1')).resolves.toBeUndefined();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/2025-02-11/projects/proj-1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('checkApiHealth', () => {
    it('should return true when API is healthy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const result = await checkApiHealth();
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        '/healthz',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should return false when API is unavailable', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const result = await checkApiHealth();
      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await checkApiHealth();
      expect(result).toBe(false);
    });
  });

  describe('shouldUseApi', () => {
    it('should return true when API is available', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      const result = await shouldUseApi();
      expect(result).toBe(true);
    });

    it('should return false when API is unavailable', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });

      const result = await shouldUseApi();
      expect(result).toBe(false);
    });
  });

  describe('ApiError', () => {
    it('should have correct properties', () => {
      const error = new ApiError('Test error', 400, 'Bad request');

      expect(error.message).toBe('Test error');
      expect(error.status).toBe(400);
      expect(error.detail).toBe('Bad request');
      expect(error.name).toBe('ApiError');
    });
  });
});
