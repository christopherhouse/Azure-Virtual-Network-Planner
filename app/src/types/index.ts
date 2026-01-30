// Azure Virtual Network Planner - Type Definitions

/**
 * Represents an Azure subnet delegation option
 */
export interface DelegationOption {
  id: string;
  name: string;
  serviceName: string;
  description: string;
}

/**
 * Represents an Azure service endpoint option
 */
export interface ServiceEndpointOption {
  id: string;
  name: string;
  service: string;
  description: string;
}

/**
 * Represents a subnet within a VNet
 */
export interface Subnet {
  id: string;
  name: string;
  description: string;
  cidr: string;
  addressPrefix: string; // The actual IP range (e.g., "10.0.1.0/24")
  delegation?: DelegationOption | null;
  serviceEndpoints: ServiceEndpointOption[];
  isAllocated: boolean;
  parentId?: string | null; // Reference to parent subnet if this was created from a split
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents a Virtual Network
 */
export interface VNet {
  id: string;
  name: string;
  description: string;
  addressSpace: string; // CIDR notation (e.g., "10.0.0.0/16")
  region: string; // Azure region programmatic name (e.g., "eastus")
  subnets: Subnet[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents a project containing multiple VNets
 */
export interface Project {
  id: string;
  name: string;
  description: string;
  vnets: VNet[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Application state stored in local storage
 */
export interface AppState {
  projects: Project[];
  activeProjectId: string | null;
  version: string;
}

/**
 * CIDR block information
 */
export interface CIDRInfo {
  network: string;
  prefix: number;
  firstIP: string;
  lastIP: string;
  totalHosts: number;
  usableHosts: number;
  netmask: string;
  wildcardMask: string;
}

/**
 * Result of a subnet split operation
 */
export interface SubnetSplitResult {
  subnet1: {
    cidr: string;
    addressPrefix: string;
  };
  subnet2: {
    cidr: string;
    addressPrefix: string;
  };
}

/**
 * Export format options
 */
export type ExportFormat = 'arm' | 'bicep' | 'terraform';

/**
 * Export configuration
 */
export interface ExportConfig {
  format: ExportFormat;
  resourceGroupName: string;
  location: string;
  includeParameters: boolean;
}

/**
 * Validation result for CIDR input
 */
export interface CIDRValidationResult {
  isValid: boolean;
  error?: string;
  normalized?: string;
}
