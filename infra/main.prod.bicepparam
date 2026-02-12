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

// Redis configuration
param redisSku = 'Standard'
param redisCapacity = 1 // C1 - 1GB, slightly more headroom for prod

param tags = {
  costCenter: 'production'
}
