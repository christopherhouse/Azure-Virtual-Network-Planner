// User Assigned Managed Identity Module
// Deploys a UAMI and assigns Key Vault Secrets User role

@description('Location for the identity')
param location string = resourceGroup().location

@description('Name of the user assigned managed identity')
param identityName string

@description('Key Vault resource ID for role assignment')
param keyVaultId string

@description('Tags for the resources')
param tags object = {}

// Built-in role definition IDs
var keyVaultSecretsUserRoleId = '4633458b-17de-408a-b874-0445c86b69e6'

resource userAssignedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: identityName
  location: location
  tags: tags
}

// Assign Key Vault Secrets User role to the UAMI
resource keyVaultRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVaultId, userAssignedIdentity.id, keyVaultSecretsUserRoleId)
  scope: keyVault
  properties: {
    principalId: userAssignedIdentity.properties.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', keyVaultSecretsUserRoleId)
    principalType: 'ServicePrincipal'
  }
}

// Reference to Key Vault for scoping the role assignment
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: last(split(keyVaultId, '/'))
}

@description('User Assigned Identity resource ID')
output id string = userAssignedIdentity.id

@description('User Assigned Identity name')
output name string = userAssignedIdentity.name

@description('User Assigned Identity principal ID')
output principalId string = userAssignedIdentity.properties.principalId

@description('User Assigned Identity client ID')
output clientId string = userAssignedIdentity.properties.clientId
