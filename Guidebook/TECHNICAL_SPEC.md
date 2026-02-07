# Technical Specification: Garden Deck

This document provides a deep technical dive into the architecture, data structures, and logic systems of Garden Deck.

## 1. Architecture Overview

Garden Deck is a **Local-First Web Application** built as a **PWA (Progressive Web App)**. 

### Data Flow
1. **Source of Truth**: The local **RxDB** (IndexedDB) instance.
2. **Hydration**: Static JSON files (`seeds.json`, `sources.json`) are injected into the DB on the first load.
3. **Reactivity**: components subscribe to RxDB queries via custom hooks (`usePlantedCards`, `useInventory`), ensuring instant UI updates upon data mutation.
4. **State Management**: **XState** handles the deterministic progression of plant lifecycles.

## 2. Knowledge Graph: The 16 Domains

The application data is normalized into 16 domains, implemented as TypeScript interfaces in `src/schema/knowledge-graph.ts`.

### Core Domains
- **Domain 1: Time & Calendar**: Defines months, seasons, and growth stages.
- **Domain 2: Plant Species**: The master catalog of all horticultural possibilities.
- **Domain 3: Climate & Location**: Handles USDA zones, frost data, and hemisphere-aware logic.
- **Domain 7: Companion Relationships**: Binary and ternary relationships (Beneficial/Antagonistic).
- **Domain 10: AI Reasoning Rules**: The ruleset for recommendations (e.g., "Seedling requires water every 2 days").
- **Domain 13: Explainability UI**: Standardized "Reasoning Payloads" used by the Plant Inspector.

## 3. Database Schemas (RxDB)

We use **RxDB v15** with the **Dexie.js** storage bucket.

### Collections:
| Collection | Purpose | Primary Key |
| :--- | :--- | :--- |
| `catalog` | Reference data for plant species | `id` |
| `sources` | Authoritative source metadata | `id` |
| `inventory` | Seeds currently held by the user ("Hand") | `id` |
| `planted` | Plants placed in the grid | `id` |
| `settings` | User location and global config | `id` |

## 4. The Logic Engine

Located in `src/logic/`, the engine handles all non-trivial calculations.

### Plant Lifecycle (FSM)
- Uses **Lazy Evaluation**: Plant stage is calculated by comparing `plantedDate` with the `durationDays` of each stage stored in the catalog.
- This avoids background timers and preserves battery/performance on mobile devices.

### Reasoning Engine
- **Companion Scores**: Iterates through neighbors in the grid (+/- 1 on X/Y) and sums benefits from the relationship table.
- **Seasonal Sowing**: Compares the current month against the plant's `sowingSeason` array, adjusted for the user's `hemisphere`.

## 5. UI Component System

Built with **Tailwind CSS** and a "Grimoire" design system.

- **GardenGrid**: Uses CSS Grid for the field.
- **GridSlot**: A `useDroppable` container for plant cards.
- **SeedCard**: A `useDraggable` component representing a packet in the user's hand.
- **PlantInspector**: A backdrop-blur-2xl panel displaying real-time agronomic data and "Horticultural Integrity" proofs.

## 6. Build & PWA
- **Build Tool**: Vite with `vite-plugin-pwa`.
- **Manifest**: Configuration for standalone installability on iOS and Android.
- **Service Worker**: Caches assets for true offline functionality.
