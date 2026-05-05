# Architecture - LovelyGarden

## High-Level Design

LovelyGarden follows a **modular, offline-first architecture** with clear separation between UI, state, logic, and data layers.

---

## System Diagram

```
┌───────────┐
│                        UI Layer (React)                    │
│  Tabs: VirtualGarden | SowingCalendar | Knowledgebase │
│        SeedStore | Weather | Logbook | Settings        │
└──────────────────────┬──────────────────────────────┘
                         │
┌──────────────────────▼──────────────────────────────┐
│                   State Management                      │
│  Zustand (weatherStore) | React Query (server state)  │
└──────────────────────┬──────────────────────────────┘
                         │
┌────────────────────▼───────────────────────────────┐
│                   Logic Layer                          │
│  XState (plant lifecycle) | Reasoning (companion)   │
│  Forecasting | Diagnostics | Explainability        │
└──────────────────────┬──────────────────────────────┘
                         │
┌────────────────────▼───────────────────────────────┐
│                   Data Layer                          │
│  RxDB (IndexedDB) → Collections:                 │
│    catalog, planted, inventory, settings, logbook    │
│  Zod (validation) | Dexie.js (storage adapter)      │
└───────────────────┘

---

## Component Breakdown

### UI Layer (`src/components/`)
| Component | Responsibility |
|----------|----------------|
| `VirtualGardenTab` | Grid-based garden with DnD, growth visualization |
| `SowingCalendarTab` | Seasonal planning, month scrubber |
| `PlantKnowledgebaseTab` | 100+ species, fuzzy search, growth graphs |
| `SeedStore` / `SeedInventoryTab` | Purchase, inventory, bag management |
| `WeatherForecastTab` | Open-Meteo integration, frost alerts |
| `LogbookTab` | Activity logging (CRUD) |
| `SettingsTab` | Theme, language, data management |
| `GardenGrid` | Drag-and-drop grid with companion scoring |
| `PlantedCard` | Individual plant card with lifecycle stages |

### Logic Layer (`src/logic/`)
| Module | Responsibility |
|--------|----------------|
| `lifecycle.ts` | XState state machine: seed → germination → harvest |
| `reasoning.ts` | Companion/antagonist scoring, seasonal eligibility |
| `forecasting.ts` | Weather-based predictions |
| `diagnostics.ts` | Plant health analysis |
| `explainability.ts` | User-facing decision explanations |

### Data Layer (`src/db/`)
| File | Responsibility |
|------|----------------|
| `schemas.ts` | RxDB JSON schemas with migration strategies |
| `queries.ts` | Database CRUD operations |
| `export-import.ts` | JSON backup/restore with Zod validation |
| `index.ts` | DB initialization, RxDB plugins, data synthesis |

### State Management (`src/stores/`, `src/hooks/`)
| Store/Hook | Responsibility |
|------------|----------------|
| `weatherStore` | Current weather, forecasts, location |
| `usePlantedCards` | Planted garden items |
| `useInventory` | Seed bag/inventory |
| `useLogbook` | Activity entries |
| `useWeather` | Weather data fetching |

---

## Data Flow Examples

### Planting a Seed
1. User drags seed from `SeedStore` → `GardenGrid`
2. `usePlantedCards` hook calls `db.planted.insert()`
3. XState machine initializes → `seed` state
4. `VirtualGardenTab` re-renders grid with new plant
5. XP awarded → `useGamification` updates level

### Searching the Knowledgebase
1. User types in `PlantKnowledgebaseTab` search input
2. `debounce.ts` waits 300ms
3. `fuse.js` performs fuzzy search on `mergedCatalog`
4. `useMemo` recalculates `filtered` list
5. Virtualized list re-renders with results

---

## Key Design Decisions

### Why RxDB over Firebase / Supabase?
**Decision**: Use RxDB (IndexedDB) for local-first architecture.

**Reason**:
- Gardeners work offline (greenhouses, remote plots)
- No server costs for personal use
- RxDB replication plugin enables future sync

**Trade-off**: No multi-user collaboration yet.

### Why XState for Lifecycle?
**Decision**: Model plant growth as a finite state machine.

**Reason**:
- Plant stages are deterministic (germination → seedling → harvest)
- XState provides visualization and testing tools
- Easy to extend with environmental triggers

**Trade-off**: Learning curve for contributors unfamiliar with state machines.

### Why Fuse.js + Debounce?
**Decision**: Client-side fuzzy search with 300ms debounce.

**Reason**:
- Plant names have typos, synonyms, scientific names
- Debouncing prevents excessive recalculation
- Fuse.js handles "tomato" vs "Tomato" vs "Solanum lycopersicum"

**Trade-off**: Large catalogs (>1000 items) may need server-side search.

---

## Technology Choices

| Technology | Why? |
|------------|------|
| **Vite 5** | Fast HMR, PWA plugin, Rollup bundling |
| **React 18** | Concurrent features, mature ecosystem |
| **TypeScript** | Type-safe domain modeling (PlantStage, Season, etc.) |
| **Tailwind CSS** | Rapid theming, consistent design tokens |
| **Zod** | Runtime validation for JSON imports, API responses |
| **TanStack Query** | Server state caching for weather API |
| **@dnd-kit** | Accessible drag-and-drop for garden grid |
| **Framer Motion** | Smooth animations for plant growth, transitions |
| **i18next** | Multi-language support (EN/DE) |

---

## Migration Strategy

RxDB migrations in `schemas.ts` handle schema evolution:

```typescript
plantedMigrationStrategies = {
  '1': (oldDoc) => ({ ...oldDoc, observations: [] }),      // v0→v1
  '2': (oldDoc) => ({ ...oldDoc, systemDiagnosis: '' }),       // v1→v2
  '3': (oldDoc) => ({ ...oldDoc, observations: oldDoc.observations || [] }), // v2→v3
}
```

**Pattern**: Always additive, never destructive. Use `oldDoc.observations || []` for backward compatibility.

---

## Security Considerations

- **Input validation**: Zod schemas for all JSON imports (`export-import.ts`)
- **No secrets in client**: `dotenv` + `VITE_` prefix for environment variables
- **CSP headers**: Missing (opportunity for Express server)
- **Service Worker**: Precaches assets, uses `StaleWhileRevalidate` for weather API

---

## Performance Optimizations

- **Code splitting**: Vendor chunks (db, icons, misc) for faster initial load
- **Lazy loading**: `GrowthGraph`, `ObservationTerminal` via `React.lazy`
- **Debounced search**: 300ms delay prevents excessive filtering
- **Fuzzy search**: Fuse.js for tolerant plant name matching
- **DB indexes**: `bedId`, `catalogId`, `date` for query performance
- **WebP images**: `garden-bg.png` → WebP with PNG fallback
- **React.memo**: `Modal`, `PlantedCardView` to prevent unnecessary re-renders

---

## Testing Strategy

| Layer | Tool | Coverage |
|-------|------|---------|
| Logic | Vitest | 17 tests (lifecycle, reasoning) |
| Components | React Testing Library | 9 tests (SeedStore) |
| E2E | Playwright | 6 tests (settings, seed store) |
| Build | TypeScript strict mode | 0 errors |
| Lint | ESLint v10 | 0 errors, 6 warnings |

**Total**: 26 unit tests + E2E coverage expanding.
