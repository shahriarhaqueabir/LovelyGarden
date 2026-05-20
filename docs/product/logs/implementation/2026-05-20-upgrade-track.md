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
