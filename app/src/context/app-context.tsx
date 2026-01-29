'use client';

// App State Context and Provider

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  AppState,
  Project,
  VNet,
  Subnet,
  DelegationOption,
  ServiceEndpointOption,
} from '@/types';
import {
  loadAppState,
  saveAppState,
  createProject,
  createVNet,
  createSubnet,
  addProject,
  updateProject,
  deleteProject,
  getProject,
  getActiveProject,
  addVNet,
  updateVNet,
  deleteVNet,
  getVNet,
  addSubnet,
  updateSubnet,
  deleteSubnet,
  splitSubnet,
  generateId,
} from '@/lib/storage';
import { splitCIDR } from '@/lib/cidr';

interface AppContextType {
  state: AppState;
  activeProject: Project | undefined;
  
  // Project operations
  createNewProject: (name: string, description?: string) => Project;
  updateProjectDetails: (projectId: string, updates: Partial<Project>) => void;
  removeProject: (projectId: string) => void;
  setActiveProject: (projectId: string | null) => void;
  
  // VNet operations
  createNewVNet: (projectId: string, name: string, addressSpace: string, description?: string) => VNet;
  updateVNetDetails: (projectId: string, vnetId: string, updates: Partial<VNet>) => void;
  removeVNet: (projectId: string, vnetId: string) => void;
  
  // Subnet operations
  createNewSubnet: (projectId: string, vnetId: string, name: string, cidr: string, description?: string) => Subnet;
  updateSubnetDetails: (projectId: string, vnetId: string, subnetId: string, updates: Partial<Subnet>) => void;
  removeSubnet: (projectId: string, vnetId: string, subnetId: string) => void;
  splitSubnetInTwo: (projectId: string, vnetId: string, subnetId: string) => boolean;
  setSubnetDelegation: (projectId: string, vnetId: string, subnetId: string, delegation: DelegationOption | null) => void;
  setSubnetServiceEndpoints: (projectId: string, vnetId: string, subnetId: string, endpoints: ServiceEndpointOption[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => ({
    projects: [],
    activeProjectId: null,
    version: '1.0.0',
  }));
  
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Load state from local storage on mount
  useEffect(() => {
    const loaded = loadAppState();
    setState(loaded);
    setIsLoaded(true);
  }, []);
  
  // Save state to local storage on change
  useEffect(() => {
    if (isLoaded) {
      saveAppState(state);
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
    setState(prev => deleteProject(prev, projectId));
  }, []);
  
  const setActiveProject = useCallback((projectId: string | null) => {
    setState(prev => ({ ...prev, activeProjectId: projectId }));
  }, []);
  
  // VNet operations
  const createNewVNet = useCallback((
    projectId: string,
    name: string,
    addressSpace: string,
    description: string = ''
  ): VNet => {
    const vnet = createVNet(name, addressSpace, description);
    setState(prev => addVNet(prev, projectId, vnet));
    return vnet;
  }, []);
  
  const updateVNetDetails = useCallback((projectId: string, vnetId: string, updates: Partial<VNet>) => {
    setState(prev => updateVNet(prev, projectId, vnetId, updates));
  }, []);
  
  const removeVNet = useCallback((projectId: string, vnetId: string) => {
    setState(prev => deleteVNet(prev, projectId, vnetId));
  }, []);
  
  // Subnet operations
  const createNewSubnet = useCallback((
    projectId: string,
    vnetId: string,
    name: string,
    cidr: string,
    description: string = ''
  ): Subnet => {
    const subnet = createSubnet(name, cidr, description);
    setState(prev => addSubnet(prev, projectId, vnetId, subnet));
    return subnet;
  }, []);
  
  const updateSubnetDetails = useCallback((
    projectId: string,
    vnetId: string,
    subnetId: string,
    updates: Partial<Subnet>
  ) => {
    setState(prev => updateSubnet(prev, projectId, vnetId, subnetId, updates));
  }, []);
  
  const removeSubnet = useCallback((projectId: string, vnetId: string, subnetId: string) => {
    setState(prev => deleteSubnet(prev, projectId, vnetId, subnetId));
  }, []);
  
  const splitSubnetInTwo = useCallback((projectId: string, vnetId: string, subnetId: string): boolean => {
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
  }, [state]);
  
  const setSubnetDelegation = useCallback((
    projectId: string,
    vnetId: string,
    subnetId: string,
    delegation: DelegationOption | null
  ) => {
    setState(prev => updateSubnet(prev, projectId, vnetId, subnetId, { delegation }));
  }, []);
  
  const setSubnetServiceEndpoints = useCallback((
    projectId: string,
    vnetId: string,
    subnetId: string,
    endpoints: ServiceEndpointOption[]
  ) => {
    setState(prev => updateSubnet(prev, projectId, vnetId, subnetId, { serviceEndpoints: endpoints }));
  }, []);
  
  const value: AppContextType = {
    state,
    activeProject,
    createNewProject,
    updateProjectDetails,
    removeProject,
    setActiveProject,
    createNewVNet,
    updateVNetDetails,
    removeVNet,
    createNewSubnet,
    updateSubnetDetails,
    removeSubnet,
    splitSubnetInTwo,
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
