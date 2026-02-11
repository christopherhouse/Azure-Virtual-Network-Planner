# Network Hardening Plan

## Goal
Secure Azure Container Apps with VNet integration, private ingress, and Azure Front Door Premium as the public entry point with WAF protection.

## Requirements Summary
- VNet: 10.0.0.0/23
- ACA Subnet: /25 (128 addresses) with Microsoft.App/environments delegation
- PE Subnet: /27 (32 addresses) - unused for now
- NSGs: Default rules for both subnets
- Container Apps Environment: Workload Profiles (Consumption profile), private, VNet integrated
- Azure Front Door: Premium tier with Private Link to ACA
- WAF Policy: DRS 2.1 + Bot Manager 1.0, Prevention mode
- Keep ACR public

## Network Design

```
VNet: vnet-vnetplanner-{env} (10.0.0.0/23)
├── snet-aca: 10.0.0.0/25 (128 addresses)
│   └── Delegation: Microsoft.App/environments
│   └── NSG: nsg-aca-{env}
└── snet-pe: 10.0.0.128/27 (32 addresses)
    └── NSG: nsg-pe-{env}
```

## Decomposed Steps

| Step | Task | Specialist | Status |
|------|------|------------|--------|
| 1 | Create `vnet.bicep` module | 🏗️ Stratus | ✅ complete |
| 2 | Create `nsg.bicep` module | 🏗️ Stratus | ✅ complete |
| 3 | Update `container-apps-environment.bicep` for Workload Profiles + VNet | 🏗️ Stratus | ✅ complete |
| 4 | Create `waf-policy.bicep` module (DRS 2.1 + Bot Manager) | 🏗️ Stratus | ✅ complete |
| 5 | Create `front-door.bicep` module (Premium, Private Link origins) | 🏗️ Stratus | ✅ complete |
| 6 | Update `main.bicep` to wire VNet → NSGs → ACA Env → WAF | 🏗️ Stratus | ✅ complete |
| 7 | Update `container-app.bicep` for internal ingress support | 🏗️ Stratus | ✅ complete |
| 8 | Update parameter files | 🏗️ Stratus | ✅ complete |
| 9 | Update CI/CD workflow with Front Door deployment + Private Link approval | 🏗️ Stratus | ✅ complete |

## Key Decisions
- Front Door Premium required for Private Link to ACA origins
- Workload Profiles environment with Consumption profile (not Consumption-only)
- /25 subnet for ACA gives ~570 max replicas headroom
- WAF in Prevention mode from start (can tune later)
- DRS 2.1 chosen over 2.2 (2.2 has PL2 rules disabled by default, adds complexity)

## Dependencies
- Step 1-2 can be parallel (VNet and NSG modules)
- Step 3 depends on 1, 2 (needs subnet and NSG references)
- Step 4-5 can be parallel (WAF and AFD modules)
- Step 6 depends on 1-5 (wires everything together)
- Step 7 can be parallel with 6
- Step 8 depends on all modules being created

## Notes
- User will delete existing ACA environment before reprovisioning
- ACR stays public for now
- PE subnet reserved for future use
