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

@description('Resource ID of the Log Analytics workspace for diagnostics')
param logAnalyticsWorkspaceId string = ''

@description('Tags for the resources')
param tags object = {}

@description('Custom domain hostname for web endpoint (leave empty to skip)')
param customDomainWeb string = ''

@description('Custom domain hostname for API endpoint (leave empty to skip)')
param customDomainApi string = ''

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

// Custom Domain - Web (conditional)
resource webCustomDomain 'Microsoft.Cdn/profiles/customDomains@2024-02-01' = if (!empty(customDomainWeb)) {
  parent: frontDoorProfile
  name: replace(customDomainWeb, '.', '-')
  properties: {
    hostName: customDomainWeb
    tlsSettings: {
      certificateType: 'ManagedCertificate'
      minimumTlsVersion: 'TLS12'
    }
  }
}

// Custom Domain - API (conditional)
resource apiCustomDomain 'Microsoft.Cdn/profiles/customDomains@2024-02-01' = if (!empty(customDomainApi)) {
  parent: frontDoorProfile
  name: replace(customDomainApi, '.', '-')
  properties: {
    hostName: customDomainApi
    tlsSettings: {
      certificateType: 'ManagedCertificate'
      minimumTlsVersion: 'TLS12'
    }
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
      probePath: '/healthz'
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
      probePath: '/healthz'
      probeRequestType: 'HEAD'
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

// Static Assets Caching Rule Set
resource staticAssetsCacheRuleSet 'Microsoft.Cdn/profiles/ruleSets@2024-02-01' = {
  parent: frontDoorProfile
  name: 'StaticAssetsCaching'
}

// Static Assets Caching Rule - matches static paths and caches for 8 hours
resource staticAssetsCacheRule 'Microsoft.Cdn/profiles/ruleSets/rules@2024-02-01' = {
  parent: staticAssetsCacheRuleSet
  name: 'CacheStaticAssets'
  properties: {
    order: 1
    conditions: [
      {
        name: 'UrlPath'
        parameters: {
          typeName: 'DeliveryRuleUrlPathMatchConditionParameters'
          operator: 'BeginsWith'
          negateCondition: false
          matchValues: [
            '/_next/static/'
            '/fonts/'
            '/images/'
            '/assets/'
            '/public/'
          ]
          transforms: [
            'Lowercase'
          ]
        }
      }
    ]
    actions: [
      {
        name: 'RouteConfigurationOverride'
        parameters: {
          typeName: 'DeliveryRuleRouteConfigurationOverrideActionParameters'
          cacheConfiguration: {
            queryStringCachingBehavior: 'IgnoreQueryString'
            cacheBehavior: 'OverrideAlways'
            cacheDuration: '08:00:00'
            isCompressionEnabled: 'Enabled'
          }
        }
      }
    ]
    matchProcessingBehavior: 'Continue'
  }
}

// Web Route
// NOTE: staticAssetsCacheRuleSet is defined but not attached - can be re-enabled later
resource webRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2024-02-01' = {
  parent: webEndpoint
  name: 'web-route'
  properties: {
    originGroup: {
      id: webOriginGroup.id
    }
    customDomains: !empty(customDomainWeb) ? [
      {
        id: webCustomDomain.id
      }
    ] : []
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
    customDomains: !empty(customDomainApi) ? [
      {
        id: apiCustomDomain.id
      }
    ] : []
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

// Build custom domain references for security policy
var webCustomDomainRef = !empty(customDomainWeb) ? [{ id: webCustomDomain.id }] : []
var apiCustomDomainRef = !empty(customDomainApi) ? [{ id: apiCustomDomain.id }] : []

// Security Policy - Links WAF to endpoints and custom domains
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
          domains: concat(
            [
              { id: webEndpoint.id }
              { id: apiEndpoint.id }
            ],
            webCustomDomainRef,
            apiCustomDomainRef
          )
          patternsToMatch: [
            '/*'
          ]
        }
      ]
    }
  }
}

// Diagnostic Settings - Send all logs and metrics to Log Analytics
resource frontDoorDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (!empty(logAnalyticsWorkspaceId)) {
  name: 'send-to-log-analytics'
  scope: frontDoorProfile
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      {
        categoryGroup: 'allLogs'
        enabled: true
      }
      {
        categoryGroup: 'audit'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
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

@description('Web custom domain hostname (empty if not configured)')
output webCustomDomainHostname string = !empty(customDomainWeb) ? customDomainWeb : ''

@description('API custom domain hostname (empty if not configured)')
output apiCustomDomainHostname string = !empty(customDomainApi) ? customDomainApi : ''

@description('Web custom domain validation state')
output webCustomDomainValidationState string = webCustomDomain.?properties.domainValidationState ?? 'NotConfigured'

@description('API custom domain validation state')
output apiCustomDomainValidationState string = apiCustomDomain.?properties.domainValidationState ?? 'NotConfigured'
