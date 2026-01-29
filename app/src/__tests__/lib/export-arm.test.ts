import { describe, it, expect } from 'vitest';
import { generateARMTemplate } from '@/lib/export-arm';
import { Project } from '@/types';

describe('ARM Template Generator', () => {
  const createTestProject = (overrides?: Partial<Project>): Project => ({
    id: 'test-project',
    name: 'Test Project',
    description: 'A test project',
    vnets: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  });

  describe('generateARMTemplate', () => {
    it('should generate valid JSON structure', () => {
      const project = createTestProject();
      const template = generateARMTemplate(project);
      const parsed = JSON.parse(template);

      expect(parsed.$schema).toBe(
        'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#'
      );
      expect(parsed.contentVersion).toBe('1.0.0.0');
      expect(parsed.parameters).toBeDefined();
      expect(parsed.variables).toBeDefined();
      expect(parsed.resources).toBeDefined();
      expect(parsed.outputs).toBeDefined();
    });

    it('should include location parameter', () => {
      const project = createTestProject();
      const template = generateARMTemplate(project);
      const parsed = JSON.parse(template);

      expect(parsed.parameters.location).toBeDefined();
      expect(parsed.parameters.location.type).toBe('string');
      expect(parsed.parameters.location.defaultValue).toBe('[resourceGroup().location]');
    });

    it('should generate VNet resource', () => {
      const project = createTestProject({
        vnets: [
          {
            id: 'vnet-1',
            name: 'my-vnet',
            description: 'Test VNet',
            addressSpace: '10.0.0.0/16',
            subnets: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      });

      const template = generateARMTemplate(project);
      const parsed = JSON.parse(template);

      expect(parsed.resources).toHaveLength(1);
      expect(parsed.resources[0].type).toBe('Microsoft.Network/virtualNetworks');
      expect(parsed.resources[0].name).toBe('my-vnet');
      expect(parsed.resources[0].properties.addressSpace.addressPrefixes).toContain('10.0.0.0/16');
    });

    it('should generate subnet configurations', () => {
      const project = createTestProject({
        vnets: [
          {
            id: 'vnet-1',
            name: 'my-vnet',
            description: '',
            addressSpace: '10.0.0.0/16',
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

      const template = generateARMTemplate(project);
      const parsed = JSON.parse(template);

      const vnetResource = parsed.resources[0];
      expect(vnetResource.properties.subnets).toHaveLength(1);
      expect(vnetResource.properties.subnets[0].name).toBe('web-subnet');
      expect(vnetResource.properties.subnets[0].properties.addressPrefix).toBe('10.0.1.0/24');
    });

    it('should include delegation when present', () => {
      const project = createTestProject({
        vnets: [
          {
            id: 'vnet-1',
            name: 'my-vnet',
            description: '',
            addressSpace: '10.0.0.0/16',
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

      const template = generateARMTemplate(project);
      const parsed = JSON.parse(template);

      const subnet = parsed.resources[0].properties.subnets[0];
      expect(subnet.properties.delegations).toBeDefined();
      expect(subnet.properties.delegations[0].properties.serviceName).toBe(
        'Microsoft.ContainerInstance/containerGroups'
      );
    });

    it('should include service endpoints when present', () => {
      const project = createTestProject({
        vnets: [
          {
            id: 'vnet-1',
            name: 'my-vnet',
            description: '',
            addressSpace: '10.0.0.0/16',
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
                  {
                    id: 'sql',
                    name: 'Microsoft.Sql',
                    service: 'Microsoft.Sql',
                    description: 'Azure SQL service endpoint',
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

      const template = generateARMTemplate(project);
      const parsed = JSON.parse(template);

      const subnet = parsed.resources[0].properties.subnets[0];
      expect(subnet.properties.serviceEndpoints).toHaveLength(2);
      expect(subnet.properties.serviceEndpoints[0].service).toBe('Microsoft.Storage');
      expect(subnet.properties.serviceEndpoints[1].service).toBe('Microsoft.Sql');
    });

    it('should generate output for VNet ID', () => {
      const project = createTestProject({
        vnets: [
          {
            id: 'vnet-1',
            name: 'my-vnet',
            description: '',
            addressSpace: '10.0.0.0/16',
            subnets: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      });

      const template = generateARMTemplate(project);
      const parsed = JSON.parse(template);

      expect(parsed.outputs.myvnetId).toBeDefined();
      expect(parsed.outputs.myvnetId.type).toBe('string');
    });

    it('should handle multiple VNets', () => {
      const project = createTestProject({
        vnets: [
          {
            id: 'vnet-1',
            name: 'vnet-prod',
            description: '',
            addressSpace: '10.0.0.0/16',
            subnets: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'vnet-2',
            name: 'vnet-dev',
            description: '',
            addressSpace: '10.1.0.0/16',
            subnets: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      });

      const template = generateARMTemplate(project);
      const parsed = JSON.parse(template);

      expect(parsed.resources).toHaveLength(2);
      expect(parsed.outputs.vnetprodId).toBeDefined();
      expect(parsed.outputs.vnetdevId).toBeDefined();
    });

    it('should produce valid JSON output', () => {
      const project = createTestProject({
        vnets: [
          {
            id: 'vnet-1',
            name: 'complex-vnet',
            description: 'A complex VNet with special characters',
            addressSpace: '10.0.0.0/16',
            subnets: [
              {
                id: 'subnet-1',
                name: 'web-tier',
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

      const template = generateARMTemplate(project);
      
      // Should not throw when parsing
      expect(() => JSON.parse(template)).not.toThrow();
    });
  });
});
