# Library Integration TODO

## Phase 1: Install Dependencies ✅ COMPLETE
- [x] Add all required dependencies to package.json
- [x] Run pnpm install


## Phase 2: Create Infrastructure Files ✅ COMPLETE
- [x] Create src/lib/toast.ts - Toast utility wrapper
- [x] Create src/lib/i18n.ts - i18n configuration
- [x] Create src/components/ErrorBoundary.tsx - Error boundary wrapper
- [x] Create src/stores/appStore.ts - Zustand store
- [x] Create src/lib/axios.ts - Axios instance


## Phase 3: Replace Custom Toasts with react-hot-toast ✅ COMPLETE
- [x] Update VirtualGardenTab.tsx - Replace custom Toast
- [x] Update InventoryTray.tsx - Replace custom Toast
- [x] Add Toaster provider to main.tsx
- [x] Remove old Toast components


## Phase 4: Add Virtualization for Large Lists ✅ COMPLETE
- [x] Update SeedInventoryTab.tsx - Add @tanstack/react-virtual
- [x] Update PlantKnowledgebaseTab.tsx - Add virtualization


## Phase 5: Integrate Headless UI Components
- [ ] Refactor Tabs.tsx with Headless UI
- [ ] Update GardenConfigDialog with Headless UI Dialog
- [ ] Update SeedStore modal with Headless UI

## Phase 6: Add react-hook-form + Zod Validation
- [ ] Update GardenConfigDialog.tsx - Form validation
- [ ] Update SettingsTab.tsx - Form handling

## Phase 7: Add Error Boundaries
- [ ] Create ErrorBoundary wrapper component
- [ ] Wrap App components in ErrorBoundary

## Phase 8: Additional Integrations
- [ ] Replace date-fns with dayjs in weather/sowing calculations
- [ ] Add axios instance and replace fetch calls
- [ ] Add i18n translations and provider

## Phase 9: Testing & Cleanup
- [ ] Verify all integrations work
- [ ] Test form validations
- [ ] Check virtualization performance
- [ ] Ensure no console errors
