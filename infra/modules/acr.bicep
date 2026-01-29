// Azure Container Registry Module
// Deploys an Azure Container Registry for storing container images

@description('Location for the Container Registry')
param location string = resourceGroup().location

@description('Name of the Container Registry')
param acrName string

@description('SKU for the Container Registry')
@allowed([
  'Basic'
  'Standard'
  'Premium'
])
param sku string = 'Basic'

@description('Enable admin user for the Container Registry')
param adminUserEnabled bool = true

@description('Tags for the resources')
param tags object = {}

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  tags: tags
  sku: {
    name: sku
  }
  properties: {
    adminUserEnabled: adminUserEnabled
    publicNetworkAccess: 'Enabled'
  }
}

@description('Container Registry login server')
output loginServer string = acr.properties.loginServer

@description('Container Registry resource ID')
output id string = acr.id

@description('Container Registry name')
output name string = acr.name
