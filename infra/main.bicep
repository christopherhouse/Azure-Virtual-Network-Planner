// Main Bicep file for Azure VNet Planner Infrastructure
// Deploys ACR, Container Apps Environment, and Container App

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

@description('Container image tag')
param imageTag string = 'latest'

@description('Tags for all resources')
param tags object = {}

// Computed names based on environment
var resourceSuffix = '${baseName}-${environment}'
var acrName = replace('acr${baseName}${environment}', '-', '')
var environmentName = 'cae-${resourceSuffix}'
var logAnalyticsName = 'log-${resourceSuffix}'
var containerAppName = 'ca-${resourceSuffix}'

// Merge default tags with provided tags
var defaultTags = {
  environment: environment
  application: 'azure-vnet-planner'
  managedBy: 'bicep'
}
var allTags = union(defaultTags, tags)

// Deploy Container Registry
module acr 'modules/acr.bicep' = {
  name: 'acr-deployment'
  params: {
    location: location
    acrName: acrName
    sku: environment == 'prod' ? 'Standard' : 'Basic'
    adminUserEnabled: true
    tags: allTags
  }
}

// Deploy Container Apps Environment
module containerAppsEnv 'modules/container-apps-environment.bicep' = {
  name: 'cae-deployment'
  params: {
    location: location
    environmentName: environmentName
    logAnalyticsName: logAnalyticsName
    tags: allTags
  }
}

// Get ACR credentials for Container App
resource acrResource 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = {
  name: acrName
  dependsOn: [
    acr
  ]
}

// Deploy Container App
module containerApp 'modules/container-app.bicep' = {
  name: 'ca-deployment'
  params: {
    location: location
    containerAppName: containerAppName
    environmentId: containerAppsEnv.outputs.id
    containerImage: '${acr.outputs.loginServer}/${baseName}:${imageTag}'
    acrLoginServer: acr.outputs.loginServer
    acrUsername: acrResource.listCredentials().username
    acrPassword: acrResource.listCredentials().passwords[0].value
    targetPort: 3000
    cpu: environment == 'prod' ? '1' : '0.5'
    memory: environment == 'prod' ? '2Gi' : '1Gi'
    minReplicas: environment == 'prod' ? 1 : 0
    maxReplicas: environment == 'prod' ? 10 : 3
    envVars: [
      {
        name: 'NODE_ENV'
        value: environment == 'prod' ? 'production' : 'development'
      }
    ]
    tags: allTags
  }
  dependsOn: [
    acr
  ]
}

// Outputs
@description('Container Registry login server')
output acrLoginServer string = acr.outputs.loginServer

@description('Container Registry name')
output acrName string = acr.outputs.name

@description('Container Apps Environment name')
output containerAppsEnvironmentName string = containerAppsEnv.outputs.name

@description('Container App URL')
output containerAppUrl string = containerApp.outputs.url

@description('Container App FQDN')
output containerAppFqdn string = containerApp.outputs.fqdn
