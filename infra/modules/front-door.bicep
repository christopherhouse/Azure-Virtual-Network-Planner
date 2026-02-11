// Azure Front Door Premium Module
// Deploys Front Door Premium with Private Link origins for Container Apps

@description('Name of the Front Door profile')
param frontDoorName string

@description('Name of the web endpoint')
param webEndpointName string = 'web'

@description('Name of the API endpoint')
param apiEndpointName string = 'api'

@description('Hostname of the web container app')
param webAppHostname string

@description('Hostname of the API container app')
param apiAppHostname string

@description('Resource ID of the Container Apps Environment for Private Link')
param containerAppsEnvironmentId string

@description('Location of the Container Apps Environment (for Private Link region)')
param containerAppsLocation string

@description('Resource ID of the WAF policy to associate')
param wafPolicyId string

@description('Tags for the resources')
param tags object = {}

// Front Door Premium Profile
resource frontDoorProfile 'Microsoft.Cdn/profiles@2024-02-01' = {
  name: frontDoorName
  location: 'Global'
  tags: tags
  sku: {
    name: 'Premium_AzureFrontDoor'
  }
  properties: {
    originResponseTimeoutSeconds: 60
  }
}

// Web Endpoint
resource webEndpoint 'Microsoft.Cdn/profiles/afdEndpoints@2024-02-01' = {
  parent: frontDoorProfile
  name: webEndpointName
  location: 'Global'
  properties: {
    enabledState: 'Enabled'
  }
}

// API Endpoint
resource apiEndpoint 'Microsoft.Cdn/profiles/afdEndpoints@2024-02-01' = {
  parent: frontDoorProfile
  name: apiEndpointName
  location: 'Global'
  properties: {
    enabledState: 'Enabled'
  }
}

// Web Origin Group
resource webOriginGroup 'Microsoft.Cdn/profiles/originGroups@2024-02-01' = {
  parent: frontDoorProfile
  name: 'web-origin-group'
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
      additionalLatencyInMilliseconds: 50
    }
    healthProbeSettings: {
      probePath: '/'
      probeRequestType: 'HEAD'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 60
    }
    sessionAffinityState: 'Disabled'
  }
}

// API Origin Group
resource apiOriginGroup 'Microsoft.Cdn/profiles/originGroups@2024-02-01' = {
  parent: frontDoorProfile
  name: 'api-origin-group'
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
      additionalLatencyInMilliseconds: 50
    }
    healthProbeSettings: {
      probePath: '/health'
      probeRequestType: 'GET'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 60
    }
    sessionAffinityState: 'Disabled'
  }
}

// Web Origin with Private Link
resource webOrigin 'Microsoft.Cdn/profiles/originGroups/origins@2024-02-01' = {
  parent: webOriginGroup
  name: 'web-origin'
  properties: {
    hostName: webAppHostname
    httpPort: 80
    httpsPort: 443
    originHostHeader: webAppHostname
    priority: 1
    weight: 1000
    enabledState: 'Enabled'
    sharedPrivateLinkResource: {
      privateLink: {
        id: containerAppsEnvironmentId
      }
      privateLinkLocation: containerAppsLocation
      groupId: 'managedEnvironments'
      requestMessage: 'AFD Private Link Request - Web'
    }
  }
}

// API Origin with Private Link
resource apiOrigin 'Microsoft.Cdn/profiles/originGroups/origins@2024-02-01' = {
  parent: apiOriginGroup
  name: 'api-origin'
  properties: {
    hostName: apiAppHostname
    httpPort: 80
    httpsPort: 443
    originHostHeader: apiAppHostname
    priority: 1
    weight: 1000
    enabledState: 'Enabled'
    sharedPrivateLinkResource: {
      privateLink: {
        id: containerAppsEnvironmentId
      }
      privateLinkLocation: containerAppsLocation
      groupId: 'managedEnvironments'
      requestMessage: 'AFD Private Link Request - API'
    }
  }
}

// Web Route
resource webRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2024-02-01' = {
  parent: webEndpoint
  name: 'web-route'
  properties: {
    originGroup: {
      id: webOriginGroup.id
    }
    supportedProtocols: [
      'Http'
      'Https'
    ]
    patternsToMatch: [
      '/*'
    ]
    forwardingProtocol: 'HttpsOnly'
    linkToDefaultDomain: 'Enabled'
    httpsRedirect: 'Enabled'
    enabledState: 'Enabled'
  }
  dependsOn: [
    webOrigin
  ]
}

// API Route
resource apiRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2024-02-01' = {
  parent: apiEndpoint
  name: 'api-route'
  properties: {
    originGroup: {
      id: apiOriginGroup.id
    }
    supportedProtocols: [
      'Http'
      'Https'
    ]
    patternsToMatch: [
      '/*'
    ]
    forwardingProtocol: 'HttpsOnly'
    linkToDefaultDomain: 'Enabled'
    httpsRedirect: 'Enabled'
    enabledState: 'Enabled'
  }
  dependsOn: [
    apiOrigin
  ]
}

// Security Policy - Links WAF to endpoints
resource securityPolicy 'Microsoft.Cdn/profiles/securityPolicies@2024-02-01' = {
  parent: frontDoorProfile
  name: 'waf-security-policy'
  properties: {
    parameters: {
      type: 'WebApplicationFirewall'
      wafPolicy: {
        id: wafPolicyId
      }
      associations: [
        {
          domains: [
            {
              id: webEndpoint.id
            }
            {
              id: apiEndpoint.id
            }
          ]
          patternsToMatch: [
            '/*'
          ]
        }
      ]
    }
  }
}

// Outputs
@description('Front Door profile resource ID')
output id string = frontDoorProfile.id

@description('Front Door profile name')
output name string = frontDoorProfile.name

@description('Web endpoint hostname')
output webEndpointHostname string = webEndpoint.properties.hostName

@description('API endpoint hostname')
output apiEndpointHostname string = apiEndpoint.properties.hostName

@description('Front Door profile ID (for X-Azure-FDID header validation)')
output frontDoorId string = frontDoorProfile.properties.frontDoorId
