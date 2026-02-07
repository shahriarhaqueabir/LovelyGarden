# Garden Deck Implementation - TODO

## Phase 1: Shop Module Enhancements ✅ COMPLETE
- [x] SeedStore.tsx: Add DetailModal component for plant details (growth stages, soil/water needs, companion logic)
- [x] SeedStore.tsx: Implement isSowingSeason check for Dresden (Zone 7b) with WarningBadge
- [x] SeedStore.tsx: Connect "Buy" action to move deep copy to Bag (Inventory)

## Phase 2: Bag Module Enhancements (formerly Purchased) ✅ COMPLETE
- [x] InventoryTray.tsx: Add "Delete" action for inventory items with confirmation

- [x] VirtualGardenTab.tsx: Add grid capacity check before allowing plant placement
- [x] VirtualGardenTab.tsx: Show UserToast when grid is full ("Expand Grid to Plant")

## Phase 4: Command Center Transformation — SPRINT 1 (In Progress)

- [x] Environment HUD: Visual architecture for Sun/Moisture/Temp in Header
- [ ] Environment HUD: Replace mock weather with real-world Dresden API (OpenWeatherMap)
- [x] Data Expansion: Expanded to 52 plant species with scientific grounding
- [ ] Data Expansion: Implement "Varietal Branching" for specific heirloom types
- [x] Simulation: Day Advancement/Rewind logic implemented in queries.ts
- [ ] Simulation: Implement "Time-Scrubbing Slider" UI for year/month selection

## Phase 5: Horticultural Depth — SPRINT 2 (Planned)

- [ ] Ritual Actions: Implement "Water" and "Fertilize" backend logic
- [ ] Ritual Actions: Add NPK nutrient depletion model (0.1% per day per plant)
- [ ] Health Simulation: Integrate Weather impacts (Rain replenishes hydration)
- [ ] Health Simulation: Implement "Sunlight Sufficiency" logic based on day-of-year

## Phase 6: Diagnostics & Journaling — SPRINT 3 (Planned)

- [ ] Diagnostic Engine: Trigger "Pest/Disease" alerts based on KB thresholds
- [ ] Diagnostic Engine: Add "Clinical Explanation" modal via Inspector
- [ ] Journaling: Auto-log planting/harvest/death events to local 'Grimoire' history
- [ ] Journaling: Add photo upload/note support for physical garden sync

## Phase 7: Optimization & PWA Excellence — SPRINT 4 (Planned)

- [ ] Performance: Web Worker offloading for bulk simulation updates
- [ ] UI/UX: Accessibility audit (ARIA labels, keyboard navigation)
- [ ] Deployment: Multi-garden-bed support expansion

---

## 🛠️ ACTUAL SYSTEM STATUS: 🟢 ACTIVE DEVELOPMENT

### Current Milestones

1. **The Great Expansion**: 52 Species are live in `plants-kb.json`.
2. **Temporal Logic**: Day hopping is functional; slider UI is pending.
3. **Local-First Core**: RxDB state is fully reactive and persisted.

### Pivots & Decisions
- **Pivot**: Phase 4 "State Management Matrix" was expanded into the "Command Center Transformation" to handle significantly higher data density.
- **Decision**: Locked in **Dexie.js** as the storage layer for its stability with RxDB v15+.
- **Decision**: All plant stage calculations are **Lazy Evaluated** at runtime rather than using background intervals to save mobile battery.
