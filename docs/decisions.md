# Architecture Decisions - LovelyGarden

This document records key architecture and design decisions using the [ADR-light](https://adr.github.io/) format.

---

## Decision 1: Use RxDB (IndexedDB) over Firebase
**Date**: 2026-05-04
**Status**: Accepted
**Context**: Gardeners need a tool that works offline (greenhouses, remote plots).
**Rationale**: 
- No server costs for personal use.
- Local-first architecture (PWA + Service Worker).
- RxDB provides MongoDB-like queries and migration strategies.
**Trade-offs**: No multi-user collaboration yet.

---

## Decision 2: XState for Plant Lifecycle
**Date**: 2026-05-04
**Status**: Accepted
**Context**: Plant growth follows deterministic stages (seed → germination → harvest).
**Rationale**: 
- State machines enforce valid transitions.
- XState provides visualization and testing tools.
- Easy to extend with environmental triggers.
**Trade-offs**: Learning curve for contributors.

---

## Decision 3: Fuse.js + Debounce for Search
**Date**: 2026-05-04
**Status**: Accepted
**Context**: Plant catalog has 100+ species; users make typos or use partial names.
**Rationale**: 
- Handles synonyms and scientific names.
- Debouncing prevents excessive recalculation on fast typing.
- No server round-trips (works offline).

---

## Decision 4: Vite 5 over CRA / Next.js
**Date**: 2026-05-04
**Status**: Accepted
**Context**: Need a build tool that supports PWA, fast HMR, and modern bundling.
**Rationale**: 
- PWA plugin provides offline support and update prompts.
- Fast cold start and HMR (<50ms).
- Native support for TypeScript and JSX.

---

## Decision 5: Zod for Validation
**Date**: 2026-05-04
**Status**: Accepted
**Context**: Need runtime validation for JSON imports and API responses.
**Rationale**: 
- TypeScript-first (infer types from schemas).
- Small bundle size and excellent error messages.

---

## Decision 6: Manual Chunk Splitting
**Date**: 2026-05-04
**Status**: Accepted
**Context**: Large vendor bundles (RxDB ~200KB) slow initial load.
**Decision**: Use Vite's `manualChunks` to split: `vendor-db`, `vendor-icons`, `vendor-misc`.
**Rationale**: Improves cache hit rates for static libraries.

---

## Decision 7: AI-Assisted Development Workflow
**Date**: 2026-05-04
**Status**: Accepted (Experimental)
**Context**: Complex domain modeling and optimization require iterative refinement.
**Rationale**: 
- Parallel subagents save ~70% iteration time.
- AI catches TypeScript errors human review might miss.

---

## Decision 8: Strict Schema Enforcement (RxDB v10)
**Date**: 2026-05-05
**Status**: Accepted (Iteration 4)
**Context**: Encountered `SC37` and `DXE1` errors during DB initialization due to missing constraints on indexed fields.
**Decision**: Migrate to v10 schemas and strictly define `maxLength`, `required`, and `multipleOf` for all indexed properties.
**Rationale**: Ensures Dexie.js storage compatibility and prevents data corruption at the hardware storage layer.

---

## Decision 9: DB Initialization Mutex
**Date**: 2026-05-05
**Status**: Accepted (Iteration 4)
**Context**: Vite HMR and React Strict Mode triggered multiple simultaneous database connection attempts, causing race conditions.
**Decision**: Use a shared `dbPromise` in `db/index.ts` to ensure only one database instance is created per session.
**Rationale**: Neutralizes HMR-induced crashes and guarantees a singleton database connection.

---

## Decision 10: UI Helper Centralization
**Date**: 2026-05-05
**Status**: Accepted (Iteration 4)
**Context**: Shared UI logic (colors, icons) inside component files triggered `react-refresh` lint warnings and "Lazy" reload crashes.
**Decision**: Move all non-component exports to `src/utils/ui-helpers.tsx`.
**Rationale**: Satisfies Vite's HMR constraints and improves code reusability across tabs.
