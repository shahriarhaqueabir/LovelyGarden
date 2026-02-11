# Task: Per-Garden Theming Implementation

This task tracks the implementation of customizable background colors and themes for individual garden spaces, while locking the global UI to a consistent dark aesthetic.

## Objectives
- [x] **Database Schema Update**: Add `backgroundColor` and `theme` properties to the `gardens` collection.
- [x] **Config Dialog Enhancement**: Add color/theme selection to the garden creation/edit modal.
- [x] **Dynamic Background Rendering**: Update `VirtualGardenTab` to apply these styles per-garden.
- [x] **UI Lock & Cleanup**: Comment out global mode toggles and enforce `#090c0a` as the primary UI color.

## Step 1: Schema & Hydration
- Add `backgroundColor` (string) to `gardenSchema` in `src/db/schemas.ts`.
- Update demo gardens in `src/db/index.ts` to have distinct initial themes.

## Step 2: Configuration Dialog
- Update `GardenConfigDialog.tsx` to include a set of preset "Biomes" (e.g., Forest, Desert, Midnight) that set the background.

## Step 3: Active Garden Rendering
- Modify `VirtualGardenTab.tsx` center pane to use the active garden's color.
- Ensure the header, sidebar, and inspector remains `#090c0a`.

## Step 4: Theme/Mode Lock
- Comment out the theme mode (light/dark) logic in `SettingsTab.tsx`.
- Remove or comment out global mode effects in `App.tsx`.
