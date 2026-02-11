// Azure Virtual Network Module
// Deploys a Virtual Network with subnets for Azure Container Apps and Private Endpoints

@description('Location for the Virtual Network')
param location string = resourceGroup().location

@description('Name of the Virtual Network')
param vnetName string

@description('Address space for the Virtual Network')
param addressPrefix string = '10.0.0.0/23'

@description('Name of the Container Apps subnet')
param acaSubnetName string = 'snet-aca'

@description('Address prefix for the Container Apps subnet')
param acaSubnetPrefix string = '10.0.0.0/25'

@description('Name of the Private Endpoints subnet')
param peSubnetName string = 'snet-pe'

@description('Address prefix for the Private Endpoints subnet')
param peSubnetPrefix string = '10.0.0.128/27'

@description('Resource ID of the NSG for the Container Apps subnet')
param acaNsgId string

@description('Resource ID of the NSG for the Private Endpoints subnet')
param peNsgId string

@description('Tags for the resources')
param tags object = {}

resource vnet 'Microsoft.Network/virtualNetworks@2024-01-01' = {
  name: vnetName
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        addressPrefix
      ]
    }
    subnets: [
      {
        name: acaSubnetName
        properties: {
          addressPrefix: acaSubnetPrefix
          networkSecurityGroup: {
            id: acaNsgId
          }
          delegations: [
            {
              name: 'Microsoft.App.environments'
              properties: {
                serviceName: 'Microsoft.App/environments'
              }
            }
          ]
        }
      }
      {
        name: peSubnetName
        properties: {
          addressPrefix: peSubnetPrefix
          networkSecurityGroup: {
            id: peNsgId
          }
          privateEndpointNetworkPolicies: 'Disabled'
        }
      }
    ]
  }
}

@description('Virtual Network resource ID')
output id string = vnet.id

@description('Virtual Network name')
output name string = vnet.name

@description('Container Apps subnet resource ID')
output acaSubnetId string = vnet.properties.subnets[0].id

@description('Container Apps subnet name')
output acaSubnetName string = vnet.properties.subnets[0].name

@description('Private Endpoints subnet resource ID')
output peSubnetId string = vnet.properties.subnets[1].id

@description('Private Endpoints subnet name')
output peSubnetName string = vnet.properties.subnets[1].name
