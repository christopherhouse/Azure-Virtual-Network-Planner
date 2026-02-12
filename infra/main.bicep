// Main Bicep file for Azure VNet Planner Core Infrastructure
// Deploys: VNet, NSGs, ACR, Container Apps Environment (Workload Profiles), 
// Key Vault, User Assigned Managed Identity, WAF Policy
// NOTE: Container Apps deployed via scripts after image import to ACR
// NOTE: Front Door deployed via front-door-deployment.bicep after Container Apps exist

targetScope = 'resourceGroup'

@description('Environment name (dev, prod)')
@allowed([
  'dev'
  'prod'
])
param environment string

@description('Location for all resources')
param location string = resourceGroup().location

@description('Base name for resources')
param baseName string = 'vnetplanner'

@description('VNet address space')
param vnetAddressPrefix string = '10.0.0.0/23'

@description('Container Apps subnet address prefix')
param acaSubnetPrefix string = '10.0.0.0/25'

@description('Private Endpoints subnet address prefix')
param peSubnetPrefix string = '10.0.0.128/27'

@description('Enable VNet integration for Container Apps')
param enableVnetIntegration bool = true

@description('Make Container Apps environment internal only (no public ingress)')
param internalOnly bool = true

@description('Tags for all resources')
param tags object = {}

@description('Azure Managed Redis SKU')
@allowed([
  'Balanced_B0'
  'Balanced_B1'
  'Balanced_B3'
  'Balanced_B5'
  'Balanced_B10'
  'MemoryOptimized_M10'
  'ComputeOptimized_X3'
])
param redisSku string = 'Balanced_B0'

// Computed names based on environment
var resourceSuffix = '${baseName}-${environment}'
var acrName = replace('acr${baseName}${environment}', '-', '')
var environmentName = 'cae-${resourceSuffix}'
var logAnalyticsName = 'log-${resourceSuffix}'
var keyVaultName = 'kv-${resourceSuffix}'
var identityName = 'id-${resourceSuffix}'
var appInsightsName = 'appi-${resourceSuffix}'
var vnetName = 'vnet-${resourceSuffix}'
var nsgAcaName = 'nsg-aca-${resourceSuffix}'
var nsgPeName = 'nsg-pe-${resourceSuffix}'
var wafPolicyName = replace('wafpol${resourceSuffix}', '-', '')
var cosmosAccountName = 'cosmos-${resourceSuffix}'
var redisName = 'redis-${resourceSuffix}'

// Merge default tags with provided tags
var defaultTags = {
  environment: environment
  application: 'azure-vnet-planner'
  managedBy: 'bicep'
}
var allTags = union(defaultTags, tags)

// Deploy Container Registry
module acr 'modules/acr.bicep' = {
  name: 'acr-${deployment().name}'
  params: {
    location: location
    acrName: acrName
    sku: environment == 'prod' ? 'Standard' : 'Basic'
    adminUserEnabled: false // Using UAMI for authentication
    tags: allTags
  }
}

// Deploy Network Security Groups
module nsgAca 'modules/nsg.bicep' = {
  name: 'nsg-aca-${deployment().name}'
  params: {
    location: location
    nsgName: nsgAcaName
    tags: allTags
  }
}

module nsgPe 'modules/nsg.bicep' = {
  name: 'nsg-pe-${deployment().name}'
  params: {
    location: location
    nsgName: nsgPeName
    tags: allTags
  }
}

// Deploy Virtual Network
module vnet 'modules/vnet.bicep' = {
  name: 'vnet-${deployment().name}'
  params: {
    location: location
    vnetName: vnetName
    addressPrefix: vnetAddressPrefix
    acaSubnetPrefix: acaSubnetPrefix
    peSubnetPrefix: peSubnetPrefix
    acaNsgId: nsgAca.outputs.id
    peNsgId: nsgPe.outputs.id
    tags: allTags
  }
}

// Deploy Container Apps Environment (Workload Profiles with VNet integration)
module containerAppsEnv 'modules/container-apps-environment.bicep' = {
  name: 'cae-${deployment().name}'
  params: {
    location: location
    environmentName: environmentName
    logAnalyticsName: logAnalyticsName
    vnetIntegrationEnabled: enableVnetIntegration
    infrastructureSubnetId: vnet.outputs.acaSubnetId
    internalOnly: internalOnly
    zoneRedundant: environment == 'prod'
    tags: allTags
  }
}

// Deploy Key Vault
module keyVault 'modules/key-vault.bicep' = {
  name: 'kv-${deployment().name}'
  params: {
    location: location
    keyVaultName: keyVaultName
    sku: 'standard'
    enablePurgeProtection: environment == 'prod'
    tags: allTags
  }
}

// Deploy User Assigned Managed Identity with Key Vault role
module userAssignedIdentity 'modules/user-assigned-identity.bicep' = {
  name: 'uami-${deployment().name}'
  params: {
    location: location
    identityName: identityName
    keyVaultId: keyVault.outputs.id
    tags: allTags
  }
}

// Grant UAMI pull access to ACR
resource acrResource 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = {
  name: acrName
  dependsOn: [
    acr
  ]
}

// AcrPull role assignment for UAMI
var acrPullRoleId = '7f951dda-4ed3-4680-a7ca-43fe172d538d'
resource acrPullRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(resourceGroup().id, identityName, acrName, acrPullRoleId)
  scope: acrResource
  properties: {
    principalId: userAssignedIdentity.outputs.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleId)
    principalType: 'ServicePrincipal'
  }
}

