// Production environment parameters
using './main.bicep'

param environment = 'prod'
param location = 'eastus'
param baseName = 'vnetplanner'
param tags = {
  costCenter: 'production'
}
