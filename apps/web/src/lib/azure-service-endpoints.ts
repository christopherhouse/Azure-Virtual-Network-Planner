// Azure Service Endpoint Options
// Reference: https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-service-endpoints-overview

import { ServiceEndpointOption } from '@/types';

export const AZURE_SERVICE_ENDPOINTS: ServiceEndpointOption[] = [
  {
    id: 'storage',
    name: 'Azure Storage',
    service: 'Microsoft.Storage',
    description: 'Secure access to Azure Storage accounts',
  },
  {
    id: 'storage-global',
    name: 'Azure Storage (Global)',
    service: 'Microsoft.Storage.Global',
    description: 'Global endpoint for Azure Storage',
  },
  {
    id: 'sql',
    name: 'Azure SQL Database',
    service: 'Microsoft.Sql',
    description: 'Secure access to Azure SQL Database and Synapse',
  },
  {
    id: 'cosmos-db',
    name: 'Azure Cosmos DB',
    service: 'Microsoft.AzureCosmosDB',
    description: 'Secure access to Azure Cosmos DB',
  },
  {
    id: 'keyvault',
    name: 'Azure Key Vault',
    service: 'Microsoft.KeyVault',
    description: 'Secure access to Azure Key Vault',
  },
  {
    id: 'servicebus',
    name: 'Azure Service Bus',
    service: 'Microsoft.ServiceBus',
    description: 'Secure access to Azure Service Bus',
  },
  {
    id: 'eventhub',
    name: 'Azure Event Hubs',
    service: 'Microsoft.EventHub',
    description: 'Secure access to Azure Event Hubs',
  },
  {
    id: 'acr',
    name: 'Azure Container Registry',
    service: 'Microsoft.ContainerRegistry',
    description: 'Secure access to Azure Container Registry',
  },
  {
    id: 'app-service',
    name: 'Azure App Service',
    service: 'Microsoft.Web',
    description: 'Secure access to Azure App Service',
  },
  {
    id: 'cognitive',
    name: 'Azure Cognitive Services',
    service: 'Microsoft.CognitiveServices',
    description: 'Secure access to Azure Cognitive Services',
  },
  {
    id: 'azure-ad',
    name: 'Microsoft Entra ID',
    service: 'Microsoft.AzureActiveDirectory',
    description: 'Secure access to Microsoft Entra ID',
  },
];

/**
 * Get service endpoint by ID
 */
export function getServiceEndpointById(id: string): ServiceEndpointOption | undefined {
  return AZURE_SERVICE_ENDPOINTS.find(se => se.id === id);
}

/**
 * Get service endpoint by service name
 */
export function getServiceEndpointByService(service: string): ServiceEndpointOption | undefined {
  return AZURE_SERVICE_ENDPOINTS.find(se => se.service === service);
}

/**
 * Get multiple service endpoints by IDs
 */
export function getServiceEndpointsByIds(ids: string[]): ServiceEndpointOption[] {
  return ids
    .map(id => getServiceEndpointById(id))
    .filter((se): se is ServiceEndpointOption => !!se);
}
