// Development environment parameters
using './main.bicep'

param environment = 'dev'
param location = 'eastus2'
param baseName = 'vnetplanner'
param tags = {
  costCenter: 'development'
}
