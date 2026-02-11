'use client';

// App State Context and Provider

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState, Project, VNet, Subnet, DelegationOption, ServiceEndpointOption } from '@/types';
import {
  loadAppState as loadLocalState,
  saveAppState as saveLocalState,
  createProject,
  createVNet,
  createSubnet,
  addProject,
  updateProject,
  deleteProject,
  getActiveProject,
  addVNet,
  updateVNet,
  deleteVNet,
  getVNet,
  updateSubnet,
  splitSubnet,
  generateId,
  mergeSubnets,
} from '@/lib/storage';
import {
  loadAppState as loadSyncState,
  saveAppState as saveSyncState,
  getSyncState,
  subscribeSyncState,
  SyncStatus,
  deleteProjectSync,
} from '@/lib/sync-storage';
import { splitCIDR, mergeCIDR, canMergeCIDR } from '@/lib/cidr';

interface AppContextType {
  state: AppState;
  activeProject: Project | undefined;
  syncStatus: SyncStatus;
  isOnline: boolean;

  // Project operations
  createNewProject: (name: string, description?: string) => Project;
  updateProjectDetails: (projectId: string, updates: Partial<Project>) => void;
  removeProject: (projectId: string) => void;
  setActiveProject: (projectId: string | null) => void;

  // VNet operations
  createNewVNet: (
    projectId: string,
    name: string,
    addressSpace: string,
    description?: string,
    region?: string
  ) => VNet;
  updateVNetDetails: (projectId: string, vnetId: string, updates: Partial<VNet>) => void;
  removeVNet: (projectId: string, vnetId: string) => void;

