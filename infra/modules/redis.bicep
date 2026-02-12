// Azure Cache for Redis - Standard tier with Private Endpoint and Microsoft Entra ID auth
// Uses built-in Data Contributor access policy for managed identity

@description('Location for the Redis cache')
param location string = resourceGroup().location

@description('Redis cache name')
param redisName string

@description('Redis cache SKU')
@allowed([
  'Basic'
  'Standard'
  'Premium'
])
param redisSku string = 'Standard'

@description('Redis cache capacity (0-6 for Basic/Standard, 1-5 for Premium)')
@allowed([
  0
  1
  2
  3
  4
  5
  6
])
param redisCapacity int = 0

@description('Enable public network access')
param publicNetworkAccess string = 'Disabled'

@description('Private endpoints subnet ID')
param privateEndpointSubnetId string

@description('Principal ID of the managed identity to grant data plane access')
param principalId string

@description('Display name/alias for the managed identity (used in access policy)')
param principalName string = 'api-managed-identity'

@description('Private DNS Zone ID for Redis (privatelink.redis.cache.windows.net)')
param privateDnsZoneId string

@description('Tags for all resources')
param tags object = {}

// SKU family: C for Basic/Standard, P for Premium
var skuFamily = redisSku == 'Premium' ? 'P' : 'C'

// Redis Cache
resource redis 'Microsoft.Cache/redis@2024-03-01' = {
  name: redisName
  location: location
  tags: tags
  properties: {
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    publicNetworkAccess: publicNetworkAccess
    sku: {
      name: redisSku
      family: skuFamily
      capacity: redisCapacity
    }
    redisConfiguration: {
      'aad-enabled': 'true'
    }
  }
}

// Access Policy Assignment - Grant managed identity Data Contributor access
// Built-in policies: 'Data Owner', 'Data Contributor', 'Data Reader'
resource accessPolicyAssignment 'Microsoft.Cache/redis/accessPolicyAssignments@2024-03-01' = {
  parent: redis
  name: guid(redis.id, principalId, 'Data Contributor')
  properties: {
    accessPolicyName: 'Data Contributor'
    objectId: principalId
    objectIdAlias: principalName
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
          privateLinkServiceId: redis.id
          groupIds: [
            'redisCache'
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
@description('Redis cache name')
output name string = redis.name

@description('Redis cache ID')
output id string = redis.id

@description('Redis cache hostname')
output hostName string = redis.properties.hostName

@description('Redis cache SSL port')
output sslPort int = redis.properties.sslPort

@description('Private endpoint ID')
output privateEndpointId string = redisPrivateEndpoint.id
