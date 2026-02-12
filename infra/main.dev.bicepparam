// Development environment parameters
using './main.bicep'

param environment = 'dev'
param location = 'eastus2'
param baseName = 'vnetplanner'

// VNet configuration
param vnetAddressPrefix = '10.0.0.0/23'
param acaSubnetPrefix = '10.0.0.0/25'
param peSubnetPrefix = '10.0.0.128/27'
param enableVnetIntegration = true
param internalOnly = true

// Redis configuration
param redisSku = 'Balanced_B0' // Smallest Azure Managed Redis SKU (0.5GB)

param tags = {
  costCenter: 'development'
}