  // Subnet operations
  updateSubnetDetails: (
    projectId: string,
    vnetId: string,
    subnetId: string,
    updates: Partial<Subnet>
  ) => void;
  splitSubnetInTwo: (projectId: string, vnetId: string, subnetId: string) => boolean;
  mergeSubnetsIntoOne: (
    projectId: string,
    vnetId: string,
    subnetId1: string,
    subnetId2: string
  ) => boolean;
  canMergeSubnets: (
    projectId: string,
    vnetId: string,
    subnetId1: string,
    subnetId2: string
  ) => boolean;
  setSubnetDelegation: (
    projectId: string,
    vnetId: string,
    subnetId: string,
    delegation: DelegationOption | null
  ) => void;
  setSubnetServiceEndpoints: (
    projectId: string,
    vnetId: string,
    subnetId: string,
    endpoints: ServiceEndpointOption[]
  ) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => ({
    projects: [],
    activeProjectId: null,
    version: '1.0.0',
  }));

  const [isLoaded, setIsLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [isOnline, setIsOnline] = useState(true);

  // Subscribe to sync state changes
  useEffect(() => {
    const unsubscribe = subscribeSyncState(syncState => {
      setSyncStatus(syncState.status);
      setIsOnline(syncState.status !== 'offline');
    });
    return unsubscribe;
  }, []);

  // Load state on mount - tries API first, falls back to localStorage
  useEffect(() => {
    const loadState = async () => {
      try {
        const loaded = await loadSyncState();
        setState(loaded); // eslint-disable-line react-hooks/set-state-in-effect -- initialization
      } catch (error) {
        console.error('Failed to load state, using local storage:', error);
        const local = loadLocalState();
        setState(local); // eslint-disable-line react-hooks/set-state-in-effect -- initialization
      }
      setIsLoaded(true);
    };
    loadState();
  }, []);

  // Save state on change - syncs to API if available
  useEffect(() => {
    if (isLoaded) {
      // Use async save but don't await (fire and forget for UI responsiveness)
      saveSyncState(state).catch(error => {
        console.error('Failed to sync state:', error);
        // Always save to local storage as backup
        saveLocalState(state);
      });
    }
  }, [state, isLoaded]);

  const activeProject = getActiveProject(state);

  // Project operations
  const createNewProject = useCallback((name: string, description: string = ''): Project => {
    const project = createProject(name, description);
    setState(prev => addProject(prev, project));
    return project;
  }, []);

  const updateProjectDetails = useCallback((projectId: string, updates: Partial<Project>) => {
    setState(prev => updateProject(prev, projectId, updates));
  }, []);

  const removeProject = useCallback((projectId: string) => {
    // Delete from API in background
    deleteProjectSync(projectId).catch(error => {
      console.error('Failed to delete project from API:', error);
    });
    setState(prev => deleteProject(prev, projectId));
  }, []);

  const setActiveProject = useCallback((projectId: string | null) => {
    setState(prev => ({ ...prev, activeProjectId: projectId }));
  }, []);

  // VNet operations - now auto-creates initial subnet covering entire address space
  const createNewVNet = useCallback(
    (
      projectId: string,
      name: string,
      addressSpace: string,
      description: string = '',
      region: string = 'eastus'
    ): VNet => {
      const vnet = createVNet(name, addressSpace, description, region);
      // Auto-create initial subnet covering entire address space
      const initialSubnet = createSubnet(
        'Unallocated',
        addressSpace,
        'Initial address space - split to create subnets'
      );
      vnet.subnets = [initialSubnet];
      setState(prev => addVNet(prev, projectId, vnet));
      return vnet;
    },
    []
  );

  const updateVNetDetails = useCallback(
    (projectId: string, vnetId: string, updates: Partial<VNet>) => {
      setState(prev => updateVNet(prev, projectId, vnetId, updates));
    },
    []
  );

  const removeVNet = useCallback((projectId: string, vnetId: string) => {
    setState(prev => deleteVNet(prev, projectId, vnetId));
  }, []);

  // Subnet operations
  const updateSubnetDetails = useCallback(
    (projectId: string, vnetId: string, subnetId: string, updates: Partial<Subnet>) => {
      setState(prev => updateSubnet(prev, projectId, vnetId, subnetId, updates));
    },
    []
  );

  const splitSubnetInTwo = useCallback(
    (projectId: string, vnetId: string, subnetId: string): boolean => {
      const vnet = getVNet(state, projectId, vnetId);
      if (!vnet) return false;

      const subnet = vnet.subnets.find(s => s.id === subnetId);
      if (!subnet) return false;

      const splitResult = splitCIDR(subnet.cidr);
      if (!splitResult) return false;

      const now = new Date().toISOString();
      const newSubnet1: Subnet = {
        id: generateId(),
        name: `${subnet.name}-1`,
        description: '',
        cidr: splitResult.subnet1.cidr,
        addressPrefix: splitResult.subnet1.addressPrefix,
        delegation: null,
        serviceEndpoints: [],
        isAllocated: true,
        parentId: subnetId,
        createdAt: now,
        updatedAt: now,
      };

      const newSubnet2: Subnet = {
        id: generateId(),
        name: `${subnet.name}-2`,
        description: '',
        cidr: splitResult.subnet2.cidr,
        addressPrefix: splitResult.subnet2.addressPrefix,
        delegation: null,
        serviceEndpoints: [],
        isAllocated: true,
        parentId: subnetId,
        createdAt: now,
        updatedAt: now,
      };

      setState(prev => splitSubnet(prev, projectId, vnetId, subnetId, [newSubnet1, newSubnet2]));
      return true;
    },
    [state]
  );

  const canMergeSubnets = useCallback(
    (projectId: string, vnetId: string, subnetId1: string, subnetId2: string): boolean => {
      const vnet = getVNet(state, projectId, vnetId);
      if (!vnet) return false;

      const subnet1 = vnet.subnets.find(s => s.id === subnetId1);
      const subnet2 = vnet.subnets.find(s => s.id === subnetId2);
      if (!subnet1 || !subnet2) return false;

      return canMergeCIDR(subnet1.cidr, subnet2.cidr);
    },
    [state]
  );

  const mergeSubnetsIntoOne = useCallback(
    (projectId: string, vnetId: string, subnetId1: string, subnetId2: string): boolean => {
      const vnet = getVNet(state, projectId, vnetId);
      if (!vnet) return false;

      const subnet1 = vnet.subnets.find(s => s.id === subnetId1);
      const subnet2 = vnet.subnets.find(s => s.id === subnetId2);
      if (!subnet1 || !subnet2) return false;

      const mergedCidr = mergeCIDR(subnet1.cidr, subnet2.cidr);
      if (!mergedCidr) return false;

      const now = new Date().toISOString();
      const mergedSubnet: Subnet = {
        id: generateId(),
        name: 'Merged',
        description: '',
        cidr: mergedCidr,
        addressPrefix: mergedCidr,
        delegation: null,
        serviceEndpoints: [],
        isAllocated: true,
        parentId: null,
        createdAt: now,
        updatedAt: now,
      };

      setState(prev => mergeSubnets(prev, projectId, vnetId, subnetId1, subnetId2, mergedSubnet));
      return true;
    },
    [state]
  );

  const setSubnetDelegation = useCallback(
    (projectId: string, vnetId: string, subnetId: string, delegation: DelegationOption | null) => {
      setState(prev => updateSubnet(prev, projectId, vnetId, subnetId, { delegation }));
    },
    []
  );

  const setSubnetServiceEndpoints = useCallback(
    (projectId: string, vnetId: string, subnetId: string, endpoints: ServiceEndpointOption[]) => {
      setState(prev =>
        updateSubnet(prev, projectId, vnetId, subnetId, { serviceEndpoints: endpoints })
      );
    },
    []
  );

  const value: AppContextType = {
    state,
    activeProject,
    syncStatus,
    isOnline,
    createNewProject,
    updateProjectDetails,
    removeProject,
    setActiveProject,
    createNewVNet,
    updateVNetDetails,
    removeVNet,
    updateSubnetDetails,
    splitSubnetInTwo,
    mergeSubnetsIntoOne,
    canMergeSubnets,
    setSubnetDelegation,
    setSubnetServiceEndpoints,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
