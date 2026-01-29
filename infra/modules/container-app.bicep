// Azure Container App Module
// Deploys a Container App with User Assigned Managed Identity
// Single revision mode with HTTP scaling (50 concurrent requests, max 4 instances)

@description('Location for the Container App')
param location string = resourceGroup().location

@description('Name of the Container App')
param containerAppName string

@description('Container Apps Environment ID')
param environmentId string

@description('Container image to deploy')
param containerImage string

@description('ACR login server')
param acrLoginServer string

@description('User Assigned Managed Identity resource ID')
param userAssignedIdentityId string

@description('Target port the container listens on')
param targetPort int = 3000

@description('CPU cores for the container')
param cpu string = '0.5'

@description('Memory for the container')
param memory string = '1Gi'

@description('Minimum number of replicas')
param minReplicas int = 0

@description('Maximum number of replicas (max 4 for HTTP scaling)')
@maxValue(4)
param maxReplicas int = 4

@description('Environment variables for the container')
param envVars array = []

@description('Application Insights connection string (optional)')
param appInsightsConnectionString string = ''

@description('Tags for the resources')
param tags object = {}

// Build environment variables array with App Insights if provided
var baseEnvVars = envVars
var appInsightsEnvVar = !empty(appInsightsConnectionString) ? [
  {
    name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
    value: appInsightsConnectionString
  }
  {
    name: 'NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING'
    value: appInsightsConnectionString
  }
] : []
var allEnvVars = concat(baseEnvVars, appInsightsEnvVar)

resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: containerAppName
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${userAssignedIdentityId}': {}
    }
  }
  properties: {
    managedEnvironmentId: environmentId
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: targetPort
        transport: 'auto'
        allowInsecure: false
      }
      registries: [
        {
          server: acrLoginServer
          identity: userAssignedIdentityId
        }
      ]
    }
    template: {
      containers: [
        {
          name: containerAppName
          image: containerImage
          resources: {
            cpu: json(cpu)
            memory: memory
          }
          env: allEnvVars
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

@description('Container App FQDN')
output fqdn string = containerApp.properties.configuration.ingress.fqdn

@description('Container App URL')
output url string = 'https://${containerApp.properties.configuration.ingress.fqdn}'

@description('Container App resource ID')
output id string = containerApp.id

@description('Container App name')
output name string = containerApp.name
