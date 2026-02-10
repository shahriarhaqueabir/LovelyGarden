# Immediate Action Plan
**Date**: 2026-02-10  
**Priority**: Execute in order  
**Estimated Time**: 1-2 hours for immediate actions

---

## 🎯 PHASE 1: CLEANUP (30 minutes)

### Step 1: Delete Build Artifacts
Execute these commands in the project root:

```powershell
# Delete temporary log files
Remove-Item lint_output.txt -ErrorAction SilentlyContinue
Remove-Item lint_results.txt -ErrorAction SilentlyContinue
Remove-Item output.log -ErrorAction SilentlyContinue
Remove-Item output_2.log -ErrorAction SilentlyContinue
Remove-Item output_3.log -ErrorAction SilentlyContinue
Remove-Item output_final.log -ErrorAction SilentlyContinue
Remove-Item test_results.txt -ErrorAction SilentlyContinue
```

### Step 2: Archive Outdated Documentation
```powershell
# Create archive directories
New-Item -ItemType Directory -Path "Guidebook\archive\early-planning" -Force
New-Item -ItemType Directory -Path "Guidebook\archive\outdated-reviews" -Force

# Archive early planning docs
Move-Item "Guidebook\Domain plans.txt" "Guidebook\archive\early-planning\" -Force
Move-Item "Guidebook\Domain plans extended.txt" "Guidebook\archive\early-planning\" -Force
Move-Item "Guidebook\Agent A.txt" "Guidebook\archive\early-planning\" -Force
Move-Item "Guidebook\Agent B.txt" "Guidebook\archive\early-planning\" -Force
Move-Item "Guidebook\Agent C.txt" "Guidebook\archive\early-planning\" -Force
Move-Item "Guidebook\Agent D.txt" "Guidebook\archive\early-planning\" -Force

# Archive outdated reviews
Move-Item "REVIEW_SUMMARY.md" "Guidebook\archive\outdated-reviews\" -Force
Move-Item "REPORT_LIBRARY_INTEGRATION.md" "Guidebook\archive\outdated-reviews\" -Force
```

### Step 3: Update Git Ignore (if not already present)
Add to `.gitignore`:
```
# Build artifacts
*.log
*_output.txt
*_results.txt
lint_*.txt
output*.log
test_results.txt

# Archives
Guidebook/archive/
```

---

## 🎯 PHASE 2: UI/UX CRITICAL FIXES (4-5 hours)

### Tasks Remaining from UI_FIX_PLAN.md

#### Task 4: Scroll Indicators (45 min) - NEXT UP
**File**: `src/components/InventoryTray.tsx`
- Add useRef and state for scroll tracking
- Implement scroll handler
- Add left/right gradient indicators
- Test horizontal scrolling

#### Task 5: Modal Responsiveness (30 min)
**Files**: GardenConfigDialog, SeedStore, SowingWindowsModal, SettingsPanel
- Update all max-widths to responsive breakpoints
- Test on 375px, 768px, 1920px

#### Task 6: Responsive Grid (45 min)
**File**: `src/components/GardenGrid.tsx`
- Use CSS Grid auto-fit
- Set min/max cell sizes
- Update gaps for mobile

#### Task 7: Text Sizes (30 min)
**Files**: VirtualGardenTab, PlantedCard, GardenGrid
- Increase all text-[8px] to text-[10px]
- Increase all text-[9px] to text-xs
- Run contrast checker

#### Task 8: Touch Targets (30 min)
**File**: `src/components/VirtualGardenTab.tsx`
- Add min-w-[44px] min-h-[44px] to buttons
- Increase icon sizes on mobile
- Test tap accuracy

#### Task 9: Loading States (45 min)
**New File**: `src/components/LoadingSkeleton.tsx`
- Create skeleton component
- Add to garden fetch, plant cards, inventory

#### Task 10: Drag Preview (15 min)
**File**: `src/components/InventoryTray.tsx`
- Add shadow, scale, ring to DragOverlay

