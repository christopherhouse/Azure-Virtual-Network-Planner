import { describe, it, expect } from 'vitest';
import { generateTerraformTemplate } from '@/lib/export-terraform';
import { Project } from '@/types';

describe('Terraform Template Generator', () => {
  const createTestProject = (overrides?: Partial<Project>): Project => ({
    id: 'test-project',
    name: 'Test Project',
    description: 'A test project',
    vnets: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  });

  describe('generateTerraformTemplate', () => {
    it('should include header comment with project name', () => {
      const project = createTestProject({ name: 'My Azure Project' });
      const template = generateTerraformTemplate(project);

      expect(template).toContain('# Azure Virtual Network Configuration');
      expect(template).toContain('# Generated from project: My Azure Project');
    });

    it('should include required providers block', () => {
      const project = createTestProject();
      const template = generateTerraformTemplate(project);

      expect(template).toContain('terraform {');
      expect(template).toContain('required_providers {');
      expect(template).toContain('azurerm = {');
      expect(template).toContain('source  = "hashicorp/azurerm"');
      expect(template).toContain('version = "~> 3.0"');
    });

    it('should include provider configuration', () => {
      const project = createTestProject();
      const template = generateTerraformTemplate(project);

      expect(template).toContain('provider "azurerm" {');
      expect(template).toContain('features {}');
    });

    it('should include required variables', () => {
      const project = createTestProject();
      const template = generateTerraformTemplate(project);

      expect(template).toContain('variable "resource_group_name"');
      expect(template).toContain('variable "location"');
      expect(template).toContain('default     = "eastus"');
    });

    it('should include resource group data source', () => {
      const project = createTestProject();
      const template = generateTerraformTemplate(project);

      expect(template).toContain('data "azurerm_resource_group" "main"');
      expect(template).toContain('name = var.resource_group_name');
    });

    it('should generate VNet resource', () => {
      const project = createTestProject({
        vnets: [
          {
            id: 'vnet-1',
            name: 'my-vnet',
            description: 'Production VNet',
            addressSpace: '10.0.0.0/16',
            subnets: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      });

      const template = generateTerraformTemplate(project);

      expect(template).toContain('# Virtual Network: my-vnet');
      expect(template).toContain('# Production VNet');
      expect(template).toContain('resource "azurerm_virtual_network" "my_vnet"');
      expect(template).toContain('name                = "my-vnet"');
      expect(template).toContain('address_space       = ["10.0.0.0/16"]');
    });

    it('should generate subnet resources', () => {
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
                description: 'Web tier',
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

      const template = generateTerraformTemplate(project);

      expect(template).toContain('# Subnet: web-subnet');
      expect(template).toContain('# Web tier');
      expect(template).toContain('resource "azurerm_subnet" "my_vnet_web_subnet"');
      expect(template).toContain('name                 = "web-subnet"');
      expect(template).toContain('virtual_network_name = azurerm_virtual_network.my_vnet.name');
      expect(template).toContain('address_prefixes     = ["10.0.1.0/24"]');
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

      const template = generateTerraformTemplate(project);

      expect(template).toContain('delegation {');
      expect(template).toContain('name = "delegation-aci"');
      expect(template).toContain('service_delegation {');
      expect(template).toContain('name = "Microsoft.ContainerInstance/containerGroups"');
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

      const template = generateTerraformTemplate(project);

      expect(template).toContain('service_endpoints = ["Microsoft.Storage", "Microsoft.Sql"]');
    });

    it('should generate outputs for VNet IDs', () => {
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

      const template = generateTerraformTemplate(project);

      expect(template).toContain('# Outputs');
      expect(template).toContain('output "my_vnet_id"');
      expect(template).toContain('value       = azurerm_virtual_network.my_vnet.id');
      expect(template).toContain('description = "ID of the my-vnet virtual network"');
    });

    it('should handle VNet names with special characters', () => {
      const project = createTestProject({
        vnets: [
          {
            id: 'vnet-1',
            name: 'My-Complex-VNet_Name',
            description: '',
            addressSpace: '10.0.0.0/16',
            subnets: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      });

      const template = generateTerraformTemplate(project);

      // Terraform resource names should be lowercase with underscores
      expect(template).toContain('resource "azurerm_virtual_network" "my_complex_vnet_name"');
      // Original name preserved
      expect(template).toContain('name                = "My-Complex-VNet_Name"');
    });

    it('should handle multiple VNets and subnets', () => {
      const project = createTestProject({
        vnets: [
          {
            id: 'vnet-1',
            name: 'vnet-prod',
            description: '',
            addressSpace: '10.0.0.0/16',
            subnets: [
              {
                id: 'subnet-1',
                name: 'web',
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
          {
            id: 'vnet-2',
            name: 'vnet-dev',
            description: '',
            addressSpace: '10.1.0.0/16',
            subnets: [
              {
                id: 'subnet-2',
                name: 'api',
                description: '',
                cidr: '10.1.1.0/24',
                addressPrefix: '10.1.1.0/24',
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

      const template = generateTerraformTemplate(project);

      expect(template).toContain('resource "azurerm_virtual_network" "vnet_prod"');
      expect(template).toContain('resource "azurerm_virtual_network" "vnet_dev"');
      expect(template).toContain('resource "azurerm_subnet" "vnet_prod_web"');
      expect(template).toContain('resource "azurerm_subnet" "vnet_dev_api"');
      expect(template).toContain('output "vnet_prod_id"');
      expect(template).toContain('output "vnet_dev_id"');
    });

    it('should handle empty project', () => {
      const project = createTestProject();
      const template = generateTerraformTemplate(project);

      expect(template).toContain('# Azure Virtual Network Configuration');
      expect(template).toContain('terraform {');
      expect(template).toContain('# Outputs');
    });
  });
});
