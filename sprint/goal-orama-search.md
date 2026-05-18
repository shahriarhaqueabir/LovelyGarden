# Goal: Orama Semantic-Quality Search Integration

**Status**: ✅ COMPLETE  
**Date**: 2026-05-10  
**Phase**: 3 — Intelligence

---

## What Was Achieved

Migrated the **Plant Knowledgebase** search engine from Fuse.js to **Orama**. This provides the app with a high-performance, ranked, typo-tolerant search that indexes rich plant metadata (soil types, pests, diseases, companions) in addition to basic names.

### Files Changed

| File                                       | Change                                                                                                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/plantSearch.ts`                   | **NEW**: Created a dedicated search module wrapping Orama. Handles schema definition, index lifecycle, and typed search execution.                   |
| `src/components/PlantKnowledgebaseTab.tsx` | Replaced Fuse.js implementation with the Orama module. Wired `buildPlantIndex` into the RxDB load effect and `searchPlants` into a debounced effect. |
| `package.json`                             | Added `@orama/orama@3.1.18`.                                                                                                                         |

---

## Key Decisions & Reasoning

### Why Orama over Fuse.js?

- **Ranked Results**: Orama uses BM25/vector-ready algorithms to provide significantly better relevance scoring than Fuse.js.
- **Typed Schema**: Orama enforces a schema, ensuring we index exactly what we intend and catch data mismatches early.
- **Typo Tolerance**: The built-in BK-tree support in Orama handles typos more elegantly than Fuse's fuzzy thresholding.
- **Future-Proof**: Orama is vector-ready, allowing us to easily add semantic search (embeddings) in Phase 4 if needed.

### Dropping Effect-TS (Pre-flight Scrutiny)

During investigation, we analyzed the `reasoning.ts` engine. It consists of ~120 lines of pure, synchronous functions.

- **Decision**: Dropped the Effect-TS refactor.
- **Reasoning**: The overhead of a full algebraic effect system for simple logic would be a net negative for bundle size and maintenance. We prioritized _correctness over complexity_.

### Async Search Wiring

Since Orama's `search` and `insert` are async, we moved the search logic into a `useEffect` with a cancellation token:

```typescript
useEffect(() => {
  let cancelled = false;
  searchPlants(debouncedQuery, plants).then((results) => {
    if (!cancelled) setFiltered(results.map((r) => r.document));
  });
  return () => {
    cancelled = true;
  };
}, [debouncedQuery, plants]);
```

This ensures the UI remains fluid even as the index grows.

---

## Lessons & Do's ✅

- **Do**: Perform "skeptical scrutiny" on all library additions. Dropping Effect-TS saved ~15-20kB of bundle bloat for logic that didn't need it.
- **Do**: Flatten nested JSON arrays into space-separated strings (`soil_type_text`, etc.) for Orama string indexing to maximize search coverage.
- **Do**: Wrap Orama in a dedicated module to keep the React component focused on UI.

---

## Next: Phase 4 — Premium Packaging (Tauri v2)