#### Task 11: Layer Toggle (20 min)
**File**: `src/components/VirtualGardenTab.tsx`
- Add active state styling
- Add text labels (hidden on small screens)

#### Task 12: Center Grid (10 min)
**File**: `src/components/GardenGrid.tsx`
- Add flex centering to container

#### Task 13: Empty State (30 min)
**File**: `src/components/VirtualGardenTab.tsx`
- Create EmptyState component
- Add CTA button

---

## 🎯 PHASE 3: CODE QUALITY (3-4 hours)

### High Priority from CODE_REVIEW.md

#### Fix 1: Accessibility (1 hour)
**Scope**: All components with icon buttons
```tsx
// Pattern to apply everywhere
<button
  onClick={handleClick}
  aria-label="Descriptive action"
  title="Descriptive action"
>
  <Icon className="w-4 h-4" />
</button>
```

**Files to update**:
- VirtualGardenTab.tsx (intervention buttons)
- GardenGrid.tsx (grid controls)
- InventoryTray.tsx (filter buttons)
- SettingsPanel.tsx (all icon buttons)

#### Fix 2: Move Inline Styles (1 hour)
**Scope**: Remove all `style={{ ... }}` props

**Create in index.css**:
```css
.garden-bg-forest { background-color: #14532d; }
.garden-bg-midnight { background-color: #1e1b4b; }
.garden-bg-desert { background-color: #78350f; }
/* Add all theme colors */
```

**Files to update**:
- VirtualGardenTab.tsx
- GardenGrid.tsx
- PlantedCard.tsx
- Any component with inline backgroundColor

#### Fix 3: Error Boundaries (1 hour)
**Create**: `src/components/ErrorBoundary.tsx`
```tsx
import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-screen bg-stone-900 text-stone-300 p-8">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-stone-400 mb-4">{this.state.error?.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-600 rounded"
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Wrap in App.tsx**:
```tsx
<ErrorBoundary>
  <VirtualGardenTab ... />
</ErrorBoundary>
```

#### Fix 4: React.memo Performance (30 min)
**Files to optimize**:
```tsx
// src/components/PlantedCard.tsx
export const PlantedCardView = React.memo(({ catalogId, stage, onClick }) => {
  // ...
}, (prevProps, nextProps) => 
  prevProps.catalogId === nextProps.catalogId &&
  prevProps.stage === nextProps.stage
);

// src/components/GridSlot.tsx
export const GridSlot = React.memo(({ plant, isOccupied }) => {
  // ...
});
```

#### Fix 5: Linting Config (30 min)
**Create**: `.stylelintrc.json`
```json
{
  "extends": ["stylelint-config-standard"],
  "rules": {
    "at-rule-no-unknown": [
      true,
      {
        "ignoreAtRules": ["tailwind", "apply", "layer", "variants", "responsive"]
      }
    ],
    "declaration-block-trailing-semicolon": null,
    "no-descending-specificity": null,
    "order/properties-order": null
  },
  "ignoreFiles": ["node_modules/**", "dist/**"]
}
```

---

## 🎯 PHASE 4: DOCUMENTATION UPDATE (1 hour)

### Update All "Last Updated" Dates
```markdown
README.md: 2026-02-10
PROJECT_STATE.md: 2026-02-10
CODE_REVIEW.md: 2026-02-10
UI_FIX_PROGRESS.md: 2026-02-10
```

### Create CHANGELOG.md
```markdown
# Changelog

## [0.3.0-alpha] - 2026-02-10

### Added
- Consolidated state timeline (CONSOLIDATED_STATE_TIMELINE.md)
- Immediate action plan (IMMEDIATE_ACTION_PLAN.md)
- UI/UX audit and fix plan
- 3D glassmorphism UI system
- Intelligent plant animations
- Multi-layered terrain texture

