// Azure Container Apps Environment Module
// Deploys a Workload Profiles Container Apps Environment with VNet integration

@description('Location for the Container Apps Environment')
param location string = resourceGroup().location

@description('Name of the Container Apps Environment')
param environmentName string

@description('Name of the Log Analytics workspace')
param logAnalyticsName string

@description('Resource ID of the infrastructure subnet for Container Apps')
param infrastructureSubnetId string = ''

@description('Whether to enable VNet integration')
param vnetIntegrationEnabled bool = false

@description('Whether to disable public network access (internal only)')
param internalOnly bool = false

@description('Enable zone redundancy')
param zoneRedundant bool = false

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

// Container Apps Environment - Workload Profiles with optional VNet integration
resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: environmentName
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'azure-monitor'
    }
    zoneRedundant: zoneRedundant
    workloadProfiles: [
      {
        name: 'Consumption'
        workloadProfileType: 'Consumption'
      }
    ]
    vnetConfiguration: vnetIntegrationEnabled ? {
      infrastructureSubnetId: infrastructureSubnetId
      internal: internalOnly
    } : null
  }
}

@description('Container Apps Environment resource ID')
output id string = containerAppsEnvironment.id

@description('Container Apps Environment name')
output name string = containerAppsEnvironment.name

@description('Container Apps Environment default domain')
output defaultDomain string = containerAppsEnvironment.properties.defaultDomain

@description('Container Apps Environment static IP (available when VNet integrated)')
output staticIp string = vnetIntegrationEnabled ? containerAppsEnvironment.properties.staticIp : ''

@description('Log Analytics workspace ID')
output logAnalyticsId string = logAnalytics.id
