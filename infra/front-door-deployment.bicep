// Front Door Premium Deployment
// Deploy this AFTER container apps are deployed to set up the Front Door with Private Link origins
// Usage: az deployment group create -g <rg> -f front-door-deployment.bicep -p webAppHostname=<web-fqdn> apiAppHostname=<api-fqdn> ...

targetScope = 'resourceGroup'

@description('Environment name (dev, prod)')
@allowed([
  'dev'
  'prod'
])
param environment string

@description('Location for resources that support location')
param location string = resourceGroup().location

@description('Base name for resources')
param baseName string = 'vnetplanner'

@description('Hostname (FQDN) of the web container app')
param webAppHostname string

@description('Hostname (FQDN) of the API container app')
param apiAppHostname string

@description('Resource ID of the Container Apps Environment')
param containerAppsEnvironmentId string

@description('Resource ID of the WAF Policy')
param wafPolicyId string

@description('Resource ID of the Log Analytics workspace for diagnostics')
param logAnalyticsWorkspaceId string = ''

@description('Tags for all resources')
param tags object = {}

// Computed names
var resourceSuffix = '${baseName}-${environment}'
var frontDoorName = 'afd-${resourceSuffix}'

// Merge default tags
var defaultTags = {
  environment: environment
  application: 'azure-vnet-planner'
  managedBy: 'bicep'
}
var allTags = union(defaultTags, tags)

// Deploy Front Door Premium with Private Link origins
module frontDoor 'modules/front-door.bicep' = {
  name: 'afd-${deployment().name}'
  params: {
    frontDoorName: frontDoorName
    webAppHostname: webAppHostname
    apiAppHostname: apiAppHostname
    containerAppsEnvironmentId: containerAppsEnvironmentId
    containerAppsLocation: location
    wafPolicyId: wafPolicyId
    logAnalyticsWorkspaceId: logAnalyticsWorkspaceId
    tags: allTags
  }
}

// Outputs
@description('Front Door profile name')
output frontDoorName string = frontDoor.outputs.name

@description('Front Door profile ID')
output frontDoorId string = frontDoor.outputs.id

@description('Web endpoint hostname (use this URL to access the web app)')
output webEndpointHostname string = frontDoor.outputs.webEndpointHostname

@description('API endpoint hostname (use this URL to access the API)')
output apiEndpointHostname string = frontDoor.outputs.apiEndpointHostname

@description('Front Door ID for header validation')
output frontDoorHeaderId string = frontDoor.outputs.frontDoorId
