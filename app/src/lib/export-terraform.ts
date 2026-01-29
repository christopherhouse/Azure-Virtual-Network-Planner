// Terraform Template Generator

import { Project, VNet, Subnet } from '@/types';

export function generateTerraformTemplate(project: Project): string {
  const lines: string[] = [];
  
  // Header
  lines.push('# Azure Virtual Network Configuration');
  lines.push(`# Generated from project: ${project.name}`);
  lines.push(`# Generated at: ${new Date().toISOString()}`);
  lines.push('');
  
  // Required providers
  lines.push('terraform {');
  lines.push('  required_providers {');
  lines.push('    azurerm = {');
  lines.push('      source  = "hashicorp/azurerm"');
  lines.push('      version = "~> 3.0"');
  lines.push('    }');
  lines.push('  }');
  lines.push('}');
  lines.push('');
  
  // Provider configuration
  lines.push('provider "azurerm" {');
  lines.push('  features {}');
  lines.push('}');
  lines.push('');
  
  // Variables
  lines.push('# Variables');
  lines.push('variable "resource_group_name" {');
  lines.push('  type        = string');
  lines.push('  description = "Name of the resource group"');
  lines.push('}');
  lines.push('');
  lines.push('variable "location" {');
  lines.push('  type        = string');
  lines.push('  description = "Azure region for resources"');
  lines.push('  default     = "eastus"');
  lines.push('}');
  lines.push('');
  
  // Data source for resource group
  lines.push('# Resource Group (data source - assumes it exists)');
  lines.push('data "azurerm_resource_group" "main" {');
  lines.push('  name = var.resource_group_name');
  lines.push('}');
  lines.push('');
  
  // Generate VNets and Subnets
  project.vnets.forEach((vnet, index) => {
    if (index > 0) lines.push('');
    lines.push(...generateVNetTerraform(vnet));
  });
  
  lines.push('');
  
  // Outputs
  lines.push('# Outputs');
  project.vnets.forEach(vnet => {
    const safeName = sanitizeName(vnet.name);
    lines.push(`output "${safeName}_id" {`);
    lines.push(`  value       = azurerm_virtual_network.${safeName}.id`);
    lines.push(`  description = "ID of the ${vnet.name} virtual network"`);
    lines.push('}');
    lines.push('');
  });
  
  return lines.join('\n');
}

function generateVNetTerraform(vnet: VNet): string[] {
  const lines: string[] = [];
  const safeName = sanitizeName(vnet.name);
  
  lines.push(`# Virtual Network: ${vnet.name}`);
  if (vnet.description) {
    lines.push(`# ${vnet.description}`);
  }
  lines.push(`resource "azurerm_virtual_network" "${safeName}" {`);
  lines.push(`  name                = "${vnet.name}"`);
  lines.push('  location            = data.azurerm_resource_group.main.location');
  lines.push('  resource_group_name = data.azurerm_resource_group.main.name');
  lines.push(`  address_space       = ["${vnet.addressSpace}"]`);
  lines.push('}');
  
  // Generate subnets
  vnet.subnets.forEach(subnet => {
    lines.push('');
    lines.push(...generateSubnetTerraform(subnet, vnet.name, safeName));
  });
  
  return lines;
}

function generateSubnetTerraform(subnet: Subnet, vnetName: string, vnetSafeName: string): string[] {
  const lines: string[] = [];
  const safeName = sanitizeName(subnet.name);
  const resourceName = `${vnetSafeName}_${safeName}`;
  
  lines.push(`# Subnet: ${subnet.name}`);
  if (subnet.description) {
    lines.push(`# ${subnet.description}`);
  }
  lines.push(`resource "azurerm_subnet" "${resourceName}" {`);
  lines.push(`  name                 = "${subnet.name}"`);
  lines.push('  resource_group_name  = data.azurerm_resource_group.main.name');
  lines.push(`  virtual_network_name = azurerm_virtual_network.${vnetSafeName}.name`);
  lines.push(`  address_prefixes     = ["${subnet.cidr}"]`);
  
  // Add delegation if present
  if (subnet.delegation) {
    lines.push('');
    lines.push('  delegation {');
    lines.push(`    name = "delegation-${subnet.delegation.id}"`);
    lines.push('');
    lines.push('    service_delegation {');
    lines.push(`      name = "${subnet.delegation.serviceName}"`);
    lines.push('    }');
    lines.push('  }');
  }
  
  // Add service endpoints if present
  if (subnet.serviceEndpoints.length > 0) {
    const endpoints = subnet.serviceEndpoints.map(ep => `"${ep.service}"`).join(', ');
    lines.push(`  service_endpoints = [${endpoints}]`);
  }
  
  lines.push('}');
  
  return lines;
}

function sanitizeName(name: string): string {
  // Terraform resource names must start with a letter and can only contain letters, numbers, and underscores
  return name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[0-9]/, '_$&').toLowerCase();
}
