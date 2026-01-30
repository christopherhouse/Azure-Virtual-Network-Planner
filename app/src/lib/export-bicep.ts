// Bicep Template Generator

import { Project, VNet, Subnet } from '@/types';
import { getRegionDisplayName } from '@/lib/azure-regions';

export function generateBicepTemplate(project: Project): string {
  const lines: string[] = [];

  // Header comment
  lines.push('// Azure Virtual Network Configuration');
  lines.push(`// Generated from project: ${project.name}`);
  lines.push(`// Generated at: ${new Date().toISOString()}`);
  lines.push('');

  // Parameters - default location as fallback
  lines.push('// Parameters');
  lines.push(
    "@description('Default location for resources (used when VNet region not specified)')"
  );
  lines.push('param defaultLocation string = resourceGroup().location');
  lines.push('');

  // Generate VNets
  project.vnets.forEach((vnet, index) => {
    if (index > 0) lines.push('');
    lines.push(...generateVNetBicep(vnet));
  });

  lines.push('');

  // Outputs
  lines.push('// Outputs');
  project.vnets.forEach(vnet => {
    const safeName = sanitizeName(vnet.name);
    lines.push(`output ${safeName}Id string = ${safeName}.id`);
    lines.push(`output ${safeName}Location string = ${safeName}.location`);
  });

  return lines.join('\n');
}

function generateVNetBicep(vnet: VNet): string[] {
  const lines: string[] = [];
  const safeName = sanitizeName(vnet.name);

  lines.push(`// Virtual Network: ${vnet.name}`);
  if (vnet.description) {
    lines.push(`// ${vnet.description}`);
  }

  // Add region comment if specified
  if (vnet.region) {
    lines.push(`// Region: ${getRegionDisplayName(vnet.region)} (${vnet.region})`);
  }

  lines.push(`resource ${safeName} 'Microsoft.Network/virtualNetworks@2023-09-01' = {`);
  lines.push(`  name: '${vnet.name}'`);

  // Use VNet's specific region if set, otherwise use default parameter
  if (vnet.region) {
    lines.push(`  location: '${vnet.region}'`);
  } else {
    lines.push('  location: defaultLocation');
  }

  lines.push('  properties: {');
  lines.push('    addressSpace: {');
  lines.push('      addressPrefixes: [');
  lines.push(`        '${vnet.addressSpace}'`);
  lines.push('      ]');
  lines.push('    }');

  if (vnet.subnets.length > 0) {
    lines.push('    subnets: [');
    vnet.subnets.forEach((subnet, index) => {
      const subnetLines = generateSubnetBicep(subnet);
      if (index > 0) {
        lines.push('');
      }
      lines.push(...subnetLines.map(line => '      ' + line));
    });
    lines.push('    ]');
  }

  lines.push('  }');
  lines.push('}');

  return lines;
}

function generateSubnetBicep(subnet: Subnet): string[] {
  const lines: string[] = [];

  lines.push('{');
  lines.push(`  name: '${subnet.name}'`);
  lines.push('  properties: {');
  lines.push(`    addressPrefix: '${subnet.cidr}'`);

  // Add delegation if present
  if (subnet.delegation) {
    lines.push('    delegations: [');
    lines.push('      {');
    lines.push(`        name: 'delegation-${subnet.delegation.id}'`);
    lines.push('        properties: {');
    lines.push(`          serviceName: '${subnet.delegation.serviceName}'`);
    lines.push('        }');
    lines.push('      }');
    lines.push('    ]');
  }

  // Add service endpoints if present
  if (subnet.serviceEndpoints.length > 0) {
    lines.push('    serviceEndpoints: [');
    subnet.serviceEndpoints.forEach((ep, index) => {
      lines.push('      {');
      lines.push(`        service: '${ep.service}'`);
      lines.push('        locations: [');
      lines.push("          '*'");
      lines.push('        ]');
      lines.push('      }' + (index < subnet.serviceEndpoints.length - 1 ? '' : ''));
    });
    lines.push('    ]');
  }

  lines.push('  }');
  lines.push('}');

  return lines;
}

function sanitizeName(name: string): string {
  // Replace hyphens with underscores for Bicep identifier compatibility
  return name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[0-9]/, '_$&');
}
