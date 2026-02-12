// Azure Managed Redis - Balanced tier with Private Endpoint
// Uses Microsoft.Cache/redisEnterprise resource type
// Replaces deprecated Azure Cache for Redis (Microsoft.Cache/redis)

@description('Location for the Redis cache')
param location string = resourceGroup().location

@description('Azure Managed Redis name')
param redisName string

@description('Azure Managed Redis SKU name')
@allowed([
  'Balanced_B0'
  'Balanced_B1'
  'Balanced_B3'
  'Balanced_B5'
  'Balanced_B10'
  'Balanced_B20'
  'Balanced_B50'
  'Balanced_B100'
  'Balanced_B150'
  'Balanced_B250'
  'Balanced_B350'
  'Balanced_B500'
  'Balanced_B700'
  'Balanced_B1000'
  'MemoryOptimized_M10'
  'MemoryOptimized_M20'
  'MemoryOptimized_M50'
  'MemoryOptimized_M100'
  'MemoryOptimized_M150'
  'MemoryOptimized_M250'
  'MemoryOptimized_M350'
  'MemoryOptimized_M500'
  'MemoryOptimized_M700'
  'MemoryOptimized_M1000'
  'ComputeOptimized_X3'
  'ComputeOptimized_X5'
  'ComputeOptimized_X10'
  'ComputeOptimized_X20'
  'ComputeOptimized_X50'
  'ComputeOptimized_X100'
  'ComputeOptimized_X150'
  'ComputeOptimized_X250'
  'ComputeOptimized_X350'
  'ComputeOptimized_X500'
  'ComputeOptimized_X700'
])
param redisSku string = 'Balanced_B0'

@description('Private endpoints subnet ID')
param privateEndpointSubnetId string

@description('Principal ID of the managed identity to grant data plane access')
param principalId string

@description('Private DNS Zone ID for Azure Managed Redis (privatelink.redis.azure.net)')
param privateDnsZoneId string

@description('Tags for all resources')
param tags object = {}

// Azure Managed Redis Cluster
resource redisEnterprise 'Microsoft.Cache/redisEnterprise@2024-09-01-preview' = {
  name: redisName
  location: location
  tags: tags
  sku: {
    name: redisSku
  }
  properties: {
    minimumTlsVersion: '1.2'
  }
}

// Database within the cluster
resource redisDatabase 'Microsoft.Cache/redisEnterprise/databases@2024-09-01-preview' = {
  parent: redisEnterprise
  name: 'default'
  properties: {
    clientProtocol: 'Encrypted'
    clusteringPolicy: 'EnterpriseCluster'
    evictionPolicy: 'VolatileLRU'
    port: 10000
    accessKeysAuthentication: 'Disabled'
  }
}

// Role Assignment - Grant managed identity Redis Data Contributor access
// Built-in role: Redis Cache Contributor (e21d8544-eee5-4c95-bbf3-fb1c4c6b7a4c)
// For data plane access, use: Redis Data Owner (e9e66c7c-c4e6-4b3d-8c3a-d6e2e3e6e6e6) - custom, or use access policies
resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: redisEnterprise
  name: guid(redisEnterprise.id, principalId, 'Redis-Data-Owner')
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'e21d8544-eee5-4c95-bbf3-fb1c4c6b7a4c')
    principalId: principalId
    principalType: 'ServicePrincipal'
  }
}

// Private Endpoint
resource redisPrivateEndpoint 'Microsoft.Network/privateEndpoints@2024-01-01' = {
  name: 'pe-${redisName}'
  location: location
  tags: tags
  properties: {
    subnet: {
      id: privateEndpointSubnetId
    }
    privateLinkServiceConnections: [
      {
        name: 'redis-${redisName}'
        properties: {
          privateLinkServiceId: redisEnterprise.id
          groupIds: [
            'redisEnterprise'
          ]
        }
      }
    ]
  }
}

// Private DNS Zone Group - registers the private endpoint IP in the DNS zone
resource privateDnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2024-01-01' = {
  parent: redisPrivateEndpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'redis-dns-config'
        properties: {
          privateDnsZoneId: privateDnsZoneId
        }
      }
    ]
  }
}

// Outputs
@description('Azure Managed Redis name')
output name string = redisEnterprise.name

@description('Azure Managed Redis ID')
output id string = redisEnterprise.id

@description('Azure Managed Redis hostname')
output hostName string = redisEnterprise.properties.hostName

@description('Azure Managed Redis port')
output port int = 10000

@description('Private endpoint ID')
output privateEndpointId string = redisPrivateEndpoint.id
