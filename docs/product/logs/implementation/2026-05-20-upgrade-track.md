# Implementation Log: Upgrade Track

Date: 2026-05-20

## Created

- Product roadmap: `docs/product/roadmap/upgrade-roadmap.md`
- Ticket folders by track:
  - `01-sync`
  - `02-guidance`
  - `03-garden-interaction`
  - `04-data`
  - `05-accessibility`
- Tickets LG-001 through LG-015 with Definition of Done and acceptance criteria.

## Implemented Before This Log

- Connected status badge in header.
- Garden Guide empty-state starter actions.
- Placement preview labels during drag.
- Garden health HUD score and care counters.
- Undo toast for planting and moving.
- RxDB query-builder plugin registration for Guide context queries.
- Drag overlay/grid sizing stabilization.

## Next Work Item

LG-011 Backup And Restore hardening:

- Current utility exports only inventory, planted, settings.
- Import schema incorrectly validates inventory as plant species.
- Add gardens and logbook to export/import.
- Make imports validate document-shaped data and remain merge-safe.

## LG-011 Slice Completed

- Export version moved from `1` to `2`.
- Export now includes `gardens` and `logbook` alongside inventory, planted, and settings.
- Import validation now uses document-shaped schemas for inventory, planted, gardens, and logbook.
- Import remains merge-safe via `bulkUpsert`.
- Added regression coverage for malformed backup rejection.
- Settings UI now explains what JSON backups contain and that import merges rather than wipes.
- Import result status is visible in the Settings developer panel.

## LG-001 Slice Completed

- Added pending-local tracking to the shared sync status snapshot.
- Added an account-level retry service that upserts local gardens, inventory, planted crops, logbook entries, and settings to Supabase.
- Wired browser online recovery to retry pending local sync work automatically.
- Updated the header error state label from `Sync Issue` to `Needs Retry`.
- Added unit coverage for pending-local status clearing after successful sync.
- Added an optional `test:rls` verification script for cross-account Supabase row isolation.
- Known limitation: offline deletes still need durable tombstones before they can retry after reconnect.

## LG-002 Slice Completed

- Added a Plant Inspector timeline built from planted date, last watered date, current lifecycle stage, and observations.
- Added a garden-level recent activity strip above the tactical field for planted, watered, moved, harvest, loss, and observation events.
- Added move logbook entries when plants are relocated.
- Labeled move undo actions as `move_undo` logbook events so timeline history does not look like a normal second move.
- Updated Logbook visual treatment for move events.
- Added empty-state language for gardens that have no timeline activity yet.
- Updated LG-002 to track remaining event-model gaps for removed-plant detail history.

## LG-009 Slice Completed

- Added a compact Today care strip to the active garden view.
- Derived `Now` tasks from thirsty plants, stressed/pest-risk plants, and active weather alerts.
- Derived `Next` tasks from harvest-ready plants and in-season inventory seeds when cells are open.
- Wired task buttons to plant inspector, Plant Now filtering, or health layer review.
- Added an all-clear state when no care tasks are due.

## LG-008 Slice Completed

- Replaced the basic health number with a deterministic factor model.
- Added explainable health factors for hydration, stress, pest risk, and garden capacity.
- Added pest count to the HUD summary when pest risk is present.
- Added a Health factor strip in the active garden view.
- Left season-fit and companion-score factors for a later scoring pass.
