// ARM Template Generator

import { Project, VNet, Subnet } from '@/types';

interface ARMTemplate {
  $schema: string;
  contentVersion: string;
  parameters: Record<string, unknown>;
  variables: Record<string, unknown>;
  resources: unknown[];
  outputs: Record<string, unknown>;
}

export function generateARMTemplate(project: Project): string {
  const template: ARMTemplate = {
    $schema: 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#',
    contentVersion: '1.0.0.0',
    parameters: {
      location: {
        type: 'string',
        defaultValue: '[resourceGroup().location]',
        metadata: {
          description: 'Location for all resources',
        },
      },
    },
    variables: {},
    resources: [],
    outputs: {},
  };

  // Generate VNet resources
  project.vnets.forEach(vnet => {
    const vnetResource = generateVNetResource(vnet);
    template.resources.push(vnetResource);

    // Add output for VNet ID
    template.outputs[`${sanitizeName(vnet.name)}Id`] = {
      type: 'string',
      value: `[resourceId('Microsoft.Network/virtualNetworks', '${vnet.name}')]`,
    };
  });

  return JSON.stringify(template, null, 2);
}

function generateVNetResource(vnet: VNet): unknown {
  return {
    type: 'Microsoft.Network/virtualNetworks',
    apiVersion: '2023-09-01',
    name: vnet.name,
    location: "[parameters('location')]",
    properties: {
      addressSpace: {
        addressPrefixes: [vnet.addressSpace],
      },
      subnets: vnet.subnets.map(subnet => generateSubnetConfig(subnet)),
    },
  };
}

function generateSubnetConfig(subnet: Subnet): unknown {
  const config: Record<string, unknown> = {
    name: subnet.name,
    properties: {
      addressPrefix: subnet.cidr,
    },
  };

  // Add delegation if present
  if (subnet.delegation) {
    (config.properties as Record<string, unknown>).delegations = [
      {
        name: `delegation-${subnet.delegation.id}`,
        properties: {
          serviceName: subnet.delegation.serviceName,
        },
      },
    ];
  }

  // Add service endpoints if present
  if (subnet.serviceEndpoints.length > 0) {
    (config.properties as Record<string, unknown>).serviceEndpoints = subnet.serviceEndpoints.map(
      ep => ({
        service: ep.service,
        locations: ['*'],
      })
    );
  }

  return config;
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '');
}
