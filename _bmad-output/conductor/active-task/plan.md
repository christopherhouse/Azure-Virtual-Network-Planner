# Azure Virtual Network Planner — Execution Plan

**Goal:** Build a modern NextJS SPA for planning Azure VNets and subnet configurations, deployed on Azure Container Apps with CI/CD via GitHub Actions.

**Created:** 2026-01-28
**Status:** ✅ Complete

---

## Project Summary

| Attribute | Value |
|-----------|-------|
| **App Framework** | NextJS (App Router) |
| **UI Stack** | Tailwind CSS + shadcn/ui |
| **Persistence** | Local browser storage |
| **Auth** | None |
| **Deployment** | Azure Container Apps |
| **Infrastructure** | Bicep (dev + prod environments) |
| **CI/CD** | GitHub Actions (manual + push to main) |
| **Container Flow** | Build → GHCR → ACR → Container Apps |

---

## Functional Requirements

1. **Project Management** — Multiple VNets per project, stored in local storage ✅
2. **CIDR Calculator** — Correct subnet math, split/combine subnets ✅
3. **Subnet Metadata** — Name, description, delegation (picklist), service endpoints (multi-select) ✅
4. **Split Behavior** — Splits create two new subnets, wipe metadata, original range becomes uneditable ✅
5. **Export Templates** — ARM, Bicep, Terraform with params (location, RG name, vnet/subnet config) ✅
6. **Azure Data** — Delegation/service endpoints from static lists ✅

---

## Execution Plan

### Phase 1: Project Foundation ✅
| Step | Task | Agent | Complexity | Status |
|------|------|-------|------------|--------|
| 1.1 | Initialize NextJS project with TypeScript | conductor | simple | ✅ complete |
| 1.2 | Configure Tailwind CSS + shadcn/ui | conductor | simple | ✅ complete |
| 1.3 | Set up project folder structure | conductor | simple | ✅ complete |
| 1.4 | Create type definitions (Project, VNet, Subnet) | conductor | simple | ✅ complete |

### Phase 2: Core Logic ✅
| Step | Task | Agent | Complexity | Status |
|------|------|-------|------------|--------|
| 2.1 | Build CIDR/subnet math utilities | conductor | medium | ✅ complete |
| 2.2 | Build subnet split/combine logic | conductor | medium | ✅ complete |
| 2.3 | Fetch/define Azure delegation options | conductor | simple | ✅ complete |
| 2.4 | Fetch/define Azure service endpoint options | conductor | simple | ✅ complete |
| 2.5 | Build local storage persistence layer | conductor | simple | ✅ complete |

### Phase 3: UI Components ✅
| Step | Task | Agent | Complexity | Status |
|------|------|-------|------------|--------|
| 3.1 | Build app layout and navigation | conductor | simple | ✅ complete |
| 3.2 | Build project list/management page | conductor | medium | ✅ complete |
| 3.3 | Build VNet configuration component | conductor | medium | ✅ complete |
| 3.4 | Build subnet table with split/combine UI | conductor | complex | ✅ complete |
| 3.5 | Build subnet edit form (name, desc, delegation, endpoints) | conductor | medium | ✅ complete |
| 3.6 | Build CIDR input with validation | conductor | simple | ✅ complete |

### Phase 4: Export & Polish ✅
| Step | Task | Agent | Complexity | Status |
|------|------|-------|------------|--------|
| 4.1 | Build ARM template generator | conductor | medium | ✅ complete |
| 4.2 | Build Bicep template generator | conductor | medium | ✅ complete |
| 4.3 | Build Terraform template generator | conductor | medium | ✅ complete |
| 4.4 | Build export modal with format selection | conductor | simple | ✅ complete |
| 4.5 | UI polish, responsive design, accessibility | conductor | medium | ✅ complete |

### Phase 5: Infrastructure ✅
| Step | Task | Agent | Complexity | Status |
|------|------|-------|------------|--------|
| 5.1 | Create Bicep modules: ACR | conductor | medium | ✅ complete |
| 5.2 | Create Bicep modules: Container Apps Environment | conductor | medium | ✅ complete |
| 5.3 | Create Bicep modules: Container App | conductor | medium | ✅ complete |
| 5.4 | Create main.bicep with dev/prod parameters | conductor | medium | ✅ complete |
| 5.5 | Create bicepparam files for dev and prod | conductor | simple | ✅ complete |

### Phase 6: CI/CD ✅
| Step | Task | Agent | Complexity | Status |
|------|------|-------|------------|--------|
| 6.1 | Create Dockerfile for NextJS app | conductor | simple | ✅ complete |
| 6.2 | Create GitHub Actions workflow | conductor | complex | ✅ complete |
| 6.3 | Configure GHCR → ACR promotion | conductor | medium | ✅ complete |
| 6.4 | Add manual dispatch trigger | conductor | simple | ✅ complete |

---

## Files Created

### Application (app/)
- `src/types/index.ts` — TypeScript type definitions
- `src/lib/cidr.ts` — CIDR math utilities
- `src/lib/azure-delegations.ts` — Azure delegation options
- `src/lib/azure-service-endpoints.ts` — Azure service endpoint options
- `src/lib/storage.ts` — Local storage persistence
- `src/lib/export-arm.ts` — ARM template generator
- `src/lib/export-bicep.ts` — Bicep template generator
- `src/lib/export-terraform.ts` — Terraform template generator
- `src/context/app-context.tsx` — React context for state management
- `src/components/header.tsx` — App header with navigation
- `src/components/project-list.tsx` — Project list/management
- `src/components/project-workspace.tsx` — VNet workspace view
- `src/components/vnet-editor.tsx` — VNet/subnet editor
- `src/components/subnet-editor.tsx` — Subnet detail editor
- `src/components/export-dialog.tsx` — Export template dialog

### Infrastructure (infra/)
- `modules/acr.bicep` — Azure Container Registry module
- `modules/container-apps-environment.bicep` — Container Apps Environment module
- `modules/container-app.bicep` — Container App module
- `main.bicep` — Main deployment orchestration
- `main.dev.bicepparam` — Development parameters
- `main.prod.bicepparam` — Production parameters

### CI/CD
- `Dockerfile` — Multi-stage Docker build
- `.github/workflows/deploy.yml` — GitHub Actions workflow

### Documentation
- `README.md` — Project documentation

---

## Next Steps

1. **Run locally**: `cd app && npm run dev`
2. **Deploy infrastructure**: See README.md for Azure deployment commands
3. **Configure GitHub secrets**: Set up AZURE_CREDENTIALS and environment variables
4. **Push to main**: Triggers automatic deployment to dev