// Deploy Application Insights
module appInsights 'modules/app-insights.bicep' = {
  name: 'appi-${deployment().name}'
  params: {
    location: location
    appInsightsName: appInsightsName
    logAnalyticsWorkspaceId: containerAppsEnv.outputs.logAnalyticsId
    tags: allTags
  }
}

// Deploy Diagnostic Settings for all resources
module diagnosticSettings 'modules/diagnostic-settings.bicep' = {
  name: 'diag-${deployment().name}'
  params: {
    logAnalyticsWorkspaceId: containerAppsEnv.outputs.logAnalyticsId
    keyVaultName: keyVault.outputs.name
    acrName: acr.outputs.name
    containerAppsEnvironmentName: containerAppsEnv.outputs.name
  }
}

// Deploy Private DNS Zone for Cosmos DB
module cosmosDnsZone 'modules/private-dns-zone.bicep' = {
  name: 'cosmosdns-${deployment().name}'
  params: {
    zoneName: 'privatelink.documents.azure.com'
    vnetId: vnet.outputs.id
    vnetName: vnet.outputs.name
    tags: allTags
  }
}

// Deploy Private DNS Zone for Azure Managed Redis
module redisDnsZone 'modules/private-dns-zone.bicep' = {
  name: 'redisdns-${deployment().name}'
  params: {
    zoneName: 'privatelink.redis.azure.net'
    vnetId: vnet.outputs.id
    vnetName: vnet.outputs.name
    tags: allTags
  }
}

// Deploy Cosmos DB with Private Endpoint and RBAC
module cosmosDb 'modules/cosmos-db.bicep' = {
  name: 'cosmos-${deployment().name}'
  params: {
    location: location
    cosmosAccountName: cosmosAccountName
    privateEndpointSubnetId: vnet.outputs.peSubnetId
    privateDnsZoneId: cosmosDnsZone.outputs.id
    principalId: userAssignedIdentity.outputs.principalId
    tags: allTags
  }
}

// Deploy Azure Managed Redis with Private Endpoint
module redis 'modules/managed-redis.bicep' = {
  name: 'redis-${deployment().name}'
  params: {
    location: location
    redisName: redisName
    redisSku: redisSku
    privateEndpointSubnetId: vnet.outputs.peSubnetId
    privateDnsZoneId: redisDnsZone.outputs.id
    principalId: userAssignedIdentity.outputs.principalId
    tags: allTags
  }
}

// Deploy WAF Policy for Front Door
module wafPolicy 'modules/waf-policy.bicep' = {
  name: 'waf-${deployment().name}'
  params: {
    wafPolicyName: wafPolicyName
    mode: 'Prevention'
    enabled: true
    tags: allTags
  }
}

// Outputs
@description('Container Registry login server')
output acrLoginServer string = acr.outputs.loginServer

@description('Container Registry name')
output acrName string = acr.outputs.name

@description('Container Apps Environment name')
output containerAppsEnvironmentName string = containerAppsEnv.outputs.name

@description('Container Apps Environment ID')
output containerAppsEnvironmentId string = containerAppsEnv.outputs.id

@description('Key Vault name')
output keyVaultName string = keyVault.outputs.name

@description('Key Vault URI')
output keyVaultUri string = keyVault.outputs.uri

@description('User Assigned Identity name')
output userAssignedIdentityName string = userAssignedIdentity.outputs.name

@description('User Assigned Identity ID')
output userAssignedIdentityId string = userAssignedIdentity.outputs.id

@description('User Assigned Identity Client ID')
output userAssignedIdentityClientId string = userAssignedIdentity.outputs.clientId

@description('Log Analytics Workspace ID')
output logAnalyticsWorkspaceId string = containerAppsEnv.outputs.logAnalyticsId

@description('Application Insights name')
output appInsightsName string = appInsights.outputs.name

@description('Application Insights connection string')
output appInsightsConnectionString string = appInsights.outputs.connectionString

@description('Virtual Network name')
output vnetName string = vnet.outputs.name

@description('Virtual Network ID')
output vnetId string = vnet.outputs.id

@description('Container Apps subnet ID')
output acaSubnetId string = vnet.outputs.acaSubnetId

@description('Private Endpoints subnet ID')
output peSubnetId string = vnet.outputs.peSubnetId

@description('Container Apps Environment default domain')
output containerAppsDefaultDomain string = containerAppsEnv.outputs.defaultDomain

@description('Container Apps Environment static IP (for internal environments)')
output containerAppsStaticIp string = containerAppsEnv.outputs.staticIp

@description('WAF Policy ID')
output wafPolicyId string = wafPolicy.outputs.id

@description('WAF Policy name')
output wafPolicyName string = wafPolicy.outputs.name

@description('Cosmos DB account name')
output cosmosAccountName string = cosmosDb.outputs.name

@description('Cosmos DB endpoint')
output cosmosEndpoint string = cosmosDb.outputs.endpoint

@description('Cosmos DB database name')
output cosmosDatabaseName string = cosmosDb.outputs.databaseName

@description('Cosmos DB container name')
output cosmosContainerName string = cosmosDb.outputs.containerName

@description('Cosmos DB reference container name')
output cosmosReferenceContainerName string = cosmosDb.outputs.referenceContainerName

@description('Redis cache name')
output redisName string = redis.outputs.name

@description('Redis cache hostname')
output redisHostName string = redis.outputs.hostName

@description('Redis cache port')
output redisPort int = redis.outputs.port
