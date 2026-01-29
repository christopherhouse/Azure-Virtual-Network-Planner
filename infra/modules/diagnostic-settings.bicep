// Diagnostic Settings Module
// Configures diagnostic settings for Azure resources to send logs and metrics to Log Analytics
// Uses resource names (not IDs) for proper existing resource resolution

@description('Name of the diagnostic setting')
param diagnosticSettingName string = 'send-to-log-analytics'

@description('Resource ID of the Log Analytics workspace')
param logAnalyticsWorkspaceId string

@description('Name of the Key Vault to configure diagnostics for')
param keyVaultName string = ''

@description('Name of the Container Registry to configure diagnostics for')
param acrName string = ''

@description('Name of the Container Apps Environment to configure diagnostics for')
param containerAppsEnvironmentName string = ''

// Key Vault Diagnostic Settings
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = if (!empty(keyVaultName)) {
  name: keyVaultName
}

resource keyVaultDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (!empty(keyVaultName)) {
  name: diagnosticSettingName
  scope: keyVault
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

// Container Registry Diagnostic Settings
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = if (!empty(acrName)) {
  name: acrName
}

resource acrDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (!empty(acrName)) {
  name: diagnosticSettingName
  scope: acr
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      {
        categoryGroup: 'allLogs'
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

// Container Apps Environment Diagnostic Settings
resource containerAppsEnv 'Microsoft.App/managedEnvironments@2024-03-01' existing = if (!empty(containerAppsEnvironmentName)) {
  name: containerAppsEnvironmentName
}

resource containerAppsEnvDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (!empty(containerAppsEnvironmentName)) {
  name: diagnosticSettingName
  scope: containerAppsEnv
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      {
        categoryGroup: 'allLogs'
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
