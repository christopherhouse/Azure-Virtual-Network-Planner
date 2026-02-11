// Azure Cosmos DB for NoSQL - Serverless with Private Endpoint and RBAC
// Partition key: /userId for user-scoped project storage

@description('Location for the Cosmos DB account')
param location string = resourceGroup().location

@description('Cosmos DB account name')
param cosmosAccountName string

@description('Database name')
param databaseName string = 'vnetplanner'

@description('Container name for projects')
param containerName string = 'projects'

@description('Partition key path')
param partitionKeyPath string = '/userId'

@description('Enable public network access')
param publicNetworkAccess string = 'Disabled'

@description('Private endpoints subnet ID')
param privateEndpointSubnetId string

@description('Principal ID of the managed identity to grant data plane access')
param principalId string

@description('Private DNS Zone ID for Cosmos DB (privatelink.documents.azure.com)')
param privateDnsZoneId string

@description('Tags for all resources')
param tags object = {}

// Built-in role definition IDs for Cosmos DB data plane
// Cosmos DB Built-in Data Contributor: read, write, delete items and containers
var cosmosDataContributorRoleId = '00000000-0000-0000-0000-000000000002'

// Cosmos DB Account - Serverless
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-11-15' = {
  name: toLower(cosmosAccountName)
  location: location
  kind: 'GlobalDocumentDB'
  tags: tags
  properties: {
    databaseAccountOfferType: 'Standard'
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    // Enable serverless capacity mode
    capabilities: [
      {
        name: 'EnableServerless'
      }
    ]
    // Disable key-based authentication, enforce RBAC
    disableLocalAuth: true
    // Network configuration
    publicNetworkAccess: publicNetworkAccess
    isVirtualNetworkFilterEnabled: true
    // Disable key-based metadata write access
    disableKeyBasedMetadataWriteAccess: true
  }
}

// Database
resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-11-15' = {
  parent: cosmosAccount
  name: databaseName
  properties: {
    resource: {
      id: databaseName
    }
  }
}

// Container with userId partition key
resource container 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-11-15' = {
  parent: database
  name: containerName
  properties: {
    resource: {
      id: containerName
      partitionKey: {
        paths: [
          partitionKeyPath
        ]
        kind: 'Hash'
        version: 2
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          {
            path: '/*'
          }
        ]
        excludedPaths: [
          {
            path: '/_etag/?'
          }
        ]
      }
      // No default TTL - projects persist indefinitely
    }
    // No throughput settings for serverless - it's automatic
  }
}

// RBAC Role Assignment - Grant managed identity data contributor access
resource sqlRoleAssignment 'Microsoft.DocumentDB/databaseAccounts/sqlRoleAssignments@2024-11-15' = {
  parent: cosmosAccount
  name: guid(cosmosAccount.id, principalId, cosmosDataContributorRoleId)
  properties: {
    roleDefinitionId: '${cosmosAccount.id}/sqlRoleDefinitions/${cosmosDataContributorRoleId}'
    principalId: principalId
    scope: cosmosAccount.id
  }
}

// Private Endpoint
resource cosmosPrivateEndpoint 'Microsoft.Network/privateEndpoints@2024-01-01' = {
  name: 'pe-${cosmosAccountName}'
  location: location
  tags: tags
  properties: {
    subnet: {
      id: privateEndpointSubnetId
    }
    privateLinkServiceConnections: [
      {
        name: 'cosmos-${cosmosAccountName}'
        properties: {
          privateLinkServiceId: cosmosAccount.id
          groupIds: [
            'Sql'
          ]
        }
      }
    ]
  }
}

// Private DNS Zone Group - registers the private endpoint IP in the DNS zone
resource privateDnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2024-01-01' = {
  parent: cosmosPrivateEndpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'cosmos-dns-config'
        properties: {
          privateDnsZoneId: privateDnsZoneId
        }
      }
    ]
  }
}

// Outputs
@description('Cosmos DB account name')
output name string = cosmosAccount.name

@description('Cosmos DB account ID')
output id string = cosmosAccount.id

@description('Cosmos DB account endpoint')
output endpoint string = cosmosAccount.properties.documentEndpoint

@description('Database name')
output databaseName string = database.name

@description('Container name')
output containerName string = container.name

@description('Private endpoint ID')
output privateEndpointId string = cosmosPrivateEndpoint.id

@description('Private endpoint NIC ID for DNS zone association')
output privateEndpointNicId string = cosmosPrivateEndpoint.properties.networkInterfaces[0].id
