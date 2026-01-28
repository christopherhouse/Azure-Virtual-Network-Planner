# Azure VNet Planner - Execution Plan

**Goal:** Build a modern Next.js application for planning Azure virtual networks and subnet sizes, with infrastructure deployment to Azure Container Apps via GitHub Actions CI/CD.

**Created:** 2026-01-28
**Status:** Planning Complete - Ready for Execution

---

## Project Overview

A single-page application that provides:
- Visual subnet calculator with split/join capabilities
- Multi-VNet project management with local storage persistence
- Azure-aware subnet validation and templates
- Export to ARM, Bicep, or Terraform
- Modern, responsive UI with light/dark theme

**Deployment:** Azure Container Apps (dev + prod environments)

---

## Execution Steps

### Phase 1: Project Foundation
| Step | Task | Specialist | Complexity | Status |
|------|------|-----------|------------|--------|
| 1.1 | Initialize Next.js project with TypeScript, Tailwind CSS, shadcn/ui | 🎼 Conductor | Simple | ⬜ Pending |
| 1.2 | Set up project structure (components, hooks, utils, types) | 🎼 Conductor | Simple | ⬜ Pending |
| 1.3 | Implement core subnet math utilities (CIDR parsing, splitting, validation) | 🎼 Conductor | Medium | ⬜ Pending |

### Phase 2: Core Application Features
| Step | Task | Specialist | Complexity | Status |
|------|------|-----------|------------|--------|
| 2.1 | Build subnet visualization component (interactive split/join) | 🎼 Conductor | Complex | ⬜ Pending |
| 2.2 | Implement subnet configuration panel (name, description, delegation, service endpoints) | 🎼 Conductor | Medium | ⬜ Pending |
| 2.3 | Create Azure subnet templates (Bastion, Firewall, Gateway, etc.) | 🎼 Conductor | Medium | ⬜ Pending |
| 2.4 | Build VNet management (add/edit/delete VNets with name/region) | 🎼 Conductor | Medium | ⬜ Pending |
| 2.5 | Implement project management with local storage persistence | 🎼 Conductor | Medium | ⬜ Pending |

### Phase 3: Export & Polish
| Step | Task | Specialist | Complexity | Status |
|------|------|-----------|------------|--------|
| 3.1 | Build template export engine (ARM, Bicep, Terraform) | 🎼 Conductor | Complex | ⬜ Pending |
| 3.2 | Implement light/dark theme toggle | 🎼 Conductor | Simple | ⬜ Pending |
| 3.3 | Responsive design refinement and mobile optimization | 🎼 Conductor | Medium | ⬜ Pending |
| 3.4 | Add validation warnings and Azure best practice guidance | 🎼 Conductor | Medium | ⬜ Pending |

### Phase 4: Infrastructure
| Step | Task | Specialist | Complexity | Status |
|------|------|-----------|------------|--------|
| 4.1 | Create Bicep modules for ACR | 🏗️ Stratus | Simple | ⬜ Pending |
| 4.2 | Create Bicep modules for ACA Environment | 🏗️ Stratus | Medium | ⬜ Pending |
| 4.3 | Create Bicep modules for Container App | 🏗️ Stratus | Medium | ⬜ Pending |
| 4.4 | Create main.bicep with dev/prod parameter files | 🏗️ Stratus | Medium | ⬜ Pending |

### Phase 5: CI/CD Pipeline
| Step | Task | Specialist | Complexity | Status |
|------|------|-----------|------------|--------|
| 5.1 | Create GitHub Actions workflow for container build | 🧪 Sentinel | Medium | ⬜ Pending |
| 5.2 | Add infrastructure deployment steps | 🧪 Sentinel | Medium | ⬜ Pending |
| 5.3 | Add container promotion (GHCR → ACR) and app deployment | 🧪 Sentinel | Medium | ⬜ Pending |
| 5.4 | Configure environment-specific deployments (dev/prod) | 🧪 Sentinel | Simple | ⬜ Pending |

---

## Dependencies

```
Phase 1 ──► Phase 2 ──► Phase 3
                            │
Phase 4 (parallel) ─────────┼──► Phase 5
                            │
                        Integration
```

- Phases 1-3 (App) and Phase 4 (Infra) can proceed in parallel
- Phase 5 (CI/CD) requires both app (Dockerfile) and infra (Bicep) to be ready

---

## Technical Decisions

### Frontend Stack
- **Framework:** Next.js 14+ with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **State:** React hooks + localStorage for persistence
- **Icons/Images:** Lucide icons, Azure service icons (official, non-copyrighted)

### Infrastructure
- **IaC:** Bicep with modular structure
- **Registry:** Azure Container Registry (shared across envs)
- **Compute:** Azure Container Apps (dev + prod in separate RGs)
- **Region:** Single region for both environments

### CI/CD
- **Platform:** GitHub Actions
- **Strategy:** Build → GHCR → Deploy Infra → Promote to ACR → Deploy App
- **Environments:** dev (on PR merge to dev branch), prod (on release tag)

---

## Azure Subnet Templates (Built-in)

| Template | Min Size | Recommended | Notes |
|----------|----------|-------------|-------|
| GatewaySubnet | /29 | /27 | VPN/ExpressRoute Gateway |
| AzureBastionSubnet | /27 | /26 | Azure Bastion |
| AzureFirewallSubnet | /26 | /26 | Azure Firewall |
| AzureFirewallManagementSubnet | /26 | /26 | Firewall forced tunneling |
| RouteServerSubnet | /27 | /27 | Azure Route Server |
| ApplicationGatewaySubnet | /26 | /24 | App Gateway v2 |
| Custom | /29 | varies | User-defined |

---

## Delegations Reference (Picklist)

- Microsoft.Web/serverFarms
- Microsoft.ContainerInstance/containerGroups
- Microsoft.Sql/managedInstances
- Microsoft.DBforPostgreSQL/flexibleServers
- Microsoft.DBforMySQL/flexibleServers
- Microsoft.Network/dnsResolvers
- Microsoft.App/environments
- Microsoft.ApiManagement/service
- (and more...)

---

## Service Endpoints Reference (Multi-select)

- Microsoft.Storage
- Microsoft.Sql
- Microsoft.AzureActiveDirectory
- Microsoft.AzureCosmosDB
- Microsoft.Web
- Microsoft.KeyVault
- Microsoft.ServiceBus
- Microsoft.EventHub
- Microsoft.ContainerRegistry
- Microsoft.CognitiveServices
- (and more...)

---

## Next Action

**Ready to execute Phase 1, Step 1.1:** Initialize Next.js project

Use `*continue` to begin execution.
