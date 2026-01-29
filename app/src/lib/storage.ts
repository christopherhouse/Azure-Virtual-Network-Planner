// Local Storage Persistence Layer

import { AppState, Project, VNet, Subnet } from '@/types';

const STORAGE_KEY = 'azure-vnet-planner';
const CURRENT_VERSION = '1.0.0';

/**
 * Get default app state
 */
function getDefaultState(): AppState {
  return {
    projects: [],
    activeProjectId: null,
    version: CURRENT_VERSION,
  };
}

/**
 * Load app state from local storage
 */
export function loadAppState(): AppState {
  if (typeof window === 'undefined') {
    return getDefaultState();
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultState();
    }
    
    const state = JSON.parse(stored) as AppState;
    
    // Handle version migrations here if needed
    if (state.version !== CURRENT_VERSION) {
      // Future: Add migration logic
      state.version = CURRENT_VERSION;
    }
    
    return state;
  } catch (error) {
    console.error('Failed to load app state:', error);
    return getDefaultState();
  }
}

/**
 * Save app state to local storage
 */
export function saveAppState(state: AppState): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save app state:', error);
  }
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create a new project
 */
export function createProject(name: string, description: string = ''): Project {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name,
    description,
    vnets: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create a new VNet
 */
export function createVNet(name: string, addressSpace: string, description: string = ''): VNet {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name,
    description,
    addressSpace,
    subnets: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create a new subnet
 */
export function createSubnet(
  name: string,
  cidr: string,
  description: string = ''
): Subnet {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name,
    description,
    cidr,
    addressPrefix: cidr,
    delegation: null,
    serviceEndpoints: [],
    isAllocated: true,
    parentId: null,
    createdAt: now,
    updatedAt: now,
  };
}

// Project operations
export function addProject(state: AppState, project: Project): AppState {
  return {
    ...state,
    projects: [...state.projects, project],
    activeProjectId: project.id,
  };
}

export function updateProject(state: AppState, projectId: string, updates: Partial<Project>): AppState {
  return {
    ...state,
    projects: state.projects.map(p =>
      p.id === projectId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    ),
  };
}

export function deleteProject(state: AppState, projectId: string): AppState {
  const newProjects = state.projects.filter(p => p.id !== projectId);
  return {
    ...state,
    projects: newProjects,
    activeProjectId: state.activeProjectId === projectId
      ? (newProjects[0]?.id ?? null)
      : state.activeProjectId,
  };
}

export function getProject(state: AppState, projectId: string): Project | undefined {
  return state.projects.find(p => p.id === projectId);
}

export function getActiveProject(state: AppState): Project | undefined {
  if (!state.activeProjectId) return undefined;
  return getProject(state, state.activeProjectId);
}

// VNet operations
export function addVNet(state: AppState, projectId: string, vnet: VNet): AppState {
  return updateProject(state, projectId, {
    vnets: [...(getProject(state, projectId)?.vnets ?? []), vnet],
  });
}

export function updateVNet(
  state: AppState,
  projectId: string,
  vnetId: string,
  updates: Partial<VNet>
): AppState {
  const project = getProject(state, projectId);
  if (!project) return state;
  
  return updateProject(state, projectId, {
    vnets: project.vnets.map(v =>
      v.id === vnetId ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v
    ),
  });
}

export function deleteVNet(state: AppState, projectId: string, vnetId: string): AppState {
  const project = getProject(state, projectId);
  if (!project) return state;
  
  return updateProject(state, projectId, {
    vnets: project.vnets.filter(v => v.id !== vnetId),
  });
}

export function getVNet(state: AppState, projectId: string, vnetId: string): VNet | undefined {
  return getProject(state, projectId)?.vnets.find(v => v.id === vnetId);
}

// Subnet operations
export function addSubnet(
  state: AppState,
  projectId: string,
  vnetId: string,
  subnet: Subnet
): AppState {
  const vnet = getVNet(state, projectId, vnetId);
  if (!vnet) return state;
  
  return updateVNet(state, projectId, vnetId, {
    subnets: [...vnet.subnets, subnet],
  });
}

export function updateSubnet(
  state: AppState,
  projectId: string,
  vnetId: string,
  subnetId: string,
  updates: Partial<Subnet>
): AppState {
  const vnet = getVNet(state, projectId, vnetId);
  if (!vnet) return state;
  
  return updateVNet(state, projectId, vnetId, {
    subnets: vnet.subnets.map(s =>
      s.id === subnetId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
    ),
  });
}

export function deleteSubnet(
  state: AppState,
  projectId: string,
  vnetId: string,
  subnetId: string
): AppState {
  const vnet = getVNet(state, projectId, vnetId);
  if (!vnet) return state;
  
  return updateVNet(state, projectId, vnetId, {
    subnets: vnet.subnets.filter(s => s.id !== subnetId),
  });
}

export function getSubnet(
  state: AppState,
  projectId: string,
  vnetId: string,
  subnetId: string
): Subnet | undefined {
  return getVNet(state, projectId, vnetId)?.subnets.find(s => s.id === subnetId);
}

/**
 * Replace a subnet with two new subnets (for split operation)
 * This removes the original subnet and adds two new ones
 */
export function splitSubnet(
  state: AppState,
  projectId: string,
  vnetId: string,
  subnetId: string,
  newSubnets: [Subnet, Subnet]
): AppState {
  const vnet = getVNet(state, projectId, vnetId);
  if (!vnet) return state;
  
  const subnetIndex = vnet.subnets.findIndex(s => s.id === subnetId);
  if (subnetIndex === -1) return state;
  
  const newSubnetsList = [...vnet.subnets];
  newSubnetsList.splice(subnetIndex, 1, ...newSubnets);
  
  return updateVNet(state, projectId, vnetId, {
    subnets: newSubnetsList,
  });
}