### Changed
- Simplified theme system to unified terrain
- Improved header responsiveness
- Fixed garden tab truncation
- Enhanced PlantedCard text overflow handling

### In Progress
- UI/UX critical fixes (22.4% complete)
- Modal responsiveness improvements
- Accessibility enhancements

### Planned
- Phase 4: Command Center implementation
- SQLite data migration (68 plants)
- Component refactoring
- Testing infrastructure

## [0.2.0-alpha] - 2026-02-06

### Added
- Prebuilt gardens system
- Visual enhancements (glassmorphism)
- Documentation overhaul

## [0.1.0-alpha] - 2026-01-26

### Added
- Initial React + RxDB + XState foundation
- Plant lifecycle FSM
- Companion planting logic
- Data import/export
```

### Update README.md Badge
```markdown
![Version](https://img.shields.io/badge/version-0.3.0--alpha-green)
![Status](https://img.shields.io/badge/status-UI%2FUX%20fixes-yellow)
```

---

## 🎯 DECISION POINTS

Before proceeding with larger work, make these decisions:

### Decision 1: SQLite Migration
**Question**: Deploy SQLite migration (68 plants) before Phase 4?
- ✅ **YES**: Better data foundation, +16 plants, 5-7 hours
- ❌ **NO**: Focus on UI/UX and Phase 4 first

**If YES**: Follow `Guidebook/Claude review/DBMigration/SQLITE_IMPLEMENTATION_GUIDE.md`

### Decision 2: Phase 4 Scope
**Question**: Full Phase 4 or MVP first?
- **MVP** (6-8 hours): Time scrubbing + basic HUD only
- **FULL** (11-14 hours): All features (overlays, validation, etc.)

**Recommendation**: MVP first for faster feedback

### Decision 3: Component Refactoring
**Question**: Refactor VirtualGardenTab before or after Phase 4?
- **BEFORE**: Cleaner codebase for Phase 4 work (4-5 hours)
- **AFTER**: Get features done first, refactor during stabilization

**Recommendation**: BEFORE - safer to refactor without new feature complexity

---

## 📋 EXECUTION CHECKLIST

### Immediate (Today - 2 hours)
- [ ] Run cleanup script (delete build artifacts)
- [ ] Archive outdated documentation
- [ ] Update .gitignore
- [ ] Update all "Last Updated" dates
- [ ] Create CHANGELOG.md
- [ ] Commit changes: "chore: cleanup build artifacts and consolidate documentation"

### This Week (4-5 hours)
- [ ] Complete UI/UX Tasks 4-13 (from UI_FIX_PLAN.md)
- [ ] Test on all breakpoints (375px, 768px, 1024px, 1920px)
- [ ] Run Lighthouse audit
- [ ] Commit after each task

### Next Week (3-4 hours)
- [ ] Apply all Code Quality fixes
- [ ] Add ErrorBoundary
- [ ] Optimize with React.memo
- [ ] Fix linting configuration
- [ ] Run full lint check with zero warnings

### Week After (Decision-dependent)
- Option A: SQLite migration (5-7 hours)
- Option B: Phase 4 MVP (6-8 hours)
- Option C: Component refactoring (4-5 hours)

---

## 🚀 SUCCESS METRICS

After immediate actions:
- [ ] Zero build artifacts in repo
- [ ] All docs have current dates
- [ ] CHANGELOG.md tracks version history
- [ ] Clear action plan for next 2-4 weeks

After UI/UX fixes:
- [ ] All 13 tasks marked complete in UI_FIX_PROGRESS.md
- [ ] App tested at 4+ breakpoints
- [ ] Lighthouse score >90
- [ ] Zero accessibility violations

After code quality fixes:
- [ ] Zero ESLint warnings
- [ ] All icon buttons have aria-labels
- [ ] No inline styles in components
- [ ] ErrorBoundary protecting major sections

---

**Created**: 2026-02-10  
**Priority**: Execute Phase 1 immediately  
**Next Review**: After UI/UX fixes completion
