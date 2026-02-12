// API Client for VNet Planner Backend
// Uses the 2025-02-11 API version

import { Project } from '@/types';
import { getUserId } from './user-id';

const API_VERSION = '2025-02-11';

// API base URL - hardcoded to the API Front Door endpoint
// TODO: Move to environment variable or Bicep-managed configuration
const API_BASE_URL = 'https://api.azvnetplanner.chrishou.se';

const getApiBaseUrl = (): string => {
  return API_BASE_URL;
};

/**
 * API error class with status code and details
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Make an API request with user authentication
 */
async function apiRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const userId = getUserId();
  if (!userId) {
    throw new ApiError('User ID not available', 401);
  }

  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/${API_VERSION}${path}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-User-ID': userId,
  };

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (!response.ok) {
    let detail: string | undefined;
    try {
      const errorData = await response.json();
      detail = errorData.detail || errorData.error;
    } catch {
      // Ignore JSON parse errors
    }

    throw new ApiError(
      `API request failed: ${response.status} ${response.statusText}`,
      response.status,
      detail
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Project List Response Types
// ---------------------------------------------------------------------------

interface ProjectListItem {
  id: string;
  name: string;
  description: string;
  vnetCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ProjectListResponse {
  projects: ProjectListItem[];
  totalCount: number;
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

/**
 * List all projects for the current user
 */
export async function listProjects(): Promise<ProjectListResponse> {
  return apiRequest<ProjectListResponse>('GET', '/projects');
}

/**
 * Get a specific project by ID
 */
export async function getProject(projectId: string): Promise<Project> {
  return apiRequest<Project>('GET', `/projects/${projectId}`);
}

/**
 * Create a new project
 */
export async function createProject(name: string, description: string = ''): Promise<Project> {
  return apiRequest<Project>('POST', '/projects', { name, description });
}

/**
 * Update a project (partial update supported)
 */
export async function updateProject(
  projectId: string,
  updates: Partial<Pick<Project, 'name' | 'description' | 'vnets'>>
): Promise<Project> {
  return apiRequest<Project>('PUT', `/projects/${projectId}`, updates);
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string): Promise<void> {
  return apiRequest<void>('DELETE', `/projects/${projectId}`);
}

/**
 * Check if the API is available
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/healthz`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Determine if we should use the API or fallback to local storage
 * Returns true if API is configured and available
 */
export async function shouldUseApi(): Promise<boolean> {
  // Check if we have a user ID
  const userId = getUserId();
  if (!userId) {
    return false;
  }

  // Check if API is available
  return checkApiHealth();
}
