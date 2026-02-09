# Task Plan: SEO-Optimized Landing Page

## Goal
Add a Hero Section + Feature Cards to the Azure VNet Planner landing page to improve SEO while preserving the existing project management UX.

## User Requirements
- **Icon Style:** Lucide icons (consistent with existing UI)
- **Hero Behavior:** Auto-collapse to slim banner for returning users (with projects)
- **Card Count:** 4 feature cards
- **CTA Button:** "Start Planning"

## Feature Cards (Selected for SEO Value)
1. **Subnet Calculator** - Calculate CIDR blocks, IP ranges automatically
2. **IaC Export** - Export to ARM, Bicep, or Terraform templates
3. **Service Configuration** - Delegations & service endpoints
4. **Multi-Project** - Manage multiple network designs

## Decomposed Steps

| Step | Task | Specialist | Status | Dependencies |
|------|------|------------|--------|--------------|
| 1 | Create HeroSection component | Conductor (self) | pending | none |
| 2 | Create FeatureCards component | Conductor (self) | pending | none |
| 3 | Create SlimBanner component (collapsed hero) | Conductor (self) | pending | none |
| 4 | Create useFirstVisit hook (localStorage) | Conductor (self) | pending | none |
| 5 | Integrate components into page.tsx | Conductor (self) | pending | 1-4 |
| 6 | Update SEO content (remove sr-only, move to visible) | Conductor (self) | pending | 5 |
| 7 | Run tests and verify | Sentinel | pending | 6 |

## Technical Notes
- All components use existing shadcn/ui primitives
- LocalStorage key: `azvnet-has-visited` or check if projects exist
- Hero auto-collapses when user has ≥1 project OR clicks collapse
- Slim banner has "Learn More" to expand hero again
- Feature cards use Card component from shadcn/ui

## Next Action
Execute Step 1: Create HeroSection component
