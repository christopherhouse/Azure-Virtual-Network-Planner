# Conductor Task Index

## Task: Infrastructure & CI/CD Pipeline Restructuring

**Created:** 2026-01-29
**Status:** ✅ Complete

| Path | Status | Agent |
|------|--------|-------|
| active-task/plan.md | complete | conductor |

## Deliverables

### 1. ✅ Unique Deployment Names
- Module deployment names now use `${deployment().name}` suffix
- Each deployment creates unique entries in Azure deployment history

### 2. ✅ Key Vault Module Created
- `infra/modules/key-vault.bicep` - Standard SKU, RBAC authorization

### 3. ✅ User Assigned Managed Identity Module Created  
- `infra/modules/user-assigned-identity.bicep` - UAMI + Key Vault Secrets User role

### 4. ✅ Core Infra Split from Container App
- `main.bicep` now deploys: ACR, CAE, Key Vault, UAMI
- Container App removed from Bicep (deployed via script)
- UAMI granted AcrPull role on ACR

### 5. ✅ Container App Module Updated
- Single revision mode (`activeRevisionsMode: 'Single'`)
- UAMI-based authentication (no admin credentials)
- HTTP scaling: 50 concurrent requests → max 4 replicas

### 6. ✅ App Deployment Script Created
- `infra/scripts/deploy-app.sh` - Colorful bash script
- Creates or updates Container App with UAMI
- Passes Key Vault URI as environment variable

### 7. ✅ GHA Workflow Restructured
- Optional infra deployment job (on-demand)
- Build → GHCR → ACR promotion → App deploy flow
- Separate dev/prod deployment paths

## Files Modified/Created
- `infra/main.bicep` - Updated (unique names, KV, UAMI, no CA)
- `infra/main.dev.bicepparam` - Updated (removed imageTag)
- `infra/main.prod.bicepparam` - Updated (removed imageTag)
- `infra/modules/key-vault.bicep` - NEW
- `infra/modules/user-assigned-identity.bicep` - NEW
- `infra/modules/container-app.bicep` - Updated (UAMI, scaling)
- `infra/scripts/deploy-app.sh` - NEW
- `.github/workflows/deploy.yml` - Updated (restructured flow)

## Specialists Used
- 🎼 Conductor (direct implementation)
