# Prompt History - LovelyGarden

This document records the evolution of prompts used to build LovelyGarden. It demonstrates iterative AI-assisted development and the refinement of complex domain logic.

---

## Prompt v1: Initial Scaffold

**Date**: 2026-05-04
**Prompt**: "Build a PWA garden manager with RxDB, React, TypeScript, and plant lifecycle tracking."
**Result**: Basic architecture and storage established.
**Insights**: Clear tech stack constraints led to correct tool choices early on.

---

## Prompt v2: Reasoning Engine

**Date**: 2026-05-04
**Prompt**: "Add a reasoning engine that calculates companion/antagonist plant scores and checks seasonal sowing eligibility."
**Result**: Integrated scientific logic for plant compatibility.
**Insights**: Decoupling logic from the UI allowed for more complex horticultural modeling.

---

## Prompt v3: Cleanup & Core Fixes

**Date**: 2026-05-04
**Prompt**: "Remove dead code, add Zod validation for imports, and set up Husky/lint-staged pre-commit hooks."
**Result**: Stabilized the repo for production-level development.
**Insights**: Parallel subagent execution (4 agents) saved significant time during cleanup.

---

## Prompt v4: Performance Optimizations

**Date**: 2026-05-04
**Prompt**: "Improve performance using manual chunk splitting, lazy-loading, and debounced fuzzy search with Fuse.js."
**Result**: Significant improvement in initial load time and search responsiveness.
**Insights**: manualChunks strategy requires careful handling of React dependencies to avoid circular warnings.

---

## Prompt v5: Testing Expansion

**Date**: 2026-05-04
**Prompt**: "Set up Vitest and Playwright. Write unit tests for the reasoning engine and E2E tests for the seed store."
**Result**: 26 unit tests passing and a robust regression suite established.
**Insights**: Catching logic errors at the unit level is critical before scaling the UI.

---

## Prompt v6: Database Stabilization (Iteration 4)

**Date**: 2026-05-05
**Prompt**: "Resolve RxDB SC37/DXE1 failures and React HMR race conditions by implementing strict schema enforcement and an initialization mutex."
**Result**:

- Migrated to **RxDB v10** with explicit constraints (`maxLength`, `required`).
- Implemented **Initialization Mutex** (`dbPromise`).
- Centralized UI helpers to resolve `react-refresh` lint warnings.
  **Impact**: Achieved 100% stable database initialization and zero lint errors.
  **Insights**: Providing specific storage error codes (DXE1) allowed for surgical precision in the fix.

---

## Global Iteration Insights

1. **Start with types, not `any`**: Early usage of `any` causes a cascade of technical debt.
2. **Version alignment is critical**: Incompatibilities between `@playwright/test` and `playwright` core can break the entire pipeline.
3. **AI + Templates = Clarity**: Structured scaffolds (like the README template) force thinking before coding.
4. **Subagents accelerate complexity**: Running parallel agents for different domains (Performance vs. Testing) transforms the development speed.
