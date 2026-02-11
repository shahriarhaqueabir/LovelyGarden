# Technical Specification: Garden Deck

This document provides a deep technical dive into the architecture, data structures, and logic systems of Garden Deck.

## 1. Architecture Overview

Garden Deck is a **Local-First Web Application** built as a **PWA (Progressive Web App)**. 

### Data Flow

1. **Source of Truth**: The local **RxDB** (IndexedDB) instance using the **Dexie** storage bucket.
2. **Hydration**: Static JSON files (`plants-kb.json`, `seeds.json`) are injected into the DB on the first load, establishing a baseline of **52 botanical species**.
3. **Reactivity**: Components subscribe to RxDB queries via custom hooks (`usePlantedCards`, `useInventory`), ensuring instant UI updates upon data mutation.
4. **State Management**: **XState 5** handles the deterministic progression of plant lifecycles.

## 2. Knowledge Graph: The 16 Domains

The application data is normalized into 16 domains, implemented as TypeScript interfaces in `src/schema/knowledge-graph.ts`.

### Core Domains

- **Domain 1: Time & Calendar**: Defines months, seasons, and growth stages.
- **Domain 2: Plant Species**: The master catalog with scientific grounding for 52 species.
- **Domain 3: Climate & Location**: Handles USDA zones, frost data, and localized (Dresden) assumptions.
- **Domain 7: Companion Relationships**: NPK-aware synergy and antagonism tables.
- **Domain 10: AI Reasoning Rules**: Rules for health calculation (e.g., "Hydration < 20% = Stress").
- **Domain 13: Explainability UI**: Standardized "Reasoning Payloads" for the Plant Inspector.

## 3. Database Schemas (RxDB)

We use **RxDB v15** with the **Dexie.js** storage bucket for persistent IndexedDB storage.

### Collections:

| Collection | Purpose | Primary Key |
| :--- | :--- | :--- |
| `catalog` | Reference data for plant growth stages | `id` |
| `plant_kb` | Authoritative horticultural data for 52 species | `plant_id` |
| `sources` | Authoritative source metadata (RHS, UC Davis) | `id` |
| `inventory` | Seeds currently held by the user ("Hand") | `id` |
| `planted` | Active plants in the grid with real-time metrics | `id` |
| `settings` | User location and global simulation day | `id` |

## 4. The Logic Engine

Located in `src/logic/`, the engine handles all non-trivial calculations.

### Logic Components

-   **Transition logic**: Determines when to trigger state transitions purely on the Global Clock delta.

### Plant Lifecycle (FSM)

-   Uses **Lazy Evaluation**: Plant stage is calculated by comparing `plantedDate` with the `durationDays` of each stage stored in the catalog.
-   This avoids background timers and preserves battery/performance on mobile devices.

### Reasoning Engine

-   **Companion Scores**: Iterates through neighbors in the grid (+/- 1 on X/Y) and sums benefits from the relationship table.

### Companion Scoring

-   **Synergy Calculation**: Compares the currently placed plant's `companion_plants` against its grid neighbors.
-   **Seasonal Sowing**: Compares the current month against the plant's `sowingSeason` array, adjusted for the user's `hemisphere`.

## 5. UI Component System

Built with **Tailwind CSS** and a "Grimoire" design system.

-   **GardenGrid**: Uses CSS Grid for the field.
-   **GridSlot**: A `useDroppable` container for plant cards.
-   **SeedCard**: A `useDraggable` component representing a packet in the user's hand.
-   **PlantInspector**: A backdrop-blur-2xl panel displaying real-time agronomic data and "Horticultural Integrity" proofs.

### Key Layouts

-   **The HUD**: Persistent header containing environment metrics and XP indicators.

## 6. Build & PWA

-   **Build Tool**: Vite with `vite-plugin-pwa`.
-   **Manifest**: Configuration for standalone installability on iOS and Android.
-   **Service Worker**: Caches assets for true offline functionality.
