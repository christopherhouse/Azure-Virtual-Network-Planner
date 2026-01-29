// Azure Application Insights Module
// Deploys Application Insights linked to existing Log Analytics workspace

@description('Location for the Application Insights resource')
param location string = resourceGroup().location

@description('Name of the Application Insights resource')
param appInsightsName string

@description('Resource ID of the existing Log Analytics workspace')
param logAnalyticsWorkspaceId string

@description('Tags for the resources')
param tags object = {}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    Flow_Type: 'Bluefield'
    Request_Source: 'rest'
    WorkspaceResourceId: logAnalyticsWorkspaceId
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
    RetentionInDays: 30
  }
}

@description('Application Insights resource ID')
output id string = appInsights.id

@description('Application Insights name')
output name string = appInsights.name

@description('Application Insights connection string')
output connectionString string = appInsights.properties.ConnectionString

@description('Application Insights instrumentation key')
output instrumentationKey string = appInsights.properties.InstrumentationKey
