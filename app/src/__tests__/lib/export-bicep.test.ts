import { describe, it, expect } from 'vitest';
import { generateBicepTemplate } from '@/lib/export-bicep';
import { Project } from '@/types';

describe('Bicep Template Generator', () => {
  const createTestProject = (overrides?: Partial<Project>): Project => ({
    id: 'test-project',
    name: 'Test Project',
    description: 'A test project',
    vnets: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  });

  describe('generateBicepTemplate', () => {
    it('should include header comment with project name', () => {
      const project = createTestProject({ name: 'My Azure Project' });
      const template = generateBicepTemplate(project);

      expect(template).toContain('// Azure Virtual Network Configuration');
      expect(template).toContain('// Generated from project: My Azure Project');
    });

    it('should include location parameter', () => {
      const project = createTestProject();
      const template = generateBicepTemplate(project);

      expect(template).toContain(
        "@description('Default location for resources (used when VNet region not specified)')"
      );
      expect(template).toContain('param defaultLocation string = resourceGroup().location');
    });

    it('should generate VNet resource', () => {
      const project = createTestProject({
        vnets: [
          {
            id: 'vnet-1',
            name: 'my-vnet',
            description: 'Production VNet',
            addressSpace: '10.0.0.0/16',
            region: 'eastus',
            subnets: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      });

      const template = generateBicepTemplate(project);

      expect(template).toContain('// Virtual Network: my-vnet');
      expect(template).toContain('// Production VNet');
      expect(template).toContain("resource my_vnet 'Microsoft.Network/virtualNetworks@2023-09-01'");
      expect(template).toContain("name: 'my-vnet'");
      expect(template).toContain("'10.0.0.0/16'");
    });

    it('should generate subnet configurations', () => {
      const project = createTestProject({
        vnets: [
          {
            id: 'vnet-1',
            name: 'my-vnet',
            description: '',
            addressSpace: '10.0.0.0/16',
            region: 'eastus',
            subnets: [
              {
                id: 'subnet-1',
                name: 'web-subnet',
                description: '',
                cidr: '10.0.1.0/24',
                addressPrefix: '10.0.1.0/24',
                delegation: null,
                serviceEndpoints: [],
                isAllocated: true,
                parentId: null,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
              },
            ],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      });

      const template = generateBicepTemplate(project);

      expect(template).toContain("name: 'web-subnet'");
      expect(template).toContain("addressPrefix: '10.0.1.0/24'");
    });

    it('should include delegation when present', () => {
      const project = createTestProject({
        vnets: [
          {
            id: 'vnet-1',
            name: 'my-vnet',
            description: '',
            addressSpace: '10.0.0.0/16',
            region: 'eastus',
            subnets: [
              {
                id: 'subnet-1',
                name: 'aci-subnet',
                description: '',
                cidr: '10.0.1.0/24',
                addressPrefix: '10.0.1.0/24',
                delegation: {
                  id: 'aci',
                  name: 'Azure Container Instances',
                  serviceName: 'Microsoft.ContainerInstance/containerGroups',
                  description: 'Delegation for ACI',
                },
                serviceEndpoints: [],
                isAllocated: true,
                parentId: null,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
              },
            ],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      });

      const template = generateBicepTemplate(project);

      expect(template).toContain('delegations:');
      expect(template).toContain("name: 'delegation-aci'");
      expect(template).toContain("serviceName: 'Microsoft.ContainerInstance/containerGroups'");
    });

    it('should include service endpoints when present', () => {
      const project = createTestProject({
        vnets: [
          {
            id: 'vnet-1',
            name: 'my-vnet',
            description: '',
            addressSpace: '10.0.0.0/16',
            region: 'eastus',
            subnets: [
              {
                id: 'subnet-1',
                name: 'data-subnet',
                description: '',
                cidr: '10.0.1.0/24',
                addressPrefix: '10.0.1.0/24',
                delegation: null,
                serviceEndpoints: [
                  {
                    id: 'storage',
                    name: 'Microsoft.Storage',
                    service: 'Microsoft.Storage',
                    description: 'Azure Storage service endpoint',
                  },
                ],
                isAllocated: true,
                parentId: null,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
              },
            ],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      });

      const template = generateBicepTemplate(project);

      expect(template).toContain('serviceEndpoints:');
      expect(template).toContain("service: 'Microsoft.Storage'");
    });

    it('should generate outputs for VNet IDs', () => {
      const project = createTestProject({
        vnets: [
          {
            id: 'vnet-1',
            name: 'my-vnet',
            description: '',
            addressSpace: '10.0.0.0/16',
            region: 'eastus',
            subnets: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      });

      const template = generateBicepTemplate(project);

      expect(template).toContain('// Outputs');
      expect(template).toContain('output my_vnetId string = my_vnet.id');
    });

    it('should handle VNet names with hyphens', () => {
      const project = createTestProject({
        vnets: [
          {
            id: 'vnet-1',
            name: 'my-complex-vnet-name',
            description: '',
            addressSpace: '10.0.0.0/16',
            region: 'eastus',
            subnets: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      });

      const template = generateBicepTemplate(project);

      // Bicep identifiers should use underscores
      expect(template).toContain('resource my_complex_vnet_name');
      expect(template).toContain("name: 'my-complex-vnet-name'");
    });

    it('should handle VNet names starting with numbers', () => {
      const project = createTestProject({
        vnets: [
          {
            id: 'vnet-1',
            name: '123-vnet',
            description: '',
            addressSpace: '10.0.0.0/16',
            region: 'eastus',
            subnets: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      });

      const template = generateBicepTemplate(project);

      // Should prefix with underscore for Bicep identifier
      expect(template).toContain('resource _123_vnet');
    });

    it('should handle multiple VNets', () => {
      const project = createTestProject({
        vnets: [
          {
            id: 'vnet-1',
            name: 'vnet-prod',
            description: '',
            addressSpace: '10.0.0.0/16',
            region: 'eastus',
            subnets: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'vnet-2',
            name: 'vnet-dev',
            description: '',
            addressSpace: '10.1.0.0/16',
            region: 'eastus',
            subnets: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      });

      const template = generateBicepTemplate(project);

      expect(template).toContain("name: 'vnet-prod'");
      expect(template).toContain("name: 'vnet-dev'");
      expect(template).toContain('output vnet_prodId');
      expect(template).toContain('output vnet_devId');
    });

    it('should handle empty project', () => {
      const project = createTestProject();
      const template = generateBicepTemplate(project);

      expect(template).toContain('// Azure Virtual Network Configuration');
      expect(template).toContain('param defaultLocation');
      expect(template).toContain('// Outputs');
    });
  });
});
