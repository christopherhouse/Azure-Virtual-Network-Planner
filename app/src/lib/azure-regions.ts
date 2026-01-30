// Azure Regions Data
// Source: Microsoft Learn Documentation (January 2026)
// https://learn.microsoft.com/en-us/azure/reliability/regions-list

export interface AzureRegion {
  name: string; // Display name
  value: string; // Programmatic name (used in ARM/Bicep/Terraform)
  geography: string; // Geographic grouping
  hasAvailabilityZones: boolean;
  isRestricted?: boolean; // Restricted access regions
}

export interface RegionGroup {
  geography: string;
  regions: AzureRegion[];
}

// All Azure regions grouped by geography
export const AZURE_REGIONS: AzureRegion[] = [
  // Africa
  {
    name: 'South Africa North',
    value: 'southafricanorth',
    geography: 'Africa',
    hasAvailabilityZones: true,
  },
  {
    name: 'South Africa West',
    value: 'southafricawest',
    geography: 'Africa',
    hasAvailabilityZones: false,
    isRestricted: true,
  },

  // Asia Pacific
  {
    name: 'Australia Central',
    value: 'australiacentral',
    geography: 'Asia Pacific',
    hasAvailabilityZones: false,
  },
  {
    name: 'Australia Central 2',
    value: 'australiacentral2',
    geography: 'Asia Pacific',
    hasAvailabilityZones: false,
    isRestricted: true,
  },
  {
    name: 'Australia East',
    value: 'australiaeast',
    geography: 'Asia Pacific',
    hasAvailabilityZones: true,
  },
  {
    name: 'Australia Southeast',
    value: 'australiasoutheast',
    geography: 'Asia Pacific',
    hasAvailabilityZones: false,
  },
  {
    name: 'Central India',
    value: 'centralindia',
    geography: 'Asia Pacific',
    hasAvailabilityZones: true,
  },
  { name: 'East Asia', value: 'eastasia', geography: 'Asia Pacific', hasAvailabilityZones: true },
  {
    name: 'Indonesia Central',
    value: 'indonesiacentral',
    geography: 'Asia Pacific',
    hasAvailabilityZones: true,
  },
  { name: 'Japan East', value: 'japaneast', geography: 'Asia Pacific', hasAvailabilityZones: true },
  { name: 'Japan West', value: 'japanwest', geography: 'Asia Pacific', hasAvailabilityZones: true },
  {
    name: 'Korea Central',
    value: 'koreacentral',
    geography: 'Asia Pacific',
    hasAvailabilityZones: true,
  },
  {
    name: 'Korea South',
    value: 'koreasouth',
    geography: 'Asia Pacific',
    hasAvailabilityZones: false,
  },
  {
    name: 'Malaysia West',
    value: 'malaysiawest',
    geography: 'Asia Pacific',
    hasAvailabilityZones: true,
  },
  {
    name: 'New Zealand North',
    value: 'newzealandnorth',
    geography: 'Asia Pacific',
    hasAvailabilityZones: true,
  },
  {
    name: 'South India',
    value: 'southindia',
    geography: 'Asia Pacific',
    hasAvailabilityZones: false,
  },
  {
    name: 'Southeast Asia',
    value: 'southeastasia',
    geography: 'Asia Pacific',
    hasAvailabilityZones: true,
  },
  {
    name: 'West India',
    value: 'westindia',
    geography: 'Asia Pacific',
    hasAvailabilityZones: false,
  },

  // Americas - Brazil
  { name: 'Brazil South', value: 'brazilsouth', geography: 'Brazil', hasAvailabilityZones: true },
  {
    name: 'Brazil Southeast',
    value: 'brazilsoutheast',
    geography: 'Brazil',
    hasAvailabilityZones: false,
    isRestricted: true,
  },

  // Americas - Canada
  {
    name: 'Canada Central',
    value: 'canadacentral',
    geography: 'Canada',
    hasAvailabilityZones: true,
  },
  { name: 'Canada East', value: 'canadaeast', geography: 'Canada', hasAvailabilityZones: false },

  // Americas - Chile
  { name: 'Chile Central', value: 'chilecentral', geography: 'Chile', hasAvailabilityZones: true },

  // Americas - Mexico
  {
    name: 'Mexico Central',
    value: 'mexicocentral',
    geography: 'Mexico',
    hasAvailabilityZones: true,
  },

  // Americas - United States
  {
    name: 'Central US',
    value: 'centralus',
    geography: 'United States',
    hasAvailabilityZones: true,
  },
  { name: 'East US', value: 'eastus', geography: 'United States', hasAvailabilityZones: true },
  { name: 'East US 2', value: 'eastus2', geography: 'United States', hasAvailabilityZones: true },
  {
    name: 'North Central US',
    value: 'northcentralus',
    geography: 'United States',
    hasAvailabilityZones: false,
  },
  {
    name: 'South Central US',
    value: 'southcentralus',
    geography: 'United States',
    hasAvailabilityZones: true,
  },
  {
    name: 'West Central US',
    value: 'westcentralus',
    geography: 'United States',
    hasAvailabilityZones: false,
  },
  { name: 'West US', value: 'westus', geography: 'United States', hasAvailabilityZones: false },
  { name: 'West US 2', value: 'westus2', geography: 'United States', hasAvailabilityZones: true },
  { name: 'West US 3', value: 'westus3', geography: 'United States', hasAvailabilityZones: true },

  // Europe
  { name: 'Austria East', value: 'austriaeast', geography: 'Europe', hasAvailabilityZones: true },
  {
    name: 'Belgium Central',
    value: 'belgiumcentral',
    geography: 'Europe',
    hasAvailabilityZones: true,
  },
  {
    name: 'France Central',
    value: 'francecentral',
    geography: 'Europe',
    hasAvailabilityZones: true,
  },
  {
    name: 'France South',
    value: 'francesouth',
    geography: 'Europe',
    hasAvailabilityZones: false,
    isRestricted: true,
  },
  {
    name: 'Germany North',
    value: 'germanynorth',
    geography: 'Europe',
    hasAvailabilityZones: false,
    isRestricted: true,
  },
  {
    name: 'Germany West Central',
    value: 'germanywestcentral',
    geography: 'Europe',
    hasAvailabilityZones: true,
  },
  { name: 'Italy North', value: 'italynorth', geography: 'Europe', hasAvailabilityZones: true },
  { name: 'North Europe', value: 'northeurope', geography: 'Europe', hasAvailabilityZones: true },
  { name: 'Norway East', value: 'norwayeast', geography: 'Europe', hasAvailabilityZones: true },
  {
    name: 'Norway West',
    value: 'norwaywest',
    geography: 'Europe',
    hasAvailabilityZones: false,
    isRestricted: true,
  },
  {
    name: 'Poland Central',
    value: 'polandcentral',
    geography: 'Europe',
    hasAvailabilityZones: true,
  },
  { name: 'Spain Central', value: 'spaincentral', geography: 'Europe', hasAvailabilityZones: true },
  {
    name: 'Sweden Central',
    value: 'swedencentral',
    geography: 'Europe',
    hasAvailabilityZones: true,
  },
  {
    name: 'Switzerland North',
    value: 'switzerlandnorth',
    geography: 'Europe',
    hasAvailabilityZones: true,
  },
  {
    name: 'Switzerland West',
    value: 'switzerlandwest',
    geography: 'Europe',
    hasAvailabilityZones: false,
    isRestricted: true,
  },
  { name: 'West Europe', value: 'westeurope', geography: 'Europe', hasAvailabilityZones: true },

  // Europe - United Kingdom
  { name: 'UK South', value: 'uksouth', geography: 'United Kingdom', hasAvailabilityZones: true },
  { name: 'UK West', value: 'ukwest', geography: 'United Kingdom', hasAvailabilityZones: false },

  // Middle East
  {
    name: 'Israel Central',
    value: 'israelcentral',
    geography: 'Middle East',
    hasAvailabilityZones: true,
  },
  {
    name: 'Qatar Central',
    value: 'qatarcentral',
    geography: 'Middle East',
    hasAvailabilityZones: true,
  },
  {
    name: 'UAE Central',
    value: 'uaecentral',
    geography: 'Middle East',
    hasAvailabilityZones: false,
    isRestricted: true,
  },
  { name: 'UAE North', value: 'uaenorth', geography: 'Middle East', hasAvailabilityZones: true },

  // Sovereign Clouds - Azure China (21Vianet)
  { name: 'China East', value: 'chinaeast', geography: 'Azure China', hasAvailabilityZones: false },
  {
    name: 'China East 2',
    value: 'chinaeast2',
    geography: 'Azure China',
    hasAvailabilityZones: false,
  },
  {
    name: 'China East 3',
    value: 'chinaeast3',
    geography: 'Azure China',
    hasAvailabilityZones: false,
    isRestricted: true,
  },
  {
    name: 'China North',
    value: 'chinanorth',
    geography: 'Azure China',
    hasAvailabilityZones: false,
  },
  {
    name: 'China North 2',
    value: 'chinanorth2',
    geography: 'Azure China',
    hasAvailabilityZones: false,
  },
  {
    name: 'China North 3',
    value: 'chinanorth3',
    geography: 'Azure China',
    hasAvailabilityZones: true,
  },

  // Sovereign Clouds - Azure Government (US)
  {
    name: 'US Gov Arizona',
    value: 'usgovarizona',
    geography: 'Azure Government',
    hasAvailabilityZones: false,
  },
  {
    name: 'US Gov Texas',
    value: 'usgovtexas',
    geography: 'Azure Government',
    hasAvailabilityZones: false,
  },
  {
    name: 'US Gov Virginia',
    value: 'usgovvirginia',
    geography: 'Azure Government',
    hasAvailabilityZones: false,
  },
  {
    name: 'US DoD Central',
    value: 'usdodcentral',
    geography: 'Azure Government',
    hasAvailabilityZones: false,
  },
  {
    name: 'US DoD East',
    value: 'usdodeast',
    geography: 'Azure Government',
    hasAvailabilityZones: false,
  },
];

