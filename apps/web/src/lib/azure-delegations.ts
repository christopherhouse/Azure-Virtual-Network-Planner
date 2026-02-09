// Azure Delegation Options
// Reference: https://learn.microsoft.com/en-us/azure/virtual-network/subnet-delegation-overview

import { DelegationOption } from '@/types';

export const AZURE_DELEGATIONS: DelegationOption[] = [
  {
    id: 'aci',
    name: 'Container Instances',
    serviceName: 'Microsoft.ContainerInstance/containerGroups',
    description: 'Azure Container Instances',
  },
  {
    id: 'aks',
    name: 'Kubernetes Service',
    serviceName: 'Microsoft.ContainerService/managedClusters',
    description: 'Azure Kubernetes Service',
  },
  {
    id: 'app-service',
    name: 'App Service',
    serviceName: 'Microsoft.Web/serverFarms',
    description: 'Azure App Service / Functions VNet Integration',
  },
  {
    id: 'api-management',
    name: 'API Management',
    serviceName: 'Microsoft.ApiManagement/service',
    description: 'Azure API Management',
  },
  {
    id: 'batch',
    name: 'Batch',
    serviceName: 'Microsoft.Batch/batchAccounts',
    description: 'Azure Batch',
  },
  {
    id: 'cosmos-db',
    name: 'Cosmos DB',
    serviceName: 'Microsoft.DocumentDB/databaseAccounts',
    description: 'Azure Cosmos DB',
  },
  {
    id: 'databricks',
    name: 'Databricks',
    serviceName: 'Microsoft.Databricks/workspaces',
    description: 'Azure Databricks',
  },
  {
    id: 'data-factory',
    name: 'Data Factory',
    serviceName: 'Microsoft.DataFactory/factories',
    description: 'Azure Data Factory managed VNet',
  },
  {
    id: 'hdinsight',
    name: 'HDInsight',
    serviceName: 'Microsoft.HDInsight/clusters',
    description: 'Azure HDInsight',
  },
  {
    id: 'logic-apps',
    name: 'Logic Apps',
    serviceName: 'Microsoft.Web/hostingEnvironments',
    description: 'Azure Logic Apps (ISE)',
  },
  {
    id: 'machine-learning',
    name: 'Machine Learning',
    serviceName: 'Microsoft.MachineLearningServices/workspaces',
    description: 'Azure Machine Learning',
  },
  {
    id: 'mysql-flexible',
    name: 'MySQL Flexible Server',
    serviceName: 'Microsoft.DBforMySQL/flexibleServers',
    description: 'Azure Database for MySQL Flexible Server',
  },
  {
    id: 'netapp',
    name: 'NetApp Files',
    serviceName: 'Microsoft.NetApp/volumes',
    description: 'Azure NetApp Files',
  },
  {
    id: 'postgresql-flexible',
    name: 'PostgreSQL Flexible Server',
    serviceName: 'Microsoft.DBforPostgreSQL/flexibleServers',
    description: 'Azure Database for PostgreSQL Flexible Server',
  },
  {
    id: 'power-platform',
    name: 'Power Platform',
    serviceName: 'Microsoft.PowerPlatform/vnetaccesslinks',
    description: 'Microsoft Power Platform',
  },
  {
    id: 'redis',
    name: 'Redis Enterprise',
    serviceName: 'Microsoft.Cache/redisEnterprise',
    description: 'Azure Cache for Redis Enterprise',
  },
  {
    id: 'sql-managed',
    name: 'SQL Managed Instance',
    serviceName: 'Microsoft.Sql/managedInstances',
    description: 'Azure SQL Managed Instance',
  },
  {
    id: 'storage-hpc',
    name: 'HPC Cache',
    serviceName: 'Microsoft.StorageCache/amlFilesystems',
    description: 'Azure HPC Cache',
  },
  {
    id: 'synapse',
    name: 'Synapse Analytics',
    serviceName: 'Microsoft.Synapse/workspaces',
    description: 'Azure Synapse Analytics',
  },
  {
    id: 'virtual-wan',
    name: 'Virtual WAN',
    serviceName: 'Microsoft.Network/virtualHubs',
    description: 'Azure Virtual WAN Hub',
  },
];

/**
 * Get delegation by ID
 */
export function getDelegationById(id: string): DelegationOption | undefined {
  return AZURE_DELEGATIONS.find(d => d.id === id);
}

/**
 * Get delegation by service name
 */
export function getDelegationByServiceName(serviceName: string): DelegationOption | undefined {
  return AZURE_DELEGATIONS.find(d => d.serviceName === serviceName);
}
