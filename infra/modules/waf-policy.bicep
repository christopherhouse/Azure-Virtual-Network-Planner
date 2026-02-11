// Azure Front Door WAF Policy Module
// Deploys a WAF policy with managed rule sets for Front Door Premium

@description('Name of the WAF policy')
param wafPolicyName string

@description('WAF policy mode')
@allowed([
  'Detection'
  'Prevention'
])
param mode string = 'Prevention'

@description('Enable the WAF policy')
param enabled bool = true

@description('Enable request body inspection')
param requestBodyCheck bool = true

@description('Tags for the resources')
param tags object = {}

resource wafPolicy 'Microsoft.Network/FrontDoorWebApplicationFirewallPolicies@2024-02-01' = {
  name: wafPolicyName
  location: 'Global'
  tags: tags
  sku: {
    name: 'Premium_AzureFrontDoor'
  }
  properties: {
    policySettings: {
      enabledState: enabled ? 'Enabled' : 'Disabled'
      mode: mode
      requestBodyCheck: requestBodyCheck ? 'Enabled' : 'Disabled'
    }
    managedRules: {
      managedRuleSets: [
        {
          ruleSetType: 'Microsoft_DefaultRuleSet'
          ruleSetVersion: '2.1'
          ruleSetAction: 'Block'
        }
        {
          ruleSetType: 'Microsoft_BotManagerRuleSet'
          ruleSetVersion: '1.1'
        }
      ]
    }
  }
}

@description('WAF Policy resource ID')
output id string = wafPolicy.id

@description('WAF Policy name')
output name string = wafPolicy.name
