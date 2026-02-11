// Production environment parameters
using './main.bicep'

param environment = 'prod'
param location = 'eastus'
param baseName = 'vnetplanner'

// VNet configuration
param vnetAddressPrefix = '10.0.0.0/23'
param acaSubnetPrefix = '10.0.0.0/25'
param peSubnetPrefix = '10.0.0.128/27'
param enableVnetIntegration = true
param internalOnly = true

param tags = {
  costCenter: 'production'
}