// Default region for new VNets
export const DEFAULT_REGION = 'eastus';

// Get regions grouped by geography (sorted alphabetically)
export function getRegionsByGeography(): RegionGroup[] {
  const groups = new Map<string, AzureRegion[]>();

  // Group regions
  for (const region of AZURE_REGIONS) {
    const existing = groups.get(region.geography) || [];
    existing.push(region);
    groups.set(region.geography, existing);
  }

  // Convert to array and sort
  const result: RegionGroup[] = [];

  // Define geography order: Public clouds first (alphabetically), then sovereign clouds
  const publicGeographies = [
    'Africa',
    'Asia Pacific',
    'Brazil',
    'Canada',
    'Chile',
    'Europe',
    'Mexico',
    'Middle East',
    'United Kingdom',
    'United States',
  ];

  const sovereignGeographies = ['Azure China', 'Azure Government'];

  // Add public geographies
  for (const geo of publicGeographies) {
    const regions = groups.get(geo);
    if (regions) {
      result.push({
        geography: geo,
        regions: regions.sort((a, b) => a.name.localeCompare(b.name)),
      });
    }
  }

  // Add sovereign geographies
  for (const geo of sovereignGeographies) {
    const regions = groups.get(geo);
    if (regions) {
      result.push({
        geography: geo,
        regions: regions.sort((a, b) => a.name.localeCompare(b.name)),
      });
    }
  }

  return result;
}

// Find a region by its programmatic value
export function findRegionByValue(value: string): AzureRegion | undefined {
  return AZURE_REGIONS.find(r => r.value === value);
}

// Get display name for a region value
export function getRegionDisplayName(value: string): string {
  const region = findRegionByValue(value);
  return region ? region.name : value;
}
