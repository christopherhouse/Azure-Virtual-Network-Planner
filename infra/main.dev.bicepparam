// Development environment parameters
using './main.bicep'

param environment = 'dev'
param location = 'eastus'
param baseName = 'vnetplanner'
param imageTag = 'latest'
param tags = {
  costCenter: 'development'
}
