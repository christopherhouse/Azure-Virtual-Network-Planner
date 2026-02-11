// Azure Network Security Group Module
// Deploys a Network Security Group with default rules

@description('Location for the Network Security Group')
param location string = resourceGroup().location

@description('Name of the Network Security Group')
param nsgName string

@description('Security rules to add to the NSG')
param securityRules array = []

@description('Tags for the resources')
param tags object = {}

resource nsg 'Microsoft.Network/networkSecurityGroups@2024-01-01' = {
  name: nsgName
  location: location
  tags: tags
  properties: {
    securityRules: securityRules
  }
}

@description('Network Security Group resource ID')
output id string = nsg.id

@description('Network Security Group name')
output name string = nsg.name
