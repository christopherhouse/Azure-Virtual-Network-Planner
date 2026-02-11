// Private DNS Zone with VNet link for Azure Private Endpoints
// Reusable module for various Azure services

@description('Private DNS zone name (e.g., privatelink.documents.azure.com for Cosmos DB)')
param zoneName string

@description('Virtual Network ID to link')
param vnetId string

@description('Virtual Network name for the link resource name')
param vnetName string

@description('Enable auto-registration of VM records')
param registrationEnabled bool = false

@description('Tags for all resources')
param tags object = {}

// Private DNS Zone
resource privateDnsZone 'Microsoft.Network/privateDnsZones@2024-06-01' = {
  name: zoneName
  location: 'global'
  tags: tags
}

// VNet Link
resource vnetLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2024-06-01' = {
  parent: privateDnsZone
  name: '${vnetName}-link'
  location: 'global'
  tags: tags
  properties: {
    virtualNetwork: {
      id: vnetId
    }
    registrationEnabled: registrationEnabled
  }
}

// Outputs
@description('Private DNS Zone ID')
output id string = privateDnsZone.id

@description('Private DNS Zone name')
output name string = privateDnsZone.name

@description('VNet Link ID')
output vnetLinkId string = vnetLink.id
