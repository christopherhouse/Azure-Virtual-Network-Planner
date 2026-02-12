// Sync Storage - Hybrid storage that syncs between localStorage and API
// Provides offline-first functionality with background sync

import { AppState, Project } from '@/types';
import { loadAppState as loadLocalState, saveAppState as saveLocalState } from './storage';
import { getUserId } from './user-id';
import * as api from './api-client';

// Storage mode enum
export type StorageMode = 'local' | 'api' | 'hybrid';

// Sync status
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

interface SyncState {
  mode: StorageMode;
  status: SyncStatus;
  lastSync: Date | null;
  error: string | null;
}

// Global sync state
let syncState: SyncState = {
  mode: 'local',
  status: 'idle',
  lastSync: null,
  error: null,
};

// Listeners for sync state changes
type SyncListener = (state: SyncState) => void;
const listeners: Set<SyncListener> = new Set();

function notifyListeners(): void {
  listeners.forEach(listener => listener({ ...syncState }));
}

/**
 * Subscribe to sync state changes
 */
export function subscribeSyncState(listener: SyncListener): () => void {
  listeners.add(listener);
  // Immediately call with current state
  listener({ ...syncState });
  return () => listeners.delete(listener);
}

/**
 * Get current sync state
 */
export function getSyncState(): SyncState {
  return { ...syncState };
}

/**
 * Initialize storage and detect best mode
 */
export async function initializeStorage(): Promise<StorageMode> {
  const userId = getUserId();

  if (!userId) {
    syncState = { mode: 'local', status: 'idle', lastSync: null, error: null };
    notifyListeners();
    return 'local';
  }

  try {
    const apiAvailable = await api.checkApiHealth();

    if (apiAvailable) {
      syncState = { mode: 'api', status: 'synced', lastSync: new Date(), error: null };
      notifyListeners();
      return 'api';
    } else {
      // API not available, use local with offline indicator
      syncState = { mode: 'local', status: 'offline', lastSync: null, error: null };
      notifyListeners();
      return 'local';
    }
  } catch {
    syncState = { mode: 'local', status: 'offline', lastSync: null, error: 'API unavailable' };
    notifyListeners();
    return 'local';
  }
}

/**
 * Load app state - from API if available, fallback to localStorage
 */
export async function loadAppState(): Promise<AppState> {
  const mode = await initializeStorage();

  if (mode === 'local') {
    return loadLocalState();
  }

  try {
    syncState = { ...syncState, status: 'syncing' };
    notifyListeners();

    const response = await api.listProjects();

    // Fetch full project details for each project
    const projects: Project[] = await Promise.all(
      response.projects.map(item => api.getProject(item.id))
    );

    const state: AppState = {
      projects,
      activeProjectId: projects.length > 0 ? projects[0].id : null,
      version: '1.0.0',
    };

    // Also save to localStorage for offline access
    saveLocalState(state);

    syncState = { ...syncState, status: 'synced', lastSync: new Date(), error: null };
    notifyListeners();

    return state;
  } catch (error) {
    console.error('Failed to load from API, falling back to localStorage:', error);
    syncState = {
      ...syncState,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    notifyListeners();
    return loadLocalState();
  }
}

/**
 * Save app state - to API if available, always to localStorage
 */
export async function saveAppState(state: AppState): Promise<void> {
  // Always save to localStorage for offline access
  saveLocalState(state);

  if (syncState.mode === 'local') {
    return;
  }

  try {
    syncState = { ...syncState, status: 'syncing' };
    notifyListeners();

    // Sync each project to the API
    // PUT now supports upsert semantics - creates if not exists
    for (const project of state.projects) {
      await api.updateProject(project.id, {
        name: project.name,
        description: project.description,
        vnets: project.vnets,
      });
    }

    syncState = { ...syncState, status: 'synced', lastSync: new Date(), error: null };
    notifyListeners();
  } catch (error) {
    console.error('Failed to sync to API:', error);
    syncState = {
      ...syncState,
      status: 'error',
      error: error instanceof Error ? error.message : 'Sync failed',
    };
    notifyListeners();
    // Data is still in localStorage, so user won't lose work
  }
}

/**
 * Create a project - API first if available
 */
export async function createProjectSync(name: string, description: string = ''): Promise<Project> {
  if (syncState.mode === 'local') {
    // Use the local storage createProject function
    const { createProject } = await import('./storage');
    return createProject(name, description);
  }

  try {
    const project = await api.createProject(name, description);
    return project;
  } catch (error) {
    console.error('Failed to create project via API:', error);
    // Fallback to local creation
    const { createProject } = await import('./storage');
    return createProject(name, description);
  }
}

/**
 * Delete a project - API first if available
 */
export async function deleteProjectSync(projectId: string): Promise<void> {
  if (syncState.mode !== 'local') {
    try {
      await api.deleteProject(projectId);
    } catch (error) {
      console.error('Failed to delete project via API:', error);
      // Continue to remove from local state
    }
  }
}

/**
 * Force sync with the API
 */
export async function forceSync(): Promise<boolean> {
  if (syncState.mode === 'local') {
    // Try to initialize API connection
    const mode = await initializeStorage();
    if (mode === 'local') {
      return false;
    }
  }

  try {
    const localState = loadLocalState();
    await saveAppState(localState);
    return true;
  } catch {
    return false;
  }
}
