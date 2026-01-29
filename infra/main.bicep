// Main Bicep file for Azure VNet Planner Core Infrastructure
// Deploys: ACR, Container Apps Environment, Key Vault, User Assigned Managed Identity
// Note: Container App is deployed separately via deploy-app.sh after image is ready

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

@description('Tags for all resources')
param tags object = {}

// Computed names based on environment
var resourceSuffix = '${baseName}-${environment}'
var acrName = replace('acr${baseName}${environment}', '-', '')
var environmentName = 'cae-${resourceSuffix}'
var logAnalyticsName = 'log-${resourceSuffix}'
var keyVaultName = 'kv-${resourceSuffix}'
var identityName = 'id-${resourceSuffix}'

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

// Deploy Container Apps Environment
module containerAppsEnv 'modules/container-apps-environment.bicep' = {
  name: 'cae-${deployment().name}'
  params: {
    location: location
    environmentName: environmentName
    logAnalyticsName: logAnalyticsName
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
