# Task Plan: Azure Region Selection for VNets

## Goal
Add Azure region selection for VNets with grouped picker and export integration

## Context
- **App Location:** `/app`
- **Framework:** Next.js, React 19, TypeScript
- **Current State:** ✅ COMPLETE

## Decomposed Steps

### Phase 1: Data & Types
- [x] 1.1 Create Azure regions data file with all regions grouped by geography
- [x] 1.2 Update `VNet` type to include `region` field

### Phase 2: UI Components  
- [x] 2.1 Create `RegionPicker` component (grouped combobox)
- [x] 2.2 Update `project-workspace.tsx` to include region selection in dialogs

### Phase 3: State & Logic
- [x] 3.1 Update `AppContext` to handle region in VNet CRUD
- [x] 3.2 Handle migration for existing VNets (default to East US)

### Phase 4: Export Integration
- [x] 4.1 Update `export-arm.ts` to use VNet-specific region
- [x] 4.2 Update `export-bicep.ts` to use VNet-specific region
- [x] 4.3 Update `export-terraform.ts` to use VNet-specific region

### Phase 5: Testing
- [x] 5.1 Add/update tests for region functionality (all 188 tests passing)

## Specialist Assignments
| Phase | Specialist | Status |
|-------|------------|--------|
| Phase 1-4 | Conductor 🎼 | ✅ Complete |
| Phase 5 | Conductor 🎼 | ✅ Complete |

## Files Created/Modified

### New Files
- `app/src/lib/azure-regions.ts` - Azure regions data (70+ regions grouped by geography)
- `app/src/components/region-picker.tsx` - Grouped region picker component

### Modified Files
- `app/src/types/index.ts` - Added `region` field to VNet interface
- `app/src/components/project-workspace.tsx` - Added RegionPicker to Create/Edit VNet dialogs
- `app/src/lib/storage.ts` - Updated `createVNet` to accept region parameter
- `app/src/context/app-context.tsx` - Updated `createNewVNet` signature
- `app/src/lib/export-arm.ts` - Uses VNet-specific region with fallback
- `app/src/lib/export-bicep.ts` - Uses VNet-specific region with fallback
- `app/src/lib/export-terraform.ts` - Uses VNet-specific region with fallback
- Multiple test files - Added region property to VNet fixtures
