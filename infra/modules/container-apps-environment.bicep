// Azure Container Apps Environment Module
// Deploys a Container Apps Environment with Log Analytics workspace

@description('Location for the Container Apps Environment')
param location string = resourceGroup().location

@description('Name of the Container Apps Environment')
param environmentName string

@description('Name of the Log Analytics workspace')
param logAnalyticsName string

@description('Tags for the resources')
param tags object = {}

// Log Analytics Workspace for Container Apps
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Container Apps Environment
resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: environmentName
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'azure-monitor'
    }
    zoneRedundant: false
  }
}

@description('Container Apps Environment resource ID')
output id string = containerAppsEnvironment.id

@description('Container Apps Environment name')
output name string = containerAppsEnvironment.name

@description('Container Apps Environment default domain')
output defaultDomain string = containerAppsEnvironment.properties.defaultDomain

@description('Log Analytics workspace ID')
output logAnalyticsId string = logAnalytics.id
