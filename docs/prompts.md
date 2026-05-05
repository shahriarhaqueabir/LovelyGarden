# Prompt History - LovelyGarden

This document records the evolution of prompts used to build LovelyGarden. It demonstrates iterative AI-assisted development and what worked (or didn't).

---

## Prompt v1: Initial Scaffold

**Date**: 2026-05-04

**Prompt**:
```
Build a PWA garden manager with:
- RxDB for local storage
- React + TypeScript
- Gamification (XP, levels)
- Plant lifecycle tracking
```

**Result**:
- Basic scaffold created with Vite + React
- RxDB collections: catalog, planted, inventory, settings
- Simple garden grid with drag-and-drop
- Gamification system (XP on watering/harvesting)

**What worked**:
- Clear tech stack constraints led to correct tool choices
- Gamification hook provided motivation to build features

**What didn't**:
- No reasoning layer (companion planting, seasonal eligibility)
- Mixed `any` types throughout
- No input validation on JSON imports
- Unused code accumulated (appStore.ts, sprites)

---

## Prompt v2: Add Reasoning Layer

**Date**: 2026-05-04

**Prompt**:
```
Add a reasoning engine that:
- Calculates companion/antagonist plant scores
- Checks seasonal sowing eligibility
- Uses XState for plant lifecycle state machine
```

**Result**:
- `src/logic/reasoning.ts` created with `calculateCompanionScore`
- `src/logic/lifecycle.ts` with XState machine
- GardenGrid now shows companion score indicators
- SowingCalendar filters by seasonal eligibility

**What worked**:
- XState provided clear state transitions
- Companion scoring improved user experience

**What didn't**:
- Initial `Relationship[]` type was missing required fields (mechanism, confidence_score)
- Had to fix type errors after generation

---

## Prompt v3: Cleanup & Core Fixes

**Date**: 2026-05-04

**Prompt**:
```
Using superpowers skills:
- Remove dead code (appStore.ts, unused sprites)
- Add input validation with Zod for JSON imports
- Set up pre-commit hooks (Husky + lint-staged)
- Create README, CONTRIBUTING, LICENSE
- Add ErrorBoundary component
```

**Result**:
- Deleted `src/stores/appStore.ts`, `public/sprites/Forest_Monsters_FREE/`
- Updated `src/db/export-import.ts` with Zod validation
- Installed Husky + lint-staged
- Created documentation files
- ErrorBoundary wrapping all tabs

**What worked**:
- Parallel subagent execution (4 agents) saved significant time
- Structured approach forced completeness

**What didn't**:
- TypeScript strict mode revealed hidden `any` types
- Migration function signatures needed fixing (`MigrationDoc<T>` type)

---

## Prompt v4: Performance Optimizations

**Date**: 2026-05-04

**Prompt**:
```
Improve performance:
- Code splitting (vendor chunks)
- Lazy-load heavy components (GrowthGraph, ObservationTerminal)
- Debounced fuzzy search with Fuse.js
- DB indexes for frequent queries
- Convert garden-bg.png to WebP
- Add React.memo for pure components
```

**Result**:
- Vite config: manual chunks (db, icons, misc)
- `React.lazy()` for GrowthGraph, ObservationTerminal
- Debounce utility + Fuse.js in SeedStore, SowingCalendar, Knowledgebase
- Indexes: `bedId`, `catalogId`, `date`
- WebP conversion with PNG fallback
- `React.memo` on Modal, PlantedCardView

**What worked**:
- Debounced fuzzy search transformed UX
- Chunk splitting reduced initial load time

**What didn't**:
- Initial chunk strategy caused circular dependency warnings
- Fixed by keeping React deps in one chunk

---

## Prompt v5: Testing Expansion

**Date**: 2026-05-04

**Prompt**:
```
Expand testing:
- Vitest + React Testing Library setup
- Unit tests for logic/ functions (lifecycle, reasoning)
- Component tests for SeedStore
- Playwright E2E tests (settings, seed store)
- Storybook for UI components
```

**Result**:
- 26/26 Vitest tests passing (17 logic + 9 SeedStore)
- Playwright tests created (settings.spec.ts, seed-store.spec.ts)
- Storybook stories for Modal, ErrorBoundary
- `dotenv` integrated in Vite config

**What worked**:
- Vitest + RTL caught logic errors early
- Playwright test structure established

**What didn't**:
- Playwright package version conflict (`@playwright/test@1.58.2` vs `playwright@1.59.1`)
- Fixed by aligning versions
- Initial `test.describe` typo caused test failures

---

## Prompt v6: GitHub Publishing Prep (Current)

**Date**: 2026-05-04

**Prompt**:
```
Use the repository template to prepare this project for GitHub publishing:
- Structured README with problem/approach/trade-offs
- /docs folder (architecture, decisions, prompts)
- Pre-publish checklist
- Clean project structure
```

**Result** (in progress):
- README.md rewritten with template structure
- Created `/docs/architecture.md`
- Created `/docs/decisions.md`
- Created `/docs/prompts.md` (this file)
- Pre-publish checklist completed (mostly)

**What worked**:
- Template forced structured thinking
- Documentation now tells a story (not just "what" but "why")

**What didn't**:
- Still need screenshots/demo for full Level 4 maturity
- Playwright E2E needs browser binaries + dev server to fully pass

---

## Iteration Insights

1. **Start with types, not `any`**: Early `any` usage in `db/index.ts` caused cascade of type errors later
2. **Version alignment matters**: Playwright had `@playwright/test@1.58.2` and `playwright@1.59.1` — caused import errors
3. **Chunk splitting is tricky**: React + ReactDOM + React JSX runtime create circular deps if split incorrectly
4. **AI + templates = clarity**: Using the repo template forced thinking before coding
5. **Subagents accelerate iteration**: 4 parallel agents (Dead Code, Core Fixes, Performance, Testing) completed in one session what might take days manually

---

## Future Prompt Ideas

### Prompt v7: Add Image Recognition
```
Add plant disease/pest diagnosis:
- Use ML model (TensorFlow.js or API)
- Upload photo → diagnose issue → suggest treatment
- Integrate with logbook observations
```

### Prompt v8: Server Sync
```
Add RxDB replication:
- Sync garden data across devices
- Use RxDB replication plugin + Node.js backend
- Handle conflict resolution (last-write-wins vs. merge strategies)
```

### Prompt v9: Social Features
```
Add community features:
- Share garden layouts via QR code/link
- Compare yields with friends
- Community challenges (e.g., "Harvest 10 tomatoes")
- Achievements system expansion
```
