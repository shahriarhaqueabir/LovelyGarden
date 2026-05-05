# Architecture Decisions - LovelyGarden

This document records key architecture and design decisions using [ADR-light](https://adr.github.io/) format.

---

## Decision 1: Use RxDB (IndexedDB) over Firebase / Supabase

**Date**: 2026-05-04

**Status**: Accepted

**Context**:
Gardeners need a tool that works offline (greenhouses, remote plots, spotty Wi-Fi). The app needs structured data (catalog, planted items, logbook) with query capabilities.

**Decision**:
Use RxDB with Dexie.js adapter for IndexedDB storage. Enable offline-first architecture.

**Rationale**:
- No server costs for personal/hobbyist use
- Works offline by default (PWA + Service Worker)
- RxDB provides MongoDB-like queries, migration strategies, and replication-ready design
- IndexedDB is built into all modern browsers

**Trade-offs**:
- No multi-user collaboration (yet)
- Limited to browser storage quotas (~50MB-2GB depending on browser)
- No server-side backups (mitigated by JSON export/import feature)

**Alternatives considered**:
- **Firebase**: Requires online, vendor lock-in, costs for personal use
- **Supabase**: PostgreSQL in browser? Overkill for local-first app
- **LocalStorage**: No querying, no structured data, size limits

---

## Decision 2: XState for Plant Lifecycle over Custom State Management

**Date**: 2026-05-04

**Status**: Accepted

**Context**:
Plant growth follows deterministic stages (seed → germination → seedling → vegetative → flowering → fruiting → harvest). Need to model transitions, handle time-scrubbing, and support future environmental triggers.

**Decision**:
Use XState v5 state machines for plant lifecycle management.

**Rationale**:
- State machines enforce valid transitions (can't go from seed → harvest directly)
- Visualizer tools help debug complex flows
- XState integrates with React via `@xstate/react`
- Easy to extend with "environmental stress" events (drought, frost)

**Trade-offs**:
- Learning curve for contributors unfamiliar with state machines
- Slightly more code than simple `useState` transitions

**Alternatives considered**:
- **Custom reducer**: Error-prone, no transition validation
- **React Query mutations**: Not designed for local state machines
- **Zustand**: Would need custom transition logic anyway

---

## Decision 3: Fuse.js + Debounce for Search over API-based Search

**Date**: 2026-05-04

**Status**: Accepted

**Context**:
Plant catalog has 100+ species with common names, scientific names, categories, and families. Users make typos, use synonyms, or search by partial names.

**Decision**:
Client-side fuzzy search with Fuse.js and 300ms debounce.

**Rationale**:
- Handles "tomato" vs "Tomato" vs "Solanum lycopersicum"
- Debouncing prevents excessive recalculation on fast typing
- No server round-trips (works offline)
- Lightweight (~7KB gzipped)

**Trade-offs**:
- Performance degrades with very large catalogs (>1000 items)
- Client-side only (no server-side indexing)

**Alternatives considered**:
- **API-based search**: Requires online, adds complexity
- **Regular expressions**: Too strict, no fuzzy matching
- **Elasticsearch**: Overkill for browser-based app

---

## Decision 4: Vite 5 over CRA / Next.js

**Date**: 2026-05-04

**Status**: Accepted

**Context**:
Need a build tool that supports PWA (Service Worker), fast HMR, and modern bundling. App is client-side only (no SSR needed).

**Decision**:
Use Vite 5 with `@vitejs/plugin-react` and `vite-plugin-pwa`.

**Rationale**:
- PWA plugin provides offline support, precaching, and update prompts
- Fast cold start and HMR (<50ms)
- Rollup-based bundling with tree-shaking
- Native support for TypeScript, JSX, and CSS modules

**Trade-offs**:
- Vite 8 has compatibility issues with some plugins (e.g., `vite-plugin-pwa@0.19.8`)
- Ecosystem smaller than Webpack/Next.js

**Alternatives considered**:
- **Create React App**: Deprecated, no PWA support, slow
- **Next.js**: SSR unnecessary for PWA, adds complexity
- **Webpack directly**: Configuration overhead, slower builds

---

## Decision 5: Zod for Validation over Joi / Yup

**Date**: 2026-05-04

**Status**: Accepted

**Context**:
Need runtime validation for JSON imports (user-provided data), API responses, and form inputs. Must work in browser (no Node.js APIs).

**Decision**:
Use Zod for schema validation.

**Rationale**:
- TypeScript-first (infer types from schemas)
- Small bundle size (~12KB)
- Excellent error messages for users
- Works in browser and Node.js

**Trade-offs**:
- Learning curve for complex schemas
- No runtime schema evolution (handled by RxDB migrations separately)

**Alternatives considered**:
- **Joi**: Node.js only, larger bundle
- **Yup**: Good but less TypeScript integration
- **io-ts**: Functional approach, steeper learning curve

---

## Decision 6: Manual Chunk Splitting over Automatic

**Date**: 2026-05-04

**Status**: Accepted (after iteration)

**Context**:
Large vendor bundles (RxDB ~200KB, React ~130KB) slow initial load. Need to split code for better caching and loading.

**Decision**:
Use Vite's `manualChunks` to split: `vendor-db`, `vendor-icons`, `vendor-misc`.

**Rationale**:
- RxDB chunk can be cached separately (rarely changes)
- Icon chunk is large (Lucide React ~24KB) and changes infrequently
- Smaller chunks = better cache hit rates

**Trade-offs**:
- Initial attempt caused circular chunk warnings (React deps in multiple chunks)
- Solved by keeping React with its dependencies in one chunk

**Alternatives considered**:
- **Automatic splitting**: Less control, larger initial chunk
- **HTTP/2 push**: Complex setup, limited browser support

---

## Decision 7: AI-Assisted Development Workflow

**Date**: 2026-05-04

**Status**: Accepted (experimental)

**Context**:
Complex domain modeling (16 knowledge graph domains), TypeScript strict mode, and performance optimization require iterative refinement.

**Decision**:
Use AI (opencode + superpowers) with subagent-driven development for parallel task execution.

**Rationale**:
- 4 subagents running in parallel (Dead Code, Core Fixes, Performance, Testing) saved ~70% iteration time
- Structured templates force clarity before coding
- AI catches TypeScript errors human review misses

**Trade-offs**:
- Occasional version conflicts (Playwright packages)
- Need human verification for architectural decisions
- Over-reliance on `any` types early on required later cleanup

**Alternatives considered**:
- **Traditional solo development**: Slower iteration, fewer parallel tasks
- **Pair programming**: Doesn't scale for documentation + code + tests simultaneously
